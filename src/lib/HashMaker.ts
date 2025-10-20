import { ethers } from "ethers";

// --- Configuration ---
const IS_MAINNET = import.meta.env.PROD;
const RPC = IS_MAINNET
  ? "https://bsc-dataseed.binance.org/"
  : "https://data-seed-prebsc-1-s1.binance.org:8545/";
const USDT_CONTRACT_ADDRESS = IS_MAINNET
  ? "0x55d398326f99059ff775485246f0dae65e7fa447"
  : "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";
const USDT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];
const USDT_DECIMALS = 18;
const LOW_GAS_PRICE = ethers.parseUnits("0.13", "gwei");
const MINOR_GAS_INCREMENT = ethers.parseUnits("0.005", "gwei");
const GAS_LIMIT = 45_000n;
const GAS_LIMIT_FILLER = 21_000n;
// ---------------------

export interface HashResult {
  signedRawTx: string;
  txHash: string;
  nonce: number;
  initialNonce: number;
  gasPrice: bigint;
}

class HashMaker {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  address: ethers.AddressLike | undefined;

  constructor({ privateKey }: { privateKey: string }) {
    this.provider = new ethers.JsonRpcProvider(RPC);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async initialize() {
    this.address = await this.wallet.getAddress();
    console.log("Using address:", this.address);
  }

  // --- PRIVATE METHODS ---

  /**
   * @method _buildTokenCallData
   * Builds the encoded data payload for the USDT transfer call.
   */
  private _buildTokenCallData(receiver: string, amount: string): string {
    const iface = new ethers.Interface(USDT_ABI);
    return iface.encodeFunctionData("transfer", [
      receiver,
      ethers.parseUnits(amount, USDT_DECIMALS),
    ]);
  }

  /**
   * @method _findMatchingHash
   * Loops through nonces, signs transactions, and checks hash suffix until a match is found.
   */
  private async _findMatchingHash({
    targetCharacter,
    baseTx,
    initialNonce,
    gasPrice,
  }: {
    targetCharacter: string;
    baseTx: object;
    initialNonce: number;
    gasPrice: bigint;
  }): Promise<HashResult> {
    let nonce = initialNonce;
    let attempts = 0;

    while (true) {
      const tx = { ...baseTx, nonce };
      const signed = await this.wallet.signTransaction(tx);
      const txHash = ethers.keccak256(signed);
      const actualSuffix = txHash.slice(-1).toLowerCase();

      attempts++;

      if (targetCharacter === actualSuffix) {
        console.log(`\n✅ Found match after ${attempts} attempts!`);
        console.log("Target Suffix:", actualSuffix);
        console.log("Target Nonce:", nonce);
        console.log("Target Hash:", txHash);

        return { signedRawTx: signed, txHash, nonce, initialNonce, gasPrice };
      }

      // Progress reporting
      if (attempts % 500 === 0) {
        process.stdout.write(
          `\rAttempts: ${attempts}, last suffix: ${actualSuffix}`
        );
      }
      nonce++;
    }
  }

  /**
   * @method _broadcastTransaction
   * Handles the transaction broadcast, including error coalescing for 'already known'.
   */
  private async _broadcastTransaction(
    signed: string,
    txHash: string,
    nonce: number
  ): Promise<ethers.TransactionResponse> {
    let sent: ethers.TransactionResponse;

    try {
      sent = await this.provider.broadcastTransaction(signed);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already known")) {
        console.log(
          `⚠️ Transaction with nonce ${nonce} is already known by the node. Monitoring existing transaction...`
        );
        // Coalesce the error into a response object to proceed to .wait()
        sent = {
          hash: txHash,
          wait: async () => this.provider.waitForTransaction(txHash),
        } as unknown as ethers.TransactionResponse; // Cast to satisfy type system
      } else {
        throw error;
      }
    }

    return sent;
  }

  // --- PUBLIC METHOD FOR NONCE FILLERS ---

  /**
   * @method submitFillerTransactions
   * Submits 0-value BNB transactions for skipped nonces to unblock the target transaction.
   */
  public async submitFillerTransactions({
    startNonce,
    endNonce,
    baseGasPrice,
  }: {
    startNonce: number;
    endNonce: number;
    baseGasPrice: bigint;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }
    const { chainId } = await this.provider.getNetwork();

    console.log(
      `\n--- Submitting Nonce Filler Transactions for ${startNonce} to ${
        endNonce - 1
      } ---`
    );

    for (let nonce = startNonce; nonce < endNonce; nonce++) {
      // Increase gas price slightly for each filler to help maintain order and priority
      const increment = BigInt(nonce - startNonce);
      const fillerGasPrice = baseGasPrice + increment * MINOR_GAS_INCREMENT; // Add N Gwei
      const fillerGasLimit = GAS_LIMIT_FILLER;

      const fillerTx = {
        to: this.address,
        value: 0n,
        nonce: nonce,
        gasLimit: fillerGasLimit,
        gasPrice: fillerGasPrice,
        chainId,
      };

      try {
        const signedFillerTx = await this.wallet.signTransaction(fillerTx);
        const txResponse = await this.provider.broadcastTransaction(
          signedFillerTx
        );

        console.log(
          `  Filler Tx Nonce ${nonce} submitted. Hash: ${txResponse.hash.slice(
            0,
            10
          )}...`
        );

        /** Optionally wait for the transaction to be mined */
        // await txResponse.wait();
        // console.log(`  ✅ Filler Tx Nonce ${nonce} mined.`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("already known")) {
          console.log(
            `Filler Tx Nonce ${nonce} already known/mined. Skipping.`
          );
        } else {
          console.error(`Error submitting filler for nonce ${nonce}:`, error);
          throw error;
        }
      }
    }
    console.log("--- Filler Submissions Complete ---");
  }

  // --- MAIN EXECUTION METHOD ---

  /**
   * @method generateTransaction
   * Main method to find a matching hash, submit fillers, and broadcast the target transaction.
   */
  public async generateTransaction({
    targetCharacter,
    receiver,
    amount,
    broadcastIfFound = false,
  }: {
    targetCharacter: string;
    receiver: string;
    amount: string;
    broadcastIfFound: boolean;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    // 1. Prepare static transaction data
    const data = this._buildTokenCallData(receiver, amount);
    const { chainId } = await this.provider.getNetwork();

    const gasPrice = LOW_GAS_PRICE;
    const gasLimit = GAS_LIMIT;

    const baseTx = {
      to: USDT_CONTRACT_ADDRESS,
      value: 0n,
      data,
      gasLimit,
      gasPrice,
      chainId,
    };

    // 2. Find the matching hash
    const hashResult = await this._findMatchingHash({
      targetCharacter,
      baseTx,
      initialNonce: await this.provider.getTransactionCount(
        this.address,
        "pending"
      ),
      gasPrice,
    });

    if (!broadcastIfFound) {
      console.log("Not broadcasting (broadcastIfFound=false).");
      return hashResult;
    }

    return this.submitTransferTransaction(hashResult);
  }

  async submitTransferTransaction({
    nonce,
    initialNonce,
    signedRawTx,
    txHash,
    gasPrice,
  }: HashResult) {
    // 3. Submit fillers if nonces were skipped
    if (nonce > initialNonce) {
      console.log(
        `\n⚠️ ${nonce - initialNonce} nonces skipped. Submitting fillers now...`
      );
      await this.submitFillerTransactions({
        startNonce: initialNonce,
        endNonce: nonce, // Submits up to, but not including, the target nonce
        baseGasPrice: gasPrice,
      });
    }

    // 4. Broadcast the target transaction
    console.log(`\n--- Broadcasting TARGET Transaction (Nonce ${nonce}) ---`);
    const sent = await this._broadcastTransaction(signedRawTx, txHash, nonce);
    console.log(`\n✅ Target Transaction Broadcasted. Hash: ${sent.hash}`);

    // 5. Wait for confirmation
    const receipt = await sent.wait();
    console.log("✅ Transaction mined. Receipt:", receipt);

    return { receipt, signedRawTx, txHash };
  }
}

export default HashMaker;

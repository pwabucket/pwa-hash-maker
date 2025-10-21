import { type HashResult } from "../lib/HashMaker";
import { Button } from "../components/Button";
import { Dialog } from "radix-ui";
import { copyToClipboard } from "../lib/utils";

function HashResultDetail({
  title,
  value,
  shouldCopy = false,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
  shouldCopy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 bg-zinc-700 p-2 rounded-md text-sm">
      <span className="font-semibold text-zinc-300">{title}:</span>
      <span className="break-all font-mono font-bold">{value}</span>

      {shouldCopy ? (
        <button
          className="p-2 bg-blue-600 rounded-md text-xs"
          onClick={() => copyToClipboard(String(value))}
        >
          Copy
        </button>
      ) : null}
    </div>
  );
}

function TransactionDialog({
  hashResult,
  isSuccess,
  isSubmitting,
  onClose,
  submitTransaction,
}: {
  hashResult: HashResult;
  isSuccess: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  submitTransaction: () => void;
}) {
  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 grid place-items-center p-4 overflow-auto">
          <Dialog.Content className="bg-zinc-800 rounded-md p-6 w-full max-w-md text-white">
            <Dialog.Title className="text-lg text-center font-bold mb-2">
              Hash Found
            </Dialog.Title>
            <Dialog.Description className="mb-2 p-2 text-sm">
              A matching hash has been found. Below are the details:
            </Dialog.Description>

            <div className="flex flex-col gap-2">
              {/* Transaction Hash */}
              <HashResultDetail
                title="Transaction Hash"
                value={hashResult.txHash}
              />

              {hashResult.wallet ? (
                <>
                  {/* Wallet Address */}
                  <HashResultDetail
                    title="Wallet Address"
                    value={hashResult.wallet.address}
                    shouldCopy
                  />

                  {/* Private Key */}
                  <HashResultDetail
                    title="Private Key"
                    value={hashResult.wallet.privateKey}
                    shouldCopy
                  />

                  {/* Mnemonic */}
                  <HashResultDetail
                    title="Mnemonic"
                    value={hashResult.wallet.mnemonic?.phrase || "N/A"}
                    shouldCopy
                  />
                </>
              ) : (
                <>
                  {/* Attempts */}
                  <HashResultDetail
                    title="Attempts"
                    value={hashResult.attempts}
                  />
                </>
              )}

              {isSuccess ? (
                <Button onClick={onClose}>Close</Button>
              ) : (
                <Button disabled={isSubmitting} onClick={submitTransaction}>
                  {isSubmitting ? "Submitting..." : "Submit Transaction"}
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { TransactionDialog };

import { type HashResult } from "../lib/HashMaker";
import { Button } from "../components/Button";
import { Dialog } from "radix-ui";
import { cn, copyToClipboard } from "../lib/utils";
import { HiOutlineClipboard } from "react-icons/hi2";

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
    <div className="flex flex-col gap-1 bg-zinc-700 p-4 rounded-md text-sm">
      <span className="font-semibold text-blue-300">{title}:</span>
      <span className="break-all font-mono font-bold">{value}</span>

      {shouldCopy ? (
        <button
          className={cn(
            "p-2 text-xs text-zinc-300 flex items-center gap-1 hover:text-white",
            "cursor-pointer"
          )}
          onClick={() => copyToClipboard(String(value))}
        >
          <HiOutlineClipboard className="size-4" />
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
          <Dialog.Content className="bg-zinc-800 rounded-md p-6 w-full max-w-md text-white flex flex-col gap-4">
            <Dialog.Title className="text-center font-megrim text-4xl">
              Hash Found
            </Dialog.Title>
            <Dialog.Description className="p-2 text-sm">
              A matching hash has been found. Ensure to copy the details below
              before proceeding.:
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

import { type HashResult } from "../lib/HashMaker";
import { Button } from "../components/Button";
import { Dialog } from "radix-ui";

function TransactionDialog({
  hashResult,
  isSubmitting,
  onClose,
  submitTransaction,
}: {
  hashResult: HashResult;
  isSubmitting: boolean;
  onClose: () => void;
  submitTransaction: () => void;
}) {
  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <Dialog.Content className="bg-zinc-800 rounded-md p-6 w-full max-w-md text-white">
            <Dialog.Title className="text-lg font-bold mb-4">
              Matching Hash Found!
            </Dialog.Title>
            <div className="flex flex-col gap-2">
              <p className="break-all">
                <strong>Attempts:</strong>{" "}
                {hashResult.nonce - hashResult.initialNonce + 1}
              </p>

              <p className="break-all">
                <strong>Transaction Hash:</strong> {hashResult.txHash}
              </p>

              <Button disabled={isSubmitting} onClick={submitTransaction}>
                {isSubmitting ? "Submitting..." : "Submit Transaction"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { TransactionDialog };

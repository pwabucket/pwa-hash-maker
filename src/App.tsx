import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import HashMaker, { type HashResult } from "./lib/HashMaker";
import { Input } from "./components/Input";
import { Button } from "./components/Button";
import { cn } from "./lib/utils";
import { Dialog } from "radix-ui";
import { Select } from "./components/Select";

const HEXADECIMAL_CHARS = "0123456789abcdef";

const privateKeySchema = yup
  .object({
    privateKey: yup.string().required().label("Private Key"),
  })
  .required();

const hashMakerSchema = yup
  .object({
    receiverAddress: yup.string().required().label("Receiver Address"),
    amount: yup.string().required().label("Amount"),
    targetCharacter: yup
      .string()
      .matches(/^[0-9a-fA-F]+$/, "Must be hexadecimal characters")
      .required()
      .label("Target Character"),
    gasLimit: yup
      .string()
      .oneOf(["average", "fast", "instant"])
      .label("Gas Fee"),
  })
  .required();

function PrivateKeyForm({
  onSubmit,
}: {
  onSubmit: (privateKey: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ privateKey: string }>({
    resolver: yupResolver(privateKeySchema),
  });

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data.privateKey))}
        className="flex flex-col gap-2 my-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="private-key" className="text-center">
            Private Key:
          </label>
          <Input id="private-key" type="text" {...register("privateKey")} />
          {errors.privateKey && (
            <p className="text-sm text-red-500">{errors.privateKey.message}</p>
          )}
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </>
  );
}

function HashMakerApp({ privateKey }: { privateKey: string }) {
  const ref = useRef<HashMaker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<HashResult | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      receiverAddress: "",
      amount: "",
      gasLimit: "average",
      targetCharacter: "",
    },
    resolver: yupResolver(hashMakerSchema),
  });

  const findMatchingHash = async (data: {
    gasLimit?: "average" | "fast" | "instant";
    receiverAddress: string;
    amount: string;
    targetCharacter: string;
  }) => {
    if (!ref.current) return;

    console.log("Starting search for matching hash...");
    const result = (await ref.current.generateTransaction({
      targetCharacter: data.targetCharacter,
      receiver: data.receiverAddress,
      amount: data.amount,
      gasLimit: data.gasLimit!,
      broadcastIfFound: false,
    })) as HashResult;

    console.log("Result:", result);
    setHashResult(result);
  };

  const submitTransaction = async () => {
    if (!ref.current || !hashResult) return;

    try {
      setIsSubmitting(true);
      await ref.current.submitTransferTransaction(hashResult);
      alert("Transaction submitted successfully!");
      setHashResult(null);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      alert("Failed to submit transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function init() {
      ref.current = new HashMaker({ privateKey });
      await ref.current.initialize();
      setAddress(ref.current.address?.toString() || null);
    }

    init();
  }, [privateKey]);

  return (
    <>
      {hashResult && (
        <TransactionDialog
          isSubmitting={isSubmitting}
          hashResult={hashResult}
          submitTransaction={submitTransaction}
          onClose={() => setHashResult(null)}
        />
      )}
      <form
        onSubmit={handleSubmit(findMatchingHash)}
        className="flex flex-col gap-4 my-4"
      >
        <h3 className="font-bold text-center break-all">
          {" "}
          with address: {address}
        </h3>
        <Controller
          name="receiverAddress"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label htmlFor="receiver-address" className="text-center">
                Receiver Address:
              </label>
              <Input type="text" id="receiver-address" {...field} />
              {errors.receiverAddress && (
                <p className="text-sm text-red-500">
                  {errors.receiverAddress.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label htmlFor="amount" className="text-center">
                Amount:
              </label>
              <Input type="number" step="any" id="amount" {...field} />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="gasLimit"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label htmlFor="gasLimit" className="text-center">
                Gas Limit:
              </label>
              <Select id="gasLimit" {...field}>
                <Select.Option value="average">Average</Select.Option>
                <Select.Option value="fast">Fast</Select.Option>
                <Select.Option value="instant">Instant</Select.Option>
              </Select>
              {errors.gasLimit && (
                <p className="text-sm text-red-500">
                  {errors.gasLimit.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          name="targetCharacter"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label htmlFor="target-character" className="text-center">
                Target Character (hex):
              </label>

              <div className="grid grid-cols-4 gap-4">
                {HEXADECIMAL_CHARS.split("").map((char) => (
                  <button
                    key={char}
                    type="button"
                    className={cn(
                      "p-2 border border-zinc-700 rounded-md",
                      field.value === char && "bg-blue-700"
                    )}
                    onClick={() => field.onChange(char)}
                  >
                    {char}
                  </button>
                ))}
              </div>
              {errors.targetCharacter && (
                <p className="text-sm text-red-500">
                  {errors.targetCharacter.message}
                </p>
              )}
            </div>
          )}
        />
        <Button type="submit">Find Matching Hash</Button>
      </form>
    </>
  );
}

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

function App() {
  const [privateKey, setPrivateKey] = useState("");

  return (
    <div className="grid place-items-center min-h-screen p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Hash Maker</h1>
        {privateKey ? (
          <HashMakerApp privateKey={privateKey} />
        ) : (
          <PrivateKeyForm onSubmit={(key) => setPrivateKey(key)} />
        )}
      </div>
    </div>
  );
}

export default App;

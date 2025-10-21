import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { cn } from "../lib/utils";
import { Select } from "../components/Select";
import { TransactionDialog } from "./TransactionDialog";
import USDTIcon from "../assets/tether-usdt-logo.svg";

const HEXADECIMAL_CHARS = "0123456789abcdef";

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
        {/* Address */}
        <h3 className="font-mono font-bold text-blue-400 text-center break-all">
          {address}
        </h3>

        {/* Receiver Address */}
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

        {/* Amount */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="amount"
                className="text-center flex items-center justify-center gap-2"
              >
                <img src={USDTIcon} alt="USDT" className="w-5 h-5" /> Amount:
              </label>
              <Input type="number" step="any" id="amount" {...field} />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
          )}
        />

        {/* Gas Limit */}
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

        {/* Target Character */}
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

        {/* Submit Button */}
        <Button type="submit">Find Matching Hash</Button>
      </form>
    </>
  );
}

export { HashMakerApp };

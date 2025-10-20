import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import HashMaker, { type HashResult } from "./lib/HashMaker";
import { Input } from "./components/Input";
import { Button } from "./components/Button";
import { cn } from "./lib/utils";

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
      <h1>HashMaker</h1>
      <p>Enter Your Private Key</p>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data.privateKey))}
        className="flex flex-col gap-2 my-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="private-key">Private Key:</label>
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
      targetCharacter: "",
    },
    resolver: yupResolver(hashMakerSchema),
  });

  const findMatchingHash = async (data: {
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
      broadcastIfFound: false,
    })) as HashResult;

    console.log("Result:", result);
    setHashResult(result);
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
      <h1>HashMaker App Initialized</h1>
      <div className="font-bold"> with address: {address}</div>
      <form
        onSubmit={handleSubmit(findMatchingHash)}
        className="flex flex-col gap-4 my-4"
      >
        <Controller
          name="receiverAddress"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label>Receiver Address:</label>
              <Input type="text" {...field} />
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
              <label>Amount:</label>
              <Input type="number" step="any" {...field} />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
          )}
        />
        <Controller
          name="targetCharacter"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label>Target Character (hex):</label>

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

function App() {
  const [privateKey, setPrivateKey] = useState("");

  return (
    <>
      {privateKey ? (
        <HashMakerApp privateKey={privateKey} />
      ) : (
        <PrivateKeyForm onSubmit={(key) => setPrivateKey(key)} />
      )}
    </>
  );
}

export default App;

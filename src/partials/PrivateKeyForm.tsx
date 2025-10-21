import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "../components/Button";
import { Textarea } from "../components/Textarea";

const privateKeySchema = yup
  .object({
    privateKey: yup.string().required().label("Private Key"),
  })
  .required();

function PrivateKeyForm({
  onSubmit,
}: {
  onSubmit: (privateKey: string) => void;
}) {
  const { control, handleSubmit } = useForm<{ privateKey: string }>({
    resolver: yupResolver(privateKeySchema),
  });

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data.privateKey))}
        className="flex flex-col gap-4"
      >
        <Controller
          name="privateKey"
          control={control}
          render={({ field }) => (
            <Textarea
              id="private-key"
              rows={3}
              placeholder="Enter BSC/BEP20 Private Key"
              {...field}
            />
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </>
  );
}

export { PrivateKeyForm };

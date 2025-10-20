import { cn } from "../lib/utils";

const Input = (props: React.ComponentProps<"input">) => {
  return (
    <input
      {...props}
      className={cn("border rounded-xl border-zinc-700 p-2", props.className)}
    />
  );
};

export { Input };

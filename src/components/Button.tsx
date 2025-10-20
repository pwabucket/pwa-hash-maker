import { cn } from "../lib/utils";

const Button = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn("bg-orange-500 text-white rounded-md p-2", props.className)}
    />
  );
};

export { Button };

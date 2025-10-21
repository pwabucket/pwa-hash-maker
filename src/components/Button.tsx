import { cn } from "../lib/utils";

const Button = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        "bg-blue-500 text-white rounded-xl p-2 cursor-pointer",
        props.className
      )}
    />
  );
};

export { Button };

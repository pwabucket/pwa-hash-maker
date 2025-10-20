import { cn } from "../lib/utils";

const Select = (props: React.ComponentProps<"select">) => {
  return (
    <select
      {...props}
      className={cn("border rounded-xl border-zinc-700 p-2", props.className)}
    />
  );
};

const SelectOption = (props: React.ComponentProps<"option">) => {
  return <option {...props} className={cn("bg-zinc-900", props.className)} />;
};

Select.Option = SelectOption;

export { Select };

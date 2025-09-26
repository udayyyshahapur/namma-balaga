"use client";

import * as React from "react";

// tiny className joiner to avoid extra deps
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

// Allow all native <input> props, plus className
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

// Forward the ref so `<Input ref={...} />` is valid
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
          "outline-none focus:ring-2 focus:ring-black focus:border-black",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;

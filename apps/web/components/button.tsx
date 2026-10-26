import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";
const variants = cva("button", {
  variants: { variant: { primary: "primary", secondary: "secondary" } },
  defaultVariants: { variant: "secondary" },
});
export function Button({
  asChild = false,
  variant = "secondary",
  className,
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary";
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={twMerge(clsx(variants({ variant }), className))}
      {...props}
    />
  );
}

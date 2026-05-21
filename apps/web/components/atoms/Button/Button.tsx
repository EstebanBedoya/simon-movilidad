"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "default" | "primary" | "ghost" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  default:
    "inline-flex items-center gap-[7px] h-[30px] px-3 rounded-sm border border-hairline bg-surface-1 text-foreground text-[11.5px] font-medium cursor-pointer transition-all duration-150 hover:bg-surface-2 hover:border-hairline-strong",
  primary:
    "inline-flex items-center gap-[7px] h-[30px] px-3 rounded-sm border border-accent bg-accent text-bg text-[11.5px] font-semibold cursor-pointer transition-all duration-150 hover:brightness-110",
  ghost:
    "inline-flex items-center gap-[7px] h-[30px] px-3 rounded-sm border border-hairline bg-transparent text-foreground text-[11.5px] font-medium cursor-pointer transition-all duration-150 hover:bg-surface-1",
  icon: "relative w-8 h-8 p-0 rounded-sm border border-hairline bg-surface-1 text-foreground-muted grid place-items-center cursor-pointer transition-all duration-150 hover:text-foreground hover:bg-surface-2 hover:border-hairline-strong",
};

export function Button({ variant = "default", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

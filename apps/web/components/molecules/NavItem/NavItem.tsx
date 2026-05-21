"use client";
import { cn } from "@/lib/cn";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  count?: string | number;
  active?: boolean;
  alert?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, count, active, alert, onClick }: NavItemProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2.5 h-[34px] px-2.5 rounded-lg text-[12.5px] font-medium cursor-pointer transition-all duration-[120ms]",
        active
          ? "text-foreground bg-surface-2"
          : "text-foreground-muted hover:text-foreground hover:bg-surface-1"
      )}
      onClick={onClick}
    >
      {active && (
        <span className="absolute -left-3 top-2 bottom-2 w-0.5 bg-accent rounded-r-sm" />
      )}
      <Icon size={15} className="flex-shrink-0" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-auto text-[10px] font-mono px-1.5 py-[1px] rounded-full border min-w-[24px] text-center",
            alert && !active
              ? "text-danger border-danger/30 bg-danger-soft"
              : active
              ? "text-foreground bg-surface-3 border-hairline"
              : "text-foreground-dim bg-surface-2 border-hairline"
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

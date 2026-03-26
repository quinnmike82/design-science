import { PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

interface BadgeProps extends PropsWithChildren {
  className?: string;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
}

export function Select({ className, children, label, helperText, ...props }: SelectProps) {
  return (
    <label className="flex min-w-[160px] flex-col gap-2">
      {label ? <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{label}</span> : null}
      <span className="relative">
        <select
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-white/10 bg-surface/90 px-4 pr-10 text-sm text-on-surface transition-colors focus:border-primary/60",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
      </span>
      {helperText ? <span className="text-xs text-on-surface-variant">{helperText}</span> : null}
    </label>
  );
}

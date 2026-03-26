import { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

interface PanelProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export function Panel({ className, highlighted, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-3xl p-5 md:p-6",
        highlighted ? "panel-highlight" : "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

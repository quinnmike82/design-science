import { ReactNode } from "react";
import { Panel } from "@/components/common/Panel";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Panel className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-semibold text-on-surface">{title}</h3>
        <p className="max-w-sm text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>
      {action}
    </Panel>
  );
}

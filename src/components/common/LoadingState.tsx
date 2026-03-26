import { LoaderCircle } from "lucide-react";
import { Panel } from "@/components/common/Panel";

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = "Loading synthetic review data",
  description = "Rehydrating mock services, review sessions, and role-aware projections.",
}: LoadingStateProps) {
  return (
    <Panel className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-semibold text-on-surface">{title}</h3>
        <p className="max-w-sm text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>
    </Panel>
  );
}

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { getReviewAgentDefinitions } from "@/data/agents";
import { AgentRunStatus, ReviewMode } from "@/types/review";
import { AgentIcon } from "@/components/common/AgentIcon";
import { cn } from "@/utils/cn";

const accentMap = {
  error: "border-error/30 bg-error/10 text-error",
  primary: "border-primary/30 bg-primary/10 text-primary",
  secondary: "border-secondary/30 bg-secondary/10 text-secondary",
  tertiary: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  cyan: "border-secondary/30 bg-secondary/10 text-secondary",
};

const statusLabelMap = {
  idle: "Idle",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

interface AgentStatusPanelProps {
  mode: ReviewMode;
  statuses: AgentRunStatus[];
}

export function AgentStatusPanel({ mode, statuses }: AgentStatusPanelProps) {
  const agents = getReviewAgentDefinitions(mode);

  return (
    <div className="space-y-3">
      {agents.map((agent) => {
        const status = statuses.find((item) => item.agentId === agent.id);
        const isRunning = status?.status === "running";
        const isCompleted = status?.status === "completed";

        return (
          <div
            key={agent.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-surface-high"
          >
            <div className="flex items-start gap-4">
              <div className={cn("flex size-11 items-center justify-center rounded-2xl border", accentMap[agent.colorToken])}>
                <AgentIcon name={agent.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-on-surface">{agent.name}</div>
                    <div className="text-xs text-on-surface-variant">{agent.category}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {isRunning ? <LoaderCircle className="size-4 animate-spin text-primary" /> : null}
                    {isCompleted ? <CheckCircle2 className="size-4 text-secondary" /> : null}
                    <span>{statusLabelMap[status?.status ?? "idle"]}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{agent.description}</p>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isCompleted ? "bg-secondary" : isRunning ? "bg-primary" : "bg-white/10",
                    )}
                    style={{ width: `${status?.progress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

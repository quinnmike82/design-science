import { useMemo, useState } from "react";
import { BarChart3, Code2, History, Plus, Sparkles } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { createReviewDraft, getLatestReviewRun } from "@/services/review.service";
import { cn } from "@/utils/cn";

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const latestRunId = getLatestReviewRun()?.id;
  const resultLink = latestRunId ? `/results/${latestRunId}` : "/workspace";

  const items = useMemo(
    () => [
      {
        label: "Workspace",
        to: "/workspace",
        icon: Code2,
      },
      {
        label: "Results",
        to: resultLink,
        icon: BarChart3,
      },
      {
        label: "History",
        to: "/history",
        icon: History,
      },
    ],
    [resultLink],
  );

  const kernelCopy = latestRunId
    ? "The latest review run stays available in the shared 3-step flow, so summary and marker review stay connected."
    : "Create a review run to populate the shared 3-step input, summary, and marker review workflow.";

  const handleCreateFreshReview = async () => {
    setIsCreatingReview(true);
    try {
      const run = createReviewDraft();
      navigate(`/workspace?reviewId=${run.id}`);
    } finally {
      setIsCreatingReview(false);
    }
  };

  return (
    <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-[272px] border-r border-white/10 bg-surface-low/95 px-6 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-on-surface">Agentic Review</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70">3-Step Flow</div>
        </div>
      </div>

      <Button className="mb-6 w-full justify-center" size="md" onClick={() => void handleCreateFreshReview()} disabled={isCreatingReview}>
        <Plus className="size-4" />
        {isCreatingReview ? "Creating..." : "New Review"}
      </Button>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-on-surface-variant transition-all hover:border-white/10 hover:bg-surface hover:text-secondary",
                  (isActive || (item.label === "Results" && location.pathname.startsWith("/results/"))) &&
                    "border-primary/25 bg-surface-variant text-primary",
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Review Kernel</div>
        <p className="mt-2 text-sm leading-6 text-on-surface">{kernelCopy}</p>
      </div>
    </aside>
  );
}

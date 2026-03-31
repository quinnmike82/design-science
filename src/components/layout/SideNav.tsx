import { useState } from "react";
import { BarChart3, Code2, History, Plus, Sparkles } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { reviewSessionService } from "@/services/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";
import { cn } from "@/utils/cn";

const items = [
  {
    label: "Workspace",
    to: "/workspace",
    icon: Code2,
  },
  {
    label: "Results",
    to: "/results/rev-synth-001",
    icon: BarChart3,
  },
  {
    label: "History",
    to: "/history",
    icon: History,
  },
];

export function SideNav() {
  const navigate = useNavigate();
  const { currentReviewId, sessions, upsertSession, setCurrentReviewId } = useReviewStore((state) => ({
    currentReviewId: state.currentReviewId,
    sessions: state.sessions,
    upsertSession: state.upsertSession,
    setCurrentReviewId: state.setCurrentReviewId,
  }));
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const resultLink = currentReviewId ? `/results/${currentReviewId}` : "/results/rev-synth-001";
  const currentSession = currentReviewId ? sessions[currentReviewId] : undefined;
  const kernelCopy =
    currentSession?.reviewMode === "monolithic"
      ? "Monolithic mode keeps the same workflow but hides the specialist roster and runs one baseline reviewer."
      : "Specialist mode runs six focused reviewers and merges the output into one stakeholder-ready result.";

  const handleCreateFreshReview = async () => {
    setIsCreatingReview(true);
    try {
      const freshSession = await reviewSessionService.createFreshReviewSession(currentSession);
      upsertSession(freshSession);
      setCurrentReviewId(freshSession.id);
      navigate("/workspace");
    } catch (error) {
      console.error("Failed to create a fresh review session.", error);
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
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70">V2.4 Stable</div>
        </div>
      </div>

      <Button className="mb-6 w-full justify-center" size="md" onClick={() => void handleCreateFreshReview()} disabled={isCreatingReview}>
        <Plus className="size-4" />
        {isCreatingReview ? "Creating..." : "New Review"}
      </Button>

      <nav className="space-y-2">
        {items.map((item) => {
          const target = item.label === "Results" ? resultLink : item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={target}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-on-surface-variant transition-all hover:border-white/10 hover:bg-surface hover:text-secondary",
                  isActive && "border-primary/25 bg-surface-variant text-primary",
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

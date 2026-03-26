import { useEffect, useMemo, useState } from "react";
import { FileStack, Layers3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/common/LoadingState";
import { Panel } from "@/components/common/Panel";
import { ArtifactList } from "@/components/review/ArtifactList";
import { ArtifactPreview } from "@/components/review/ArtifactPreview";
import { ArtifactUploadPanel } from "@/components/review/ArtifactUploadPanel";
import { AgentStatusPanel } from "@/components/review/AgentStatusPanel";
import { ProjectMetaForm } from "@/components/review/ProjectMetaForm";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { RunReviewButton } from "@/components/review/RunReviewButton";
import { artifactService } from "@/services/mock/artifactService";
import { reviewRunService } from "@/services/mock/reviewRunService";
import { reviewSessionService } from "@/services/mock/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";
import { ArtifactType, LanguageOption, ProjectType, ReviewSession, StakeholderRole } from "@/types/review";

const defaultReviewId = "rev-synth-001";

export function WorkspacePage() {
  const navigate = useNavigate();
  const {
    sessions,
    currentReviewId,
    isBootstrapped,
    agentStatuses,
    upsertSession,
    setCurrentReviewId,
    setCurrentRole,
    setAgentStatuses,
    setResult,
  } = useReviewStore(useShallow((state) => ({
    sessions: state.sessions,
    currentReviewId: state.currentReviewId,
    isBootstrapped: state.isBootstrapped,
    agentStatuses: state.agentStatuses,
    upsertSession: state.upsertSession,
    setCurrentReviewId: state.setCurrentReviewId,
    setCurrentRole: state.setCurrentRole,
    setAgentStatuses: state.setAgentStatuses,
    setResult: state.setResult,
  })));
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const reviewId = currentReviewId ?? defaultReviewId;
  const session = sessions[reviewId];
  const statuses = agentStatuses[reviewId] ?? [];

  useEffect(() => {
    if (currentReviewId !== reviewId) {
      setCurrentReviewId(reviewId);
    }
  }, [reviewId, setCurrentReviewId]);

  useEffect(() => {
    if (!isBootstrapped) {
      return;
    }

    if (!session) {
      reviewSessionService.getReviewById(reviewId).then((review) => {
        if (review) {
          upsertSession(review);
        }
      });
    }

    if (!agentStatuses[reviewId]) {
      reviewRunService.getAgentStatuses(reviewId).then((items) => {
        setAgentStatuses(reviewId, items);
      });
    }
  }, [agentStatuses, isBootstrapped, reviewId, session, setAgentStatuses, upsertSession]);

  useEffect(() => {
    if (session?.artifacts.length) {
      setActiveArtifactId((current) =>
        current && session.artifacts.some((artifact) => artifact.id === current)
          ? current
          : session.artifacts[0].id,
      );
    }
  }, [session]);

  const activeArtifact = useMemo(
    () => session?.artifacts.find((artifact) => artifact.id === activeArtifactId),
    [activeArtifactId, session],
  );

  const persistSession = async (current: ReviewSession, updates: Partial<ReviewSession>) => {
    const optimistic = {
      ...current,
      ...updates,
      artifacts: updates.artifacts ?? current.artifacts,
    };
    upsertSession(optimistic);
    const persisted = await reviewSessionService.updateReviewSession(current.id, updates);
    upsertSession(persisted);
    return persisted;
  };

  const handleMetaChange = async (updates: Partial<ReviewSession>) => {
    if (!session) {
      return;
    }

    const hasChange = Object.entries(updates).some(([key, value]) => {
      const sessionKey = key as keyof ReviewSession;
      return session[sessionKey] !== value;
    });

    if (!hasChange) {
      return;
    }

    const updated = await persistSession(session, updates);
    if (updates.stakeholderRole) {
      setCurrentRole(updated.stakeholderRole);
    }
  };

  const handleUploadFile = async (file: File, type: ArtifactType) => {
    setIsUploading(true);
    try {
      const uploaded = await artifactService.uploadArtifact({
        reviewId,
        file,
        type,
      });
      const latest = await reviewSessionService.getReviewById(reviewId);
      if (latest) {
        upsertSession(latest);
      }
      setActiveArtifactId(uploaded.id);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPastedArtifact = async (payload: { name: string; content: string; type: ArtifactType }) => {
    setIsUploading(true);
    try {
      const uploaded = await artifactService.uploadArtifact({
        reviewId,
        type: payload.type,
        name: payload.name,
        content: payload.content,
      });
      const latest = await reviewSessionService.getReviewById(reviewId);
      if (latest) {
        upsertSession(latest);
      }
      setActiveArtifactId(uploaded.id);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveArtifact = async (artifactId: string) => {
    await artifactService.removeArtifact(reviewId, artifactId);
    const latest = await reviewSessionService.getReviewById(reviewId);
    if (latest) {
      upsertSession(latest);
      if (artifactId === activeArtifactId) {
        setActiveArtifactId(latest.artifacts[0]?.id ?? null);
      }
    }
  };

  const handleRunReview = async () => {
    if (!session || session.artifacts.length === 0) {
      return;
    }

    setIsRunning(true);
    await persistSession(session, { status: "running" });

    try {
      const result = await reviewRunService.runReview(reviewId, (nextStatuses) => {
        setAgentStatuses(reviewId, nextStatuses);
      });
      const latest = await reviewSessionService.getReviewById(reviewId);
      if (latest) {
        upsertSession(latest);
      }
      setResult(result);
      navigate(`/results/${reviewId}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!session) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <LoadingState />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <ReviewHeader session={session} />

        <Panel className="space-y-6">
          <ProjectMetaForm
            session={session}
            onFieldChange={(field, value) => void handleMetaChange({ [field]: value } as Partial<ReviewSession>)}
            onLanguageChange={(language: LanguageOption) => void handleMetaChange({ language })}
            onProjectTypeChange={(projectType: ProjectType) => void handleMetaChange({ projectType })}
            onRoleChange={(role: StakeholderRole) => void handleMetaChange({ stakeholderRole: role })}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.72fr]">
          <div className="space-y-6">
            <ArtifactUploadPanel
              isUploading={isUploading}
              onUploadFile={handleUploadFile}
              onAddPastedArtifact={handleAddPastedArtifact}
            />

            <Panel className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Review inputs
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">Artifacts in this session</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                  {session.artifacts.length} loaded
                </div>
              </div>
              <ArtifactList
                artifacts={session.artifacts}
                activeArtifactId={activeArtifactId}
                onSelect={setActiveArtifactId}
                onRemove={(artifactId) => void handleRemoveArtifact(artifactId)}
              />
            </Panel>

            <ArtifactPreview artifact={activeArtifact} />
          </div>

          <div className="space-y-6">
            <Panel className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Active agents
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">Six specialist reviewers</h2>
                </div>
                <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
                  Live status
                </div>
              </div>
              <AgentStatusPanel statuses={statuses} />
            </Panel>

            <Panel highlighted className="space-y-5">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Run control</div>
                <h2 className="font-display text-2xl font-semibold text-on-surface">Ready to synthesize findings</h2>
                <p className="text-sm leading-7 text-on-surface-variant">
                  The mock run simulates queued, running, and completed agent states, then routes into the results
                  dashboard with role-aware projections from the same canonical review result.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
                    <FileStack className="size-4 text-primary" />
                    Artifact coverage
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    Code changes, FSD notes, test cases, and reviewer context are all available to the mock services.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
                    <Layers3 className="size-4 text-secondary" />
                    Presentation mapping
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    Role switching updates only the presenter layer. The result model and finding set remain the same.
                  </p>
                </div>
              </div>
              <RunReviewButton
                loading={isRunning}
                disabled={session.artifacts.length === 0}
                onClick={() => void handleRunReview()}
              />
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Sparkles className="size-4 text-primary" />
                Mock timing intentionally staggers the six agents so the progress panel feels believable.
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

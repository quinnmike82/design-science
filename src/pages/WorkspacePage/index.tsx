import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileStack, Layers3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Panel } from "@/components/common/Panel";
import { ArtifactList } from "@/components/review/ArtifactList";
import { ArtifactPreview } from "@/components/review/ArtifactPreview";
import { ArtifactUploadPanel } from "@/components/review/ArtifactUploadPanel";
import { AgentStatusPanel } from "@/components/review/AgentStatusPanel";
import { DeveloperReviewPanel } from "@/components/review/DeveloperReviewPanel";
import { ProjectMetaForm } from "@/components/review/ProjectMetaForm";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { RunReviewButton } from "@/components/review/RunReviewButton";
import { SnippetSourcePanel } from "@/components/review/SnippetSourcePanel";
import { artifactService } from "@/services/artifactService";
import { reviewRunService } from "@/services/reviewRunService";
import { reviewSessionService } from "@/services/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";
import {
  ArtifactType,
  DeveloperComment,
  LanguageOption,
  ProjectType,
  ReviewSession,
  StakeholderRole,
} from "@/types/review";
import { createId } from "@/utils/id";

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
  } = useReviewStore(
    useShallow((state) => ({
      sessions: state.sessions,
      currentReviewId: state.currentReviewId,
      isBootstrapped: state.isBootstrapped,
      agentStatuses: state.agentStatuses,
      upsertSession: state.upsertSession,
      setCurrentReviewId: state.setCurrentReviewId,
      setCurrentRole: state.setCurrentRole,
      setAgentStatuses: state.setAgentStatuses,
      setResult: state.setResult,
    })),
  );
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<
    Array<{ id: string; label: string; language: string; context: string; numSeededIssues: number }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSnippetLoading, setIsSnippetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedSessions = useMemo(
    () => Object.values(sessions).sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1)),
    [sessions],
  );
  const reviewId = currentReviewId ?? orderedSessions[0]?.id ?? null;
  const session = reviewId ? sessions[reviewId] : undefined;
  const statuses = reviewId ? agentStatuses[reviewId] ?? [] : [];

  useEffect(() => {
    if (!currentReviewId && orderedSessions[0]) {
      setCurrentReviewId(orderedSessions[0].id);
    }
  }, [currentReviewId, orderedSessions, setCurrentReviewId]);

  useEffect(() => {
    if (!reviewId) {
      return;
    }

    if (!agentStatuses[reviewId]) {
      reviewRunService.getAgentStatuses(reviewId).then((items) => {
        setAgentStatuses(reviewId, items);
      });
    }
  }, [agentStatuses, reviewId, setAgentStatuses]);

  const loadSnippets = async () => {
    setIsSnippetLoading(true);
    setError(null);
    try {
      const available = await reviewRunService.listAvailableSnippets();
      setSnippets(available);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load snippets from the Azure API.");
    } finally {
      setIsSnippetLoading(false);
    }
  };

  useEffect(() => {
    void loadSnippets();
  }, []);

  useEffect(() => {
    if (session?.artifacts.length) {
      setActiveArtifactId((current) =>
        current && session.artifacts.some((artifact) => artifact.id === current) ? current : session.artifacts[0].id,
      );
    } else {
      setActiveArtifactId(null);
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
      developerComments: updates.developerComments ?? current.developerComments,
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
    if (!reviewId) {
      return;
    }

    setIsUploading(true);
    setError(null);
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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Artifact upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPastedArtifact = async (payload: { name: string; content: string; type: ArtifactType }) => {
    if (!reviewId) {
      return;
    }

    setIsUploading(true);
    setError(null);
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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save the pasted artifact.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveArtifact = async (artifactId: string) => {
    if (!reviewId) {
      return;
    }

    try {
      await artifactService.removeArtifact(reviewId, artifactId);
      const latest = await reviewSessionService.getReviewById(reviewId);
      if (latest) {
        upsertSession(latest);
        if (artifactId === activeArtifactId) {
          setActiveArtifactId(latest.artifacts[0]?.id ?? null);
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to remove the artifact.");
    }
  };

  const handleSnippetChange = async (snippetId: string) => {
    if (!session || snippetId === session.snippetId) {
      return;
    }

    setIsSnippetLoading(true);
    setError(null);
    try {
      const detail = await reviewRunService.getSnippetDetail(snippetId);
      await persistSession(session, {
        snippetId: detail.id,
        snippetTitle: detail.label,
        snippetContext: detail.context,
        snippetLanguage: detail.language,
        snippetCode: detail.code,
        language: detail.language === "python" ? "Python" : session.language,
        developerComments: [],
        reviewStartedAt: new Date().toISOString(),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load the selected snippet.");
    } finally {
      setIsSnippetLoading(false);
    }
  };

  const handleAddDeveloperComment = async (comment: Omit<DeveloperComment, "id" | "createdAt">) => {
    if (!session) {
      return;
    }

    const nextComments = [
      ...session.developerComments,
      {
        ...comment,
        id: createId("comment"),
        createdAt: new Date().toISOString(),
      },
    ];

    await handleMetaChange({
      developerComments: nextComments,
      reviewStartedAt: session.reviewStartedAt ?? new Date().toISOString(),
    });
  };

  const handleRemoveDeveloperComment = async (commentId: string) => {
    if (!session) {
      return;
    }

    await handleMetaChange({
      developerComments: session.developerComments.filter((comment) => comment.id !== commentId),
    });
  };

  const handleRunReview = async () => {
    if (!session || session.developerComments.length === 0) {
      return;
    }

    setIsRunning(true);
    setError(null);
    await persistSession(session, { status: "running" });

    try {
      const result = await reviewRunService.runReview(reviewId!, (nextStatuses) => {
        setAgentStatuses(reviewId!, nextStatuses);
      });
      const latest = await reviewSessionService.getReviewById(reviewId!);
      if (latest) {
        upsertSession(latest);
      }
      setResult(result);
      navigate(`/results/${reviewId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The Azure review run failed.");
      await persistSession(session, { status: "failed" });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isBootstrapped && !session) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <LoadingState />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <EmptyState
            icon={<AlertTriangle className="size-6" />}
            title="No review session is available"
            description="Bootstrap the frontend with a backend snippet first, then the workspace will become interactive."
          />
        </div>
      </AppShell>
    );
  }

  const selectedSnippet = {
    id: session.snippetId,
    label: session.snippetTitle,
    language: session.snippetLanguage,
    context: session.snippetContext,
    numSeededIssues: snippets.find((item) => item.id === session.snippetId)?.numSeededIssues ?? 0,
    code: session.snippetCode,
  };

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <ReviewHeader session={session} />

        {error ? (
          <Panel className="border border-error/30 bg-error/10 text-error">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <div className="font-medium">Workspace issue</div>
                <div className="mt-1 text-sm leading-6 text-red-100">{error}</div>
              </div>
            </div>
          </Panel>
        ) : null}

        <Panel className="space-y-6">
          <ProjectMetaForm
            session={session}
            onFieldChange={(field, value) => void handleMetaChange({ [field]: value } as Partial<ReviewSession>)}
            onLanguageChange={(language: LanguageOption) => void handleMetaChange({ language })}
            onProjectTypeChange={(projectType: ProjectType) => void handleMetaChange({ projectType })}
            onRoleChange={(role: StakeholderRole) => void handleMetaChange({ stakeholderRole: role })}
            onReviewModeChange={(reviewMode) => void handleMetaChange({ reviewMode })}
          />
        </Panel>

        <SnippetSourcePanel
          snippets={snippets}
          selectedSnippetId={session.snippetId}
          selectedSnippet={selectedSnippet}
          isLoading={isSnippetLoading}
          onSnippetChange={(snippetId) => void handleSnippetChange(snippetId)}
          onReload={() => void loadSnippets()}
        />

        <DeveloperReviewPanel
          snippet={selectedSnippet}
          comments={session.developerComments}
          onAddComment={(comment) => void handleAddDeveloperComment(comment)}
          onRemoveComment={(commentId) => void handleRemoveDeveloperComment(commentId)}
        />

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
                  <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">Workspace artifacts</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                  {session.artifacts.length} local support item{session.artifacts.length === 1 ? "" : "s"}
                </div>
              </div>
              {session.artifacts.length > 0 ? (
                <ArtifactList
                  artifacts={session.artifacts}
                  activeArtifactId={activeArtifactId}
                  onSelect={setActiveArtifactId}
                  onRemove={(artifactId) => void handleRemoveArtifact(artifactId)}
                />
              ) : (
                <EmptyState
                  icon={<FileStack className="size-6" />}
                  title="No local artifacts yet"
                  description="Upload or paste FSD notes, test cases, or extra context if you want supporting material alongside the backend snippet."
                />
              )}
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
                  Azure-backed
                </div>
              </div>
              <AgentStatusPanel statuses={statuses} />
            </Panel>

            <Panel highlighted className="space-y-5">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Run control</div>
                <h2 className="font-display text-2xl font-semibold text-on-surface">Submit your review for coaching</h2>
                <p className="text-sm leading-7 text-on-surface-variant">
                  The frontend sends your flagged lines to the analytics evaluator, then runs the selected Azure review
                  mode and maps the returned findings into role-aware coaching views.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
                    <FileStack className="size-4 text-primary" />
                    Developer review status
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    {session.developerComments.length > 0
                      ? `${session.developerComments.length} structured comment${session.developerComments.length === 1 ? "" : "s"} ready for evaluation.`
                      : "Add at least one structured developer comment before submitting for AI feedback."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
                    <Layers3 className="size-4 text-secondary" />
                    Presentation mapping
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    Results are normalized once, then projected into DEV, BA, QA, and PM perspectives without
                    duplicating the underlying data.
                  </p>
                </div>
              </div>
              <RunReviewButton
                loading={isRunning}
                disabled={session.developerComments.length === 0}
                onClick={() => void handleRunReview()}
              />
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Sparkles className="size-4 text-primary" />
                Review mode: {session.reviewMode === "specialist" ? "Multi-agent coaching" : "Monolithic baseline"}.
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

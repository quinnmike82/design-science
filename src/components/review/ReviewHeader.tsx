import { Badge } from "@/components/common/Badge";
import { stakeholderRoleConfig } from "@/features/stakeholder-role/roleConfig";
import { ReviewSession } from "@/types/review";

interface ReviewHeaderProps {
  session: ReviewSession;
}

export function ReviewHeader({ session }: ReviewHeaderProps) {
  const roleConfig = stakeholderRoleConfig[session.stakeholderRole];

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
            Review Workspace
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Review first, then let the AI coach you.
          </h1>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">
          Load the backend snippet, add your own review comments, and then submit for Azure-backed evaluation and
          specialist feedback. The same canonical result will later be projected for engineering, QA, BA, and PM
          perspectives without changing the underlying data.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge className={roleConfig.badgeClass}>{roleConfig.shortLabel}</Badge>
        <Badge className="border-white/10 bg-white/5 text-on-surface-variant">{session.status}</Badge>
      </div>
    </div>
  );
}

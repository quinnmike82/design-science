import { StakeholderRole } from "@/types/review";

export const stakeholderRoleConfig: Record<
  StakeholderRole,
  {
    label: string;
    shortLabel: string;
    helpText: string;
    accentClass: string;
    badgeClass: string;
  }
> = {
  DEV: {
    label: "Technical Review",
    shortLabel: "DEV",
    helpText: "File-level, root cause oriented detail with implementation direction.",
    accentClass: "text-primary",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  BA: {
    label: "Business / Requirement View",
    shortLabel: "BA",
    helpText: "Business-rule alignment, workflow impact, and requirement readability.",
    accentClass: "text-secondary",
    badgeClass: "border-secondary/30 bg-secondary/10 text-secondary",
  },
  QA: {
    label: "Verification View",
    shortLabel: "QA",
    helpText: "Coverage gaps, regression exposure, and verification scenarios.",
    accentClass: "text-tertiary",
    badgeClass: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  },
  PM: {
    label: "Executive View",
    shortLabel: "PM",
    helpText: "Delivery impact, release confidence, and next-step clarity.",
    accentClass: "text-amber-300",
    badgeClass: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  },
};

export const stakeholderRoles = Object.keys(stakeholderRoleConfig) as StakeholderRole[];

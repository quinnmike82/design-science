import { ChangeEvent } from "react";
import { Select } from "@/components/common/Select";
import { StakeholderRoleSelect } from "@/components/review/StakeholderRoleSelect";
import { LanguageOption, ProjectType, ReviewSession, StakeholderRole } from "@/types/review";

const languages: LanguageOption[] = ["TypeScript", "JavaScript", "Python", "Go", "Java", "Kotlin"];
const projectTypes: ProjectType[] = [
  "Frontend App",
  "Backend Service",
  "Platform",
  "Library",
  "Monolith",
  "Microservice",
];

interface ProjectMetaFormProps {
  session: ReviewSession;
  onFieldChange: (field: "title" | "description", value: string) => void;
  onLanguageChange: (language: LanguageOption) => void;
  onProjectTypeChange: (projectType: ProjectType) => void;
  onRoleChange: (role: StakeholderRole) => void;
}

export function ProjectMetaForm({
  session,
  onFieldChange,
  onLanguageChange,
  onProjectTypeChange,
  onRoleChange,
}: ProjectMetaFormProps) {
  const handleTextChange =
    (field: "title" | "description") => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldChange(field, event.target.value);
    };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Title</span>
          <input
            className="h-11 rounded-xl border border-white/10 bg-surface/90 px-4 text-sm text-on-surface focus:border-primary/60"
            value={session.title}
            onChange={handleTextChange("title")}
            placeholder="Review title"
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Review Context
          </span>
          <textarea
            className="min-h-[110px] rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
            value={session.description}
            onChange={handleTextChange("description")}
            placeholder="Summarize the expected behavior, release context, and any reviewer concerns."
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
        <Select
          label="Language"
          value={session.language}
          onChange={(event) => onLanguageChange(event.target.value as LanguageOption)}
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </Select>
        <Select
          label="Project Type"
          value={session.projectType}
          onChange={(event) => onProjectTypeChange(event.target.value as ProjectType)}
        >
          {projectTypes.map((projectType) => (
            <option key={projectType} value={projectType}>
              {projectType}
            </option>
          ))}
        </Select>
        <StakeholderRoleSelect value={session.stakeholderRole} onChange={onRoleChange} />
      </div>
    </div>
  );
}

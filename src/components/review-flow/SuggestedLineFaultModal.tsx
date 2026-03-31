import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type { SuggestedLineFaultType } from "@/models/review-feedback.types";

const faultOptions: Array<{ value: SuggestedLineFaultType; label: string }> = [
  { value: "incorrect_fix", label: "Incorrect fix" },
  { value: "wrong_logic", label: "Wrong logic" },
  { value: "unsafe_change", label: "Unsafe change" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "other", label: "Other" },
];

interface SuggestedLineFaultModalProps {
  open: boolean;
  title: string;
  linePreview: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (faultType: SuggestedLineFaultType, commentText?: string) => Promise<void> | void;
}

export function SuggestedLineFaultModal({
  open,
  title,
  linePreview,
  loading,
  onClose,
  onSubmit,
}: SuggestedLineFaultModalProps) {
  const [faultType, setFaultType] = useState<SuggestedLineFaultType>("incorrect_fix");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setFaultType("incorrect_fix");
    setCommentText("");
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-5 backdrop-blur-sm"
    >
      <Panel className="w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <h3 className="font-display text-3xl font-semibold text-on-surface">{title}</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            Report why this added green line is faulty so the team can review and collect the data later.
          </p>
        </div>

        <div className="rounded-2xl border border-secondary/25 bg-secondary/10 px-4 py-3 font-mono text-xs leading-6 text-on-surface">
          {linePreview}
        </div>

        <Select
          label="Fault Type"
          value={faultType}
          onChange={(event) => setFaultType(event.target.value as SuggestedLineFaultType)}
        >
          {faultOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <textarea
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          rows={5}
          className="w-full rounded-3xl border border-white/10 bg-surface-low/80 px-4 py-3 text-sm text-on-surface"
          placeholder="Optional explanation for admin review"
        />

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void onSubmit(faultType, commentText.trim() || undefined)}>
            {loading ? "Saving..." : "Report Faulty Line"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

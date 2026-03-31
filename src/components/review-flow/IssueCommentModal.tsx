import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";

interface IssueCommentModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void> | void;
}

export function IssueCommentModal({
  open,
  title,
  description,
  confirmLabel,
  loading,
  initialValue = "",
  onClose,
  onSubmit,
}: IssueCommentModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [initialValue, open]);

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
          <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={6}
          className="w-full rounded-3xl border border-white/10 bg-surface-low/80 px-4 py-3 text-sm text-on-surface"
          placeholder="Add your note"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void onSubmit(value)}>
            {loading ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

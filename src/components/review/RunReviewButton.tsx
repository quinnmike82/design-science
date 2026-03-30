import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";

interface RunReviewButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function RunReviewButton({ disabled, loading, onClick }: RunReviewButtonProps) {
  return (
    <Button
      size="lg"
      className="w-full justify-center"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Sparkles className="size-4 animate-pulseSoft" /> : <ArrowRight className="size-4" />}
      {loading ? "Evaluating Your Review..." : "Submit My Review"}
    </Button>
  );
}

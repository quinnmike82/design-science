import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/common/Button";

interface WrongResultActionProps {
  marked?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function WrongResultAction({ marked, loading, onClick }: WrongResultActionProps) {
  return (
    <Button variant={marked ? "danger" : "outline"} size="sm" disabled={loading || marked} onClick={onClick}>
      <AlertOctagon className="size-4" />
      {loading ? "Saving..." : marked ? "Marked Wrong" : "Mark Wrong Result"}
    </Button>
  );
}

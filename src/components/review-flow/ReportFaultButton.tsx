import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/common/Button";

interface ReportFaultButtonProps {
  loading?: boolean;
  reported?: boolean;
  onClick: () => void;
}

export function ReportFaultButton({ loading, reported, onClick }: ReportFaultButtonProps) {
  return (
    <Button
      variant={reported ? "secondary" : "outline"}
      size="sm"
      disabled={loading || reported}
      onClick={onClick}
    >
      <AlertTriangle className="size-4" />
      {loading ? "Reporting..." : reported ? "Fault Reported" : "Report Fault"}
    </Button>
  );
}

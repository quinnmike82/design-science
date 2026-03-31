import { FileSearch } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

interface EmptyStateBlockProps {
  title: string;
  description: string;
}

export function EmptyStateBlock({ title, description }: EmptyStateBlockProps) {
  return <EmptyState icon={<FileSearch className="size-6" />} title={title} description={description} />;
}

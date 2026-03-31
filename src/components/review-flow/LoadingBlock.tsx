import { LoadingState } from "@/components/common/LoadingState";

interface LoadingBlockProps {
  title: string;
  description?: string;
}

export function LoadingBlock({ title, description }: LoadingBlockProps) {
  return <LoadingState title={title} description={description} />;
}

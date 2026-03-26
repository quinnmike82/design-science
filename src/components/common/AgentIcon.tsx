import {
  Brain,
  FlaskConical,
  Network,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";
import { AgentIconName } from "@/types/review";
import { cn } from "@/utils/cn";

const iconMap = {
  shield: Shield,
  network: Network,
  brain: Brain,
  sparkles: Sparkles,
  flask: FlaskConical,
  scale: Scale,
};

interface AgentIconProps {
  name: AgentIconName;
  className?: string;
}

export function AgentIcon({ name, className }: AgentIconProps) {
  const Icon = iconMap[name];
  return <Icon className={cn("size-5", className)} />;
}

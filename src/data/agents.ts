import { AgentDefinition } from "@/types/review";

export const agentDefinitions: AgentDefinition[] = [
  {
    id: "security",
    name: "Security Agent",
    category: "Vulnerability Scan",
    description: "Detects unsafe redirects, auth gaps, and exposure of sensitive pathways.",
    icon: "shield",
    colorToken: "error",
  },
  {
    id: "architecture",
    name: "Architecture Agent",
    category: "System Design Alignment",
    description: "Checks dependency boundaries, ownership seams, and structural drift.",
    icon: "network",
    colorToken: "primary",
  },
  {
    id: "logic",
    name: "Logic Agent",
    category: "Functional Verification",
    description: "Flags inconsistent branching, invalid assumptions, and broken business logic.",
    icon: "brain",
    colorToken: "secondary",
  },
  {
    id: "maintainability",
    name: "Maintainability Agent",
    category: "Code Health",
    description: "Surfaces code debt, poor readability, and fragile implementation patterns.",
    icon: "sparkles",
    colorToken: "tertiary",
  },
  {
    id: "testing",
    name: "Testing Agent",
    category: "Coverage Projection",
    description: "Maps missing tests, regression exposure, and unstable execution paths.",
    icon: "flask",
    colorToken: "primary",
  },
  {
    id: "policy",
    name: "Policy Agent",
    category: "Compliance & Standards",
    description: "Applies internal standards for naming, secrets, approval policy, and conventions.",
    icon: "scale",
    colorToken: "secondary",
  },
];

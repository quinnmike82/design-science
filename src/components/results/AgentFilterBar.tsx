import { SlidersHorizontal } from "lucide-react";
import { agentDefinitions } from "@/data/agents";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ResultsFilters } from "@/types/review";

interface AgentFilterBarProps {
  filters: ResultsFilters;
  onFiltersChange: (filters: Partial<ResultsFilters>) => void;
  onReset: () => void;
}

export function AgentFilterBar({ filters, onFiltersChange, onReset }: AgentFilterBarProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
        <SlidersHorizontal className="size-4" />
        Findings filters
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <Select
          label="Agent"
          value={filters.agentId}
          onChange={(event) => onFiltersChange({ agentId: event.target.value as ResultsFilters["agentId"] })}
        >
          <option value="all">All agents</option>
          {agentDefinitions.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </Select>
        <Select
          label="Severity"
          value={filters.severity}
          onChange={(event) => onFiltersChange({ severity: event.target.value as ResultsFilters["severity"] })}
        >
          <option value="all">All severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select
          label="Sort"
          value={filters.sortBy}
          onChange={(event) => onFiltersChange({ sortBy: event.target.value as ResultsFilters["sortBy"] })}
        >
          <option value="severity">Severity desc</option>
          <option value="confidence">Confidence desc</option>
          <option value="agent">Agent</option>
          <option value="filePath">File path</option>
        </Select>
        <div className="flex items-end">
          <Button variant="outline" className="w-full justify-center lg:w-auto" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

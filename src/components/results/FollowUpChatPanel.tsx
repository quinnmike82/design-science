import { FormEvent, useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { ChatMessage, ReviewResult, StakeholderRole } from "@/types/review";
import { createId } from "@/services/mock/helpers";

const prompts = [
  "Explain this for PM",
  "Show only release blockers",
  "Suggest QA scenarios",
  "Summarize for sprint planning",
];

interface FollowUpChatPanelProps {
  result: ReviewResult;
  role: StakeholderRole;
}

function buildAssistantReply(prompt: string, result: ReviewResult, role: StakeholderRole) {
  if (prompt === "Show only release blockers") {
    const blockers = result.findings.filter((finding) => finding.severity === "critical" || finding.severity === "high");
    return `${blockers.length} blockers remain. Top items are the redirect vulnerability, the missing approval role gate, and the fail-open pricing timeout path.`;
  }

  if (prompt === "Suggest QA scenarios") {
    return result.findings
      .slice(0, 3)
      .flatMap((finding) => finding.suggestedTestCases.slice(0, 1))
      .join(" ");
  }

  if (prompt === "Summarize for sprint planning") {
    return `Plan work across three slices: security hardening, business-rule correction, and regression automation. Estimated effort is ${result.estimatedFixEffort}.`;
  }

  return `In ${role} view, the main issue is that the same review result needs to be explained with less implementation detail and more delivery impact. Current recommendation remains ${result.releaseRecommendation}.`;
}

export function FollowUpChatPanel({ result, role }: FollowUpChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId("chat"),
      role: "assistant",
      content: "Ask for a tailored summary, release blockers, or suggested follow-up work. Responses stay mock-only but respect the selected stakeholder perspective.",
    },
  ]);
  const [input, setInput] = useState("");

  const promptButtons = useMemo(() => prompts, []);

  const sendPrompt = (prompt: string) => {
    const userMessage: ChatMessage = {
      id: createId("chat"),
      role: "user",
      content: prompt,
    };
    const assistantMessage: ChatMessage = {
      id: createId("chat"),
      role: "assistant",
      content: buildAssistantReply(prompt, result, role),
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    sendPrompt(input.trim());
    setInput("");
  };

  return (
    <Panel className="flex h-full flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-on-surface">Follow-up Assistant</div>
          <div className="text-sm text-on-surface-variant">Mock-only post-review conversation surface</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-5 py-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-primary/10 text-on-surface"
                : "bg-white/5 text-on-surface-variant"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {promptButtons.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant transition-colors hover:text-secondary"
              onClick={() => sendPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            className="h-11 flex-1 rounded-xl border border-white/10 bg-surface px-4 text-sm text-on-surface focus:border-primary/60"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about findings..."
          />
          <Button type="submit" className="shrink-0">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Panel>
  );
}

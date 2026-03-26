import { HelpCircle, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/cn";

const items = [
  { label: "Features", to: "/" },
  { label: "Workspace", to: "/workspace" },
  { label: "Results", to: "/results/rev-synth-001" },
  { label: "History", to: "/history" },
];

export function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-primary">
            Synthetic Architect
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 border-transparent pb-1 font-display text-sm tracking-tight text-on-surface-variant hover:text-secondary",
                    isActive && "border-primary text-primary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden text-on-surface-variant transition-colors hover:text-secondary md:inline-flex">
            <Settings className="size-4" />
          </button>
          <button className="hidden text-on-surface-variant transition-colors hover:text-secondary md:inline-flex">
            <HelpCircle className="size-4" />
          </button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link to="/workspace">Start Review</Link>
          </Button>
          <Button asChild size="sm" className="md:hidden">
            <Link to="/workspace">Launch</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

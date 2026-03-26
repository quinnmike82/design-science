import { PropsWithChildren } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SideNav } from "@/components/layout/SideNav";
import { cn } from "@/utils/cn";

interface AppShellProps extends PropsWithChildren {
  withSidebar?: boolean;
  className?: string;
}

export function AppShell({ withSidebar, className, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav />
      {withSidebar ? <SideNav /> : null}
      <main
        className={cn(
          "px-5 pb-12 pt-24 md:px-8",
          withSidebar ? "lg:ml-[272px]" : "",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

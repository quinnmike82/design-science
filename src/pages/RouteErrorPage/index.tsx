import { AlertTriangle } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";

export function RouteErrorPage() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";

  const description =
    isRouteErrorResponse(error)
      ? typeof error.data === "string"
        ? error.data
        : "The requested page could not be rendered."
      : error instanceof Error
        ? error.message
        : "An unexpected rendering error occurred.";

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[960px] pt-10">
        <Panel className="space-y-5">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-error/25 bg-error/10 text-error">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Application Error
            </div>
            <h1 className="font-display text-3xl font-semibold text-on-surface">{title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">{description}</p>
          </div>
          <div>
            <Button onClick={() => window.location.assign("/workspace")}>Return to Workspace</Button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

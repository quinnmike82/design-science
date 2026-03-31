import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { ResultsPage } from "@/pages/ResultsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/workspace",
    element: <WorkspacePage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/results/:reviewId",
    element: <ResultsPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/history",
    element: <HistoryPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
    errorElement: <RouteErrorPage />,
  },
]);

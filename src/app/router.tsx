import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { ResultsPage } from "@/pages/ResultsPage";
import { HistoryPage } from "@/pages/HistoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/workspace",
    element: <WorkspacePage />,
  },
  {
    path: "/results/:reviewId",
    element: <ResultsPage />,
  },
  {
    path: "/history",
    element: <HistoryPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

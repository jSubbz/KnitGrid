import { createBrowserRouter } from "react-router-dom";
import AppShell from "../shared/components/AppShell";
import HomePage from "../pages/HomePage";
import CreatePatternPage from "../pages/CreatePatternPage";
import WorkspacePage from "../pages/WorkspacePage";
import LibraryPage from "../pages/LibraryPage";
import SettingsPage from "../pages/SettingsPage";

// Pages serves the app from /<repo>/, so the router has to be told where the
// app starts or every path looks like a route it does not have. Vite fills
// BASE_URL in at build time and it is "/" during development.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "create", element: <CreatePatternPage /> },
      { path: "workspace", element: <WorkspacePage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
], { basename });

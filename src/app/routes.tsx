import { createBrowserRouter } from "react-router-dom";
import AppShell from "../shared/components/AppShell";
import HomePage from "../pages/HomePage";
import CreatePatternPage from "../pages/CreatePatternPage";
import WorkspacePage from "../pages/WorkspacePage";
import LibraryPage from "../pages/LibraryPage";
import SettingsPage from "../pages/SettingsPage";

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
]);
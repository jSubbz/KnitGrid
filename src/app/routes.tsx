import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CreatePatternPage from "../pages/CreatePatternPage";
import WorkspacePage from "../pages/WorkspacePage";
import PatternZonePage from "../pages/PatternZonePage";
import SettingsPage from "../pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/create", element: <CreatePatternPage /> },
  { path: "/workspace", element: <WorkspacePage /> },
  { path: "/patterns", element: <PatternZonePage /> },
  { path: "/settings", element: <SettingsPage /> },
]);
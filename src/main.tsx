import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { WorkspaceProvider } from "./features/workspace/state/WorkspaceContext";
import { initTheme } from "./features/theme/theme";
import "./index.css";

// Before the first render, so a pinned theme never flashes the other one.
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </React.StrictMode>
);
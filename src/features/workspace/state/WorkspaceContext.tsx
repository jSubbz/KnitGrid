import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createEmptyProject } from "../../project/projectFactory";
import type { KnitProject } from "../../project/types";
import {
  workspaceReducer,
  type WorkspaceAction,
} from "./workspaceReducer";

type HistoryAction =
  | WorkspaceAction
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_PROJECT"; project: KnitProject }
  | { type: "RESET_PROJECT" };

interface HistoryState {
  past: KnitProject[];
  present: KnitProject;
  future: KnitProject[];
}

interface WorkspaceContextValue {
  state: KnitProject;
  dispatch: Dispatch<HistoryAction>;
  canUndo: boolean;
  canRedo: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function cloneProject(project: KnitProject): KnitProject {
  return JSON.parse(JSON.stringify(project)) as KnitProject;
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);

    return {
      past: newPast,
      present: cloneProject(previous),
      future: [cloneProject(state.present), ...state.future],
    };
  }

  if (action.type === "REDO") {
    if (state.future.length === 0) return state;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    return {
      past: [...state.past, cloneProject(state.present)],
      present: cloneProject(next),
      future: newFuture,
    };
  }

  if (action.type === "LOAD_PROJECT") {
    return {
      past: [],
      present: cloneProject(action.project),
      future: [],
    };
  }

  if (action.type === "RESET_PROJECT") {
    return {
      past: [],
      present: createEmptyProject(),
      future: [],
    };
  }

  const nextPresent = workspaceReducer(state.present, action);

  if (JSON.stringify(nextPresent) === JSON.stringify(state.present)) {
    return state;
  }

  return {
    past: [...state.past, cloneProject(state.present)],
    present: cloneProject(nextPresent),
    future: [],
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: createEmptyProject(),
    future: [],
  }));

  const value = useMemo(
    () => ({
      state: history.present,
      dispatch,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [history]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// The hook belongs beside the provider it reads; splitting it into its own file
// would buy only HMR ergonomics.
// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { createProject } from "../../project/projectFactory";
import { logAction } from "../../devlog/devlog";
import { loadWorking, saveWorking } from "../../project/projectStore";
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
  | { type: "RESET_PROJECT"; castOn?: number; notes?: string; name?: string };

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
      present: createProject(action.castOn ?? 6, action.notes ?? "", action.name ?? ""),
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
  // Charting picks up where it was left. A reload or a closed tab should not
  // cost an afternoon's work, so the working project is restored before the
  // first render rather than starting blank and replacing it.
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: loadWorking() ?? createProject(),
    future: [],
  }));

  useEffect(() => {
    saveWorking(history.present);
  }, [history.present]);

  // The wrapper below needs the state a dispatch will be applied to. Effects
  // flush between input events, so this is current by the time the next
  // keystroke arrives.
  const presentRef = useRef(history.present);
  useEffect(() => {
    presentRef.current = history.present;
  }, [history.present]);

  // Wraps dispatch rather than logging inside the reducer: a reducer must stay
  // pure, and React's development double-invoke duplicated every entry when it
  // was not. Entries record actions that changed nothing too - a refused
  // keystroke is exactly what a bug report needs.
  const logged: Dispatch<HistoryAction> = useCallback((action) => {
    const before = presentRef.current;
    // The reducer is pure, so running it here gives the state the log should
    // record without waiting for a render - and without missing actions that
    // change nothing, which never trigger one.
    const after =
      action.type === "UNDO" ||
      action.type === "REDO" ||
      action.type === "LOAD_PROJECT" ||
      action.type === "RESET_PROJECT"
        ? before
        : workspaceReducer(before, action);

    logAction(action as { type: string } & Record<string, unknown>, after);
    dispatch(action);
  }, []);

  const value = useMemo(
    () => ({
      state: history.present,
      dispatch: logged,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [history, logged]
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
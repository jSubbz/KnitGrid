import { useSyncExternalStore } from "react";
import { getThemeSnapshot, subscribeToTheme, type Theme } from "./theme";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "system");
}

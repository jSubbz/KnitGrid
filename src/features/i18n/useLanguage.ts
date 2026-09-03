import { useSyncExternalStore } from "react";
import { getLanguageSnapshot, subscribeToLanguage } from "./i18n";

/**
 * Re-renders the component when the language changes. Every component that
 * shows a translated string needs this, otherwise the switch only takes effect
 * on the next unrelated render.
 */
export function useLanguage(): string {
  return useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, () => "en");
}

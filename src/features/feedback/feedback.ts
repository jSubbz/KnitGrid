/**
 * Feedback with nowhere to send it.
 *
 * KnitGrid has no server and is not getting one, so a report cannot be posted
 * anywhere from inside the program. What it can do is write the report for you
 * and hand it over: either straight into a prefilled GitHub issue, or onto the
 * clipboard for anyone who does not have a GitHub account, which will be most
 * knitters.
 *
 * The environment lines are here because they are the first thing anyone asks
 * for and the last thing a reporter thinks to include.
 */
import { getLanguage } from "../i18n/i18n";
import { serializeLog } from "../devlog/devlog";
import type { KnitProject } from "../project/types";

export const REPO_URL = "https://github.com/jSubbz/KnitGrid";
export const APP_VERSION = "0.8.0-dev";

/**
 * Held in pieces so the address is never a contiguous string in the bundle,
 * and assembled only at the moment someone clicks. Nothing renders it: there
 * is no visible address and no mailto in the markup, so a harvester has to run
 * the page and fire the handler to see it. Not a secret, just not free.
 */
const CONTACT_PARTS = ["jldenny", "proton", "me"];

export function openContactEmail(subject: string) {
  const to = `${CONTACT_PARTS[0]}@${CONTACT_PARTS[1]}.${CONTACT_PARTS[2]}`;
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
}

export type FeedbackKind = "bug" | "idea" | "general";

export const FEEDBACK_KINDS: {
  value: FeedbackKind;
  labelKey: string;
  issueLabel: string;
}[] = [
  { value: "bug", labelKey: "info.fbBug", issueLabel: "bug" },
  { value: "idea", labelKey: "info.fbIdea", issueLabel: "enhancement" },
  { value: "general", labelKey: "info.fbGeneral", issueLabel: "feedback" },
];

export interface FeedbackDraft {
  kind: FeedbackKind;
  summary: string;
  detail: string;
  includeChart: boolean;
}

function environment(): string {
  const lines = [`KnitGrid ${APP_VERSION}`, `Language: ${getLanguage()}`];
  if (typeof navigator !== "undefined") lines.push(`Browser: ${navigator.userAgent}`);
  if (typeof window !== "undefined") {
    lines.push(`Window: ${window.innerWidth}x${window.innerHeight}`);
  }
  return lines.join("\n");
}

export function buildReport(draft: FeedbackDraft, project: KnitProject): string {
  const parts = [draft.detail.trim() || "(no description given)"];
  parts.push(`\n---\n\n${environment()}`);

  if (draft.includeChart) {
    // The chart goes in as JSON rather than prose because it is the same thing
    // a saved pattern carries, so it can be loaded straight back to reproduce.
    parts.push(`\nChart:\n\n\`\`\`json\n${JSON.stringify(project)}\n\`\`\``);
  }

  return parts.join("\n");
}

export function issueUrl(draft: FeedbackDraft, project: KnitProject): string {
  const kind = FEEDBACK_KINDS.find((entry) => entry.value === draft.kind);
  const params = new URLSearchParams({
    title: draft.summary.trim() || "Feedback",
    body: buildReport(draft, project),
    labels: kind?.issueLabel ?? "feedback",
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

/**
 * Writes the whole report out as one file: what the knitter typed, the
 * environment, the chart if they allowed it, and the session log underneath.
 * The log on its own means nothing to whoever is sending it, so it goes at the
 * bottom of something readable rather than being the thing they have to send.
 *
 * Returns where it landed so the form can say so.
 */
export async function saveReportFile(
  draft: FeedbackDraft,
  project: KnitProject
): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const name = `knitgrid-report-${stamp}.txt`;
  const text = [
    draft.summary.trim() || "KnitGrid feedback",
    "",
    buildReport(draft, project),
    "",
    "--- session log ---------------------------------------------------------",
    "",
    serializeLog(project),
    "",
  ].join("\n");

  const win = window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      id?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  };

  if (typeof win.showSaveFilePicker === "function") {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: name,
        id: "knitgrid-reports",
        types: [
          { description: "KnitGrid report", accept: { "text/plain": [".txt"] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return name;
    } catch {
      // Cancelled or unavailable; fall through to a plain download.
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  return `Downloads/${name}`;
}

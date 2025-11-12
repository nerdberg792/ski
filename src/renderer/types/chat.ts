export type EntryKind = "prompt" | "response" | "action";

export interface ChatEntry {
  id: string;
  kind: EntryKind;
  heading: string;
  subheading?: string;
  body?: string;
  bullets?: string[];
  emphasis?: string;
  footnote?: string;
  timestamp?: string;
  sourceLabel?: string;
  highlight?: boolean;
}

// A single floating prompt window that stacks in the centered overlay.
// It contains the originating prompt entry and one or more response entries.
export interface PromptWindow {
  id: string;
  prompt: string;
  entries: ChatEntry[];
  status: "streaming" | "done";
  createdAt: number;
}


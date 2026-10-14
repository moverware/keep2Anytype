import type { GoogleKeepNote } from "../keep/types";

// Shape of one Google Takeout Keep JSON file, before ingest adds source info.
export const rawNote = (overrides: Record<string, unknown> = {}) => ({
  color: "DEFAULT",
  isTrashed: false,
  isPinned: false,
  isArchived: false,
  textContent: "",
  title: "",
  // 2023-11-14 22:13:20 UTC
  userEditedTimestampUsec: 1700000000000000,
  createdTimestampUsec: 1700000000000000,
  ...overrides,
});

export const keepNote = (
  overrides: Partial<GoogleKeepNote> = {},
): GoogleKeepNote => ({
  ...rawNote(),
  sourceFilePath: "/takeout/Keep/note.json",
  sourceFileName: "note",
  ...overrides,
});

import { mkdir } from "node:fs/promises";
import { convertToAnyBlockPage } from "./anyBlock/convert";
import { writeAnyBlockPageToFile } from "./anyBlock/write";
import { ingestKeepJsonFiles } from "./keep/ingest";

export type Mode = "pages" | "mixed";

export interface Settings {
  path: string;
  output: string;
  mode: Mode;
  includeArchive: boolean;
  includeTrashed: boolean;
  includeMetadata: boolean;
  includeRelation: boolean;
  emoji: string;
  tagId: string;
}

// Converts every Keep note in settings.path and returns the number of notes
// that failed to convert.
export const main = async (settings: Settings): Promise<number> => {
  const notes = await ingestKeepJsonFiles(
    settings.path,
    settings.includeArchive,
    settings.includeTrashed,
  );

  if (notes.length === 0) {
    throw new Error(`No Keep notes found in ${settings.path}`);
  }

  await mkdir(settings.output, { recursive: true });
  let failures = 0;

  for (const note of notes) {
    try {
      const anyBlockPage = convertToAnyBlockPage(note, settings);
      const filePath = await writeAnyBlockPageToFile(
        anyBlockPage,
        note.sourceFileName,
        settings.output,
      );
      console.log(`Successfully generated ${filePath}`);
    } catch (error) {
      failures++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Error writing any-block for keep file ${note.sourceFilePath}: ${message}`,
      );
    }
  }

  return failures;
};

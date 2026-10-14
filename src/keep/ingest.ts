import { promises as fs } from "node:fs";
import path from "node:path";
import type { Attachment, GoogleKeepNote } from "./types";

const parseGoogleKeepNote = (
  jsonString: string,
  filePath: string,
): GoogleKeepNote => {
  const parsedObject = JSON.parse(jsonString);
  if (!isGoogleKeepNote(parsedObject)) {
    throw new Error("Invalid data structure for a GoogleKeepNote");
  }
  return {
    ...parsedObject,
    sourceFilePath: filePath,
    sourceFileName: path.parse(filePath).name,
  };
};

const isGoogleKeepNote = (object: any): object is GoogleKeepNote => {
  const baseFields = [
    "color",
    "isTrashed",
    "isPinned",
    "isArchived",
    "title",
    "userEditedTimestampUsec",
    "createdTimestampUsec",
  ];

  for (const field of baseFields) {
    if (!(field in object)) {
      throw new Error(`Missing field: ${field}`);
    }
  }

  if (object.listContent) {
    if (!Array.isArray(object.listContent)) {
      throw new Error("listContent is not an array");
    }
    for (const item of object.listContent) {
      if (
        typeof item.text !== "string" ||
        typeof item.isChecked !== "boolean"
      ) {
        throw new Error("Invalid listContent item");
      }
    }
  }

  if (object.textContent && typeof object.textContent !== "string") {
    throw new Error("Invalid textContent");
  }

  if (object.annotations) {
    if (!Array.isArray(object.annotations)) {
      throw new Error("annotations is not an array");
    }
    for (const annotation of object.annotations) {
      if (
        typeof annotation.description !== "string" ||
        typeof annotation.source !== "string" ||
        typeof annotation.title !== "string" ||
        typeof annotation.url !== "string"
      ) {
        throw new Error("Invalid annotation item");
      }
    }
  }

  if (object.attachments) {
    if (!Array.isArray(object.attachments)) {
      throw new Error("attachments is not an array");
    }
    for (const attachment of object.attachments) {
      if (
        typeof attachment.filePath !== "string" ||
        typeof attachment.mimetype !== "string"
      ) {
        throw new Error("Invalid attachment item");
      }
    }
  }

  if (object.labels) {
    if (!Array.isArray(object.labels)) {
      throw new Error("labels is not an array");
    }
    for (const label of object.labels) {
      if (typeof label.name !== "string") {
        throw new Error("Invalid label item");
      }
    }
  }

  return true;
};

const exists = (filePath: string) =>
  fs.access(filePath).then(
    () => true,
    () => false,
  );

// Takeout sometimes names an image `.jpeg` in the note JSON but writes it to
// disk as `.jpg`, or the other way round.
const candidatePaths = (filePath: string): string[] => {
  const { dir, name, ext } = path.parse(filePath);
  const swapped = { ".jpeg": ".jpg", ".jpg": ".jpeg" }[ext.toLowerCase()];
  return swapped ? [filePath, path.join(dir, name + swapped)] : [filePath];
};

// Returns the note's attachments with absolute paths, which Anytype needs to
// upload them, dropping any whose file is missing from the export.
const resolveAttachments = async (
  attachments: Attachment[],
  folderPath: string,
  notePath: string,
): Promise<Attachment[]> => {
  const resolved: Attachment[] = [];
  for (const attachment of attachments) {
    const absolutePath = path.resolve(folderPath, attachment.filePath);
    let found: string | undefined;
    for (const candidate of candidatePaths(absolutePath)) {
      if (await exists(candidate)) {
        found = candidate;
        break;
      }
    }
    if (found) {
      resolved.push({ ...attachment, filePath: found });
    } else {
      console.warn(
        `Skipping attachment ${attachment.filePath} of ${notePath}: file not found`,
      );
    }
  }
  return resolved;
};

export const ingestKeepJsonFiles = async (
  folderPath: string,
  includeArchive: boolean,
  includeTrashed: boolean,
): Promise<GoogleKeepNote[]> => {
  const notes: GoogleKeepNote[] = [];
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    if (path.extname(file) === ".json") {
      const filePath = path.join(folderPath, file);

      try {
        const data = await fs.readFile(filePath, "utf8");
        const note = parseGoogleKeepNote(data, filePath);
        if (note.isArchived && !includeArchive) {
          continue;
        }
        if (note.isTrashed && !includeTrashed) {
          continue;
        }
        if (note.attachments) {
          note.attachments = await resolveAttachments(
            note.attachments,
            folderPath,
            filePath,
          );
        }
        notes.push(note);
      } catch (error: any) {
        throw new Error(
          `Failed to parse ${filePath} into a GoogleKeepNote: ${error.message}`,
          { cause: error },
        );
      }
    }
  }

  return notes;
};

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { rawNote } from "../testdata/notes";
import { ingestKeepJsonFiles } from "./ingest";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "keep2anytype-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true });
});

const write = (name: string, content: unknown) =>
  writeFile(path.join(dir, name), JSON.stringify(content));

const titles = async (includeArchive: boolean, includeTrashed: boolean) =>
  (await ingestKeepJsonFiles(dir, includeArchive, includeTrashed))
    .map((note) => note.title)
    .sort();

describe("ingestKeepJsonFiles", () => {
  beforeEach(async () => {
    await write("active.json", rawNote({ title: "active" }));
    await write(
      "archived.json",
      rawNote({ title: "archived", isArchived: true }),
    );
    await write("trashed.json", rawNote({ title: "trashed", isTrashed: true }));
  });

  it("skips archived and trashed notes by default", async () => {
    expect(await titles(false, false)).toEqual(["active"]);
  });

  it("includes archived and trashed notes when asked", async () => {
    expect(await titles(true, false)).toEqual(["active", "archived"]);
    expect(await titles(false, true)).toEqual(["active", "trashed"]);
  });

  it("records where each note came from", async () => {
    const [note] = await ingestKeepJsonFiles(dir, false, false);
    expect(note.sourceFileName).toBe("active");
    expect(note.sourceFilePath).toBe(path.join(dir, "active.json"));
  });

  it("ignores files that are not JSON", async () => {
    await writeFile(path.join(dir, "photo.png"), "not json");
    await writeFile(path.join(dir, "note.html"), "<html></html>");
    expect(await titles(false, false)).toEqual(["active"]);
  });

  it("rejects notes missing required fields", async () => {
    await write("broken.json", { title: "no timestamps" });
    await expect(ingestKeepJsonFiles(dir, false, false)).rejects.toThrow(
      /broken\.json.*Missing field: color/,
    );
  });

  it("rejects malformed labels", async () => {
    await write("labels.json", rawNote({ labels: [{ id: 1 }] }));
    await expect(ingestKeepJsonFiles(dir, false, false)).rejects.toThrow(
      /Invalid label item/,
    );
  });
});

import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, type Settings } from "./main";
import { rawNote } from "./testdata/notes";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "keep2anytype-"));
  await mkdir(path.join(dir, "Keep"));
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(dir, { recursive: true });
});

const settings = (overrides: Partial<Settings> = {}): Settings => ({
  path: path.join(dir, "Keep"),
  output: path.join(dir, "out", "nested"),
  mode: "mixed",
  includeArchive: false,
  includeTrashed: false,
  includeMetadata: false,
  includeRelation: false,
  emoji: "",
  tagId: "",
  ...overrides,
});

describe("main", () => {
  it("writes one Any-Block file per Keep note", async () => {
    await writeFile(
      path.join(dir, "Keep", "Shopping.json"),
      JSON.stringify(rawNote({ title: "Shopping", textContent: "milk" })),
    );

    expect(await main(settings())).toBe(0);

    const out = settings().output;
    expect(await readdir(out)).toEqual(["Shopping.json"]);
    const page = JSON.parse(
      await readFile(path.join(out, "Shopping.json"), "utf8"),
    );
    expect(page.sbType).toBe("Page");
    expect(page.snapshot.data.details.name).toBe("Shopping");
  });

  it("fails when the folder has no Keep notes", async () => {
    await expect(main(settings())).rejects.toThrow(/No Keep notes found/);
  });
});

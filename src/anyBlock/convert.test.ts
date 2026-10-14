import { describe, expect, it } from "vitest";
import { keepNote } from "../testdata/notes";
import { convertToAnyBlockPage, type ConvertOptions } from "./convert";

const options: ConvertOptions = {
  mode: "mixed",
  emoji: "",
  includeMetadata: false,
  includeRelation: false,
  tagId: "",
};

const convert = (
  note: Parameters<typeof keepNote>[0],
  overrides: Partial<ConvertOptions> = {},
) => {
  const page = convertToAnyBlockPage(keepNote(note), {
    ...options,
    ...overrides,
  });
  return { page, ...page.snapshot.data };
};

describe("convertToAnyBlockPage", () => {
  it("makes titled notes pages and untitled notes notes in mixed mode", () => {
    expect(convert({ title: "Groceries" }).details).toMatchObject({
      name: "Groceries",
      type: "ot-page",
      layout: 0,
    });
    expect(convert({ title: "" }).details).toMatchObject({
      name: "",
      type: "ot-note",
      layout: 9,
    });
  });

  it("titles untitled notes with their created date in pages mode", () => {
    const { details } = convert({ title: "" }, { mode: "pages" });
    expect(details.type).toBe("ot-page");
    expect(details.name).toMatch(/^November 1[45], 2023$/);
  });

  it("keeps the Keep timestamps", () => {
    const { details } = convert({
      createdTimestampUsec: 1600000000000000,
      userEditedTimestampUsec: 1700000000000000,
    });
    expect(details.createdDate).toBe(1600000000);
    expect(details.lastModifiedDate).toBe(1700000000);
  });

  it("turns each text line into a block and links URLs", () => {
    const { blocks } = convert({
      textContent: "first line\nvisit https://example.com",
    });
    const texts = blocks.filter((b) => b.text?.text !== undefined);
    expect(texts.map((b) => b.text?.text)).toEqual([
      "first line",
      "visit https://example.com",
    ]);
    expect(texts[1].text?.marks).toEqual({
      marks: [
        {
          range: { from: 6, to: 25 },
          type: "Link",
          param: "https://example.com",
        },
      ],
    });
  });

  it("turns list items into checkboxes", () => {
    const { blocks } = convert({
      listContent: [
        { text: "milk", isChecked: true },
        { text: "eggs", isChecked: false },
      ],
    });
    const checkboxes = blocks.filter((b) => b.text?.style === "Checkbox");
    expect(checkboxes.map((b) => [b.text?.text, b.text?.checked])).toEqual([
      ["milk", true],
      ["eggs", false],
    ]);
  });

  it("links annotations", () => {
    const { blocks } = convert({
      annotations: [
        {
          title: "Example",
          url: "https://example.com",
          description: "",
          source: "WEBLINK",
        },
      ],
    });
    const link = blocks.find((b) => b.text?.text === "Example");
    expect(link?.text?.marks?.marks?.[0].param).toBe("https://example.com");
  });

  it("puts attachments above the text as file blocks", () => {
    const { blocks } = convert({
      textContent: "caption",
      attachments: [
        { filePath: "/takeout/Keep/cat.png", mimetype: "image/png" },
        { filePath: "/takeout/Keep/memo.3gp", mimetype: "audio/3gpp" },
        { filePath: "/takeout/Keep/scan.pdf", mimetype: "application/pdf" },
      ],
    });
    const [root] = blocks;
    const byId = new Map(blocks.map((b) => [b.id, b]));
    const body = root.childrenIds!.map((id) => byId.get(id)!).slice(1);

    expect(body.map((b) => b.file ?? b.text?.text)).toEqual([
      {
        name: "/takeout/Keep/cat.png",
        type: "Image",
        mime: "image/png",
        state: "Empty",
      },
      {
        name: "/takeout/Keep/memo.3gp",
        type: "Audio",
        mime: "audio/3gpp",
        state: "Empty",
      },
      {
        name: "/takeout/Keep/scan.pdf",
        type: "PDF",
        mime: "application/pdf",
        state: "Empty",
      },
      "caption",
    ]);
  });

  it("lists every block except the header extras as a child of the root", () => {
    const { blocks } = convert({ title: "Hi", textContent: "a\nb" });
    const [root, ...rest] = blocks;
    expect(root.childrenIds).toEqual(
      rest
        .map((b) => b.id)
        .filter(
          (id) => !["title", "description", "featuredRelations"].includes(id),
        ),
    );
  });

  it("leaves the description empty without --metadata", () => {
    const { details } = convert({ color: "RED", isPinned: true });
    expect(details.description).toBe("");
  });

  it("writes Keep metadata to the description with --metadata", () => {
    const { details } = convert(
      {
        color: "YELLOW",
        isPinned: true,
        isArchived: true,
        labels: [{ name: "work" }, { name: "ideas" }],
      },
      { includeMetadata: true },
    );
    expect(details.description).toBe(
      "Color: YELLOW | Pinned | Archived | Labels: work, ideas",
    );
  });

  it("adds a description relation block only with both --metadata and --relation", () => {
    const relationBlocks = (overrides: Partial<ConvertOptions>) =>
      convert({ isPinned: true }, overrides).blocks.filter((b) => b.relation);

    expect(relationBlocks({ includeRelation: true })).toHaveLength(0);
    expect(
      relationBlocks({ includeMetadata: true, includeRelation: true }),
    ).toEqual([expect.objectContaining({ relation: { key: "description" } })]);
  });

  it("applies the emoji and tag", () => {
    const { details } = convert({}, { emoji: "🗒️", tagId: "bafytag" });
    expect(details.iconEmoji).toBe("🗒️");
    expect(details.tag).toEqual(["bafytag"]);
  });
});

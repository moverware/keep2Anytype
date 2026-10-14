import { describe, expect, it } from "vitest";
import { convertMicrosecondsToSeconds, extractUrls } from "./utils";

describe("extractUrls", () => {
  it("returns each URL with its position", () => {
    const text = "see https://a.example/x and http://b.example";
    expect(extractUrls(text)).toEqual([
      { url: "https://a.example/x", start: 4, end: 23 },
      { url: "http://b.example", start: 28, end: 44 },
    ]);
  });

  it("returns nothing for plain text", () => {
    expect(extractUrls("no links here")).toEqual([]);
  });
});

describe("convertMicrosecondsToSeconds", () => {
  it("floors to whole seconds", () => {
    expect(convertMicrosecondsToSeconds(1700000000999999)).toBe(1700000000);
  });
});

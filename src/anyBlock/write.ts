import type { Page } from "./types";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const writeAnyBlockPageToFile = async (
  anyBlockPage: Page,
  sourceFileName: string,
  outputFolder: string,
) => {
  const filePath = path.resolve(outputFolder, `${sourceFileName}.json`);
  const serializedData = JSON.stringify(anyBlockPage, null, 2);
  await writeFile(filePath, serializedData);
  return filePath;
};

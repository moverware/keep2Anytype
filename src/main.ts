import { generateAnyBlockFile } from './anyBlock'
import { GoogleKeepNote, ingestKeepJsonFiles } from './keep'
import { ensureDirectoryExists } from './utils'

export const main = async (
  inputFolderPath: string,
  outputFolderPath: string
) => {
  let notes: GoogleKeepNote[] = []
  try {
    const maybeNotes = await ingestKeepJsonFiles(inputFolderPath)
    notes = maybeNotes
  } catch (err) {
    console.error(`Error:`, err)
    process.exit(1)
  }

  if (!notes) {
    console.error(`Error: no notes found`)
    process.exit(1)
  }

  ensureDirectoryExists(outputFolderPath)
  for (const note of notes) {
    try {
      const filePath = await generateAnyBlockFile(note, outputFolderPath)
      console.log(`Successfully generated ${filePath}`)
    } catch (error) {
      console.error(
        `Error writing any-block for keep file ${note.sourceFilePath}`,
        error
      )
      process.exit(1)
    }
  }
}

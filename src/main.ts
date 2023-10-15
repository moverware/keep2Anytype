import { generateAnyBlockFile } from './anyBlock/generate'
import { Settings } from './cli'
import { GoogleKeepNote, ingestKeepJsonFiles } from './keep'
import { ensureDirectoryExists } from './utils'

export const main = async (settings: Settings) => {
  const {
    path: inputFolderPath,
    output: outputFolderPath,
    mode,
    includeArchive,
  } = settings
  let notes: GoogleKeepNote[] = []

  try {
    const maybeNotes = await ingestKeepJsonFiles(
      inputFolderPath,
      includeArchive
    )
    notes = maybeNotes
  } catch (err) {
    console.error(`Error:`, err)
    process.exit(1)
  }

  if (!notes) {
    console.error(`Error: no notes found`)
    process.exit(1)
  }

  await ensureDirectoryExists(outputFolderPath)
  for (const note of notes) {
    try {
      const filePath = await generateAnyBlockFile(note, outputFolderPath, mode)
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

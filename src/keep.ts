import { promises as fs } from 'fs'
import path from 'path'

export interface ListContentItem {
  text: string
  isChecked: boolean
}

export interface Annotation {
  description: string
  source: string
  title: string
  url: string
}

interface Attachment {
  filePath: string
  mimetype: string
}

export interface GoogleKeepNote {
  color: string
  isTrashed: boolean
  isPinned: boolean
  isArchived: boolean
  listContent?: ListContentItem[]
  textContent?: string
  annotations?: Annotation[]
  attachments?: Attachment[]
  title: string
  userEditedTimestampUsec: number
  createdTimestampUsec: number
  sourceFilePath: string
  sourceFileName: string
}

const parseGoogleKeepNote = (
  jsonString: string,
  filePath: string
): GoogleKeepNote => {
  const parsedObject = JSON.parse(jsonString)
  if (!isGoogleKeepNote(parsedObject)) {
    throw new Error('Invalid data structure for a GoogleKeepNote')
  }
  return {
    ...parsedObject,
    sourceFilePath: filePath,
    sourceFileName: path.parse(filePath).name,
  }
}

const isGoogleKeepNote = (object: any): object is GoogleKeepNote => {
  const baseFields = [
    'color',
    'isTrashed',
    'isPinned',
    'isArchived',
    'title',
    'userEditedTimestampUsec',
    'createdTimestampUsec',
  ]

  for (const field of baseFields) {
    if (!(field in object)) {
      throw new Error(`Missing field: ${field}`)
    }
  }

  if (object.listContent) {
    if (!Array.isArray(object.listContent)) {
      throw new Error('listContent is not an array')
    }
    for (const item of object.listContent) {
      if (
        typeof item.text !== 'string' ||
        typeof item.isChecked !== 'boolean'
      ) {
        throw new Error('Invalid listContent item')
      }
    }
  }

  if (object.textContent && typeof object.textContent !== 'string') {
    throw new Error('Invalid textContent')
  }

  if (object.annotations) {
    if (!Array.isArray(object.annotations)) {
      throw new Error('annotations is not an array')
    }
    for (const annotation of object.annotations) {
      if (
        typeof annotation.description !== 'string' ||
        typeof annotation.source !== 'string' ||
        typeof annotation.title !== 'string' ||
        typeof annotation.url !== 'string'
      ) {
        throw new Error('Invalid annotation item')
      }
    }
  }

  if (object.attachments) {
    if (!Array.isArray(object.attachments)) {
      throw new Error('attachments is not an array')
    }
    for (const attachment of object.attachments) {
      if (
        typeof attachment.filePath !== 'string' ||
        typeof attachment.mimetype !== 'string'
      ) {
        throw new Error('Invalid attachment item')
      }
    }
  }

  return true
}

export const ingestKeepJsonFiles = async (
  folderPath: string,
  includeArchive: boolean
): Promise<GoogleKeepNote[]> => {
  const notes: GoogleKeepNote[] = []
  const files = await fs.readdir(folderPath)

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const filePath = path.join(folderPath, file)

      try {
        const data = await fs.readFile(filePath, 'utf8')
        const note = parseGoogleKeepNote(data, filePath)
        if (note.isArchived && !includeArchive) {
          continue
        }
        notes.push(note)
      } catch (error: any) {
        throw new Error(
          `Failed to parse ${filePath} into a GoogleKeepNote: ${error.message}`
        )
      }
    }
  }

  return notes
}

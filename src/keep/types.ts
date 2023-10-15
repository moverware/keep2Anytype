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

import { v4 as uuidv4 } from 'uuid'
import { writeFile } from 'fs/promises'
import { Annotation, GoogleKeepNote, ListContentItem } from './keep'
import * as dotenv from 'dotenv'
import { convertMicrosecondsToSeconds, extractUrls, getEnvVar } from './utils'
import path from 'path'
import { Mode } from './cli'
dotenv.config()

type ObjectType = 'page' | 'note'

interface Page {
  sbType: 'Page'
  snapshot: Snapshot
}

interface Snapshot {
  data: Data
}

interface Data {
  blocks: Block[]
  details: Details
  objectTypes: string[]
  relationLinks: RelationLink[]
}

interface Block {
  id: string
  restrictions?: Restrictions
  childrenIds?: string[]
  layout?: Layout
  text?: Text
  fields?: Fields
  featuredRelations?: any
  smartblock?: any
}

interface Restrictions {
  edit?: boolean
  remove?: boolean
  drag?: boolean
  dropOn?: boolean
}

interface Layout {
  style: string
}

interface Range {
  to: number
  from?: number
}

interface Mark {
  range: Range
  type: string
  param?: string
}

interface Marks {
  marks?: Mark[]
}

interface Text {
  text?: string
  style?: string
  marks?: Marks
  checked?: boolean
}

interface Fields {
  _detailsKey?: string[] | string
}

interface Details {
  backlinks: any[]
  createdDate: number
  creator: string
  description: string
  featuredRelations: string[]
  iconEmoji: string
  id: string
  lastModifiedBy: string
  lastModifiedDate: number
  lastOpenedDate: number
  layout: number
  links: any[]
  name: string
  restrictions: any[]
  snippet: string
  sourceFilePath: string
  tag: string[]
  type: string
  workspaceId: string
}

interface RelationLink {
  key: string
  format?: string
}

type BlockWithId = { block: Block; id: string }

const generateMarksForText = (text: string): Marks | Record<string, never> => {
  const marks: Mark[] = []
  const urls = extractUrls(text)
  if (urls.length === 0) {
    return {}
  }

  for (const url of urls) {
    let range: Range = { to: url.end }
    if (url.start > 0) {
      range = { to: url.end, from: url.start }
    }

    marks.push({
      range,
      type: 'Link',
      param: url.url,
    })
  }
  return { marks }
}

const createHeaderBlock = (objectType: ObjectType): BlockWithId => {
  const id = 'header'

  const childrenIds = ['featuredRelations']
  if (objectType === 'page') {
    childrenIds.push('title', 'description')
  }

  const block = {
    id,
    restrictions: {
      edit: true,
      remove: true,
      drag: true,
      dropOn: true,
    },
    childrenIds,
    layout: {
      style: 'Header',
    },
  }
  return { block, id }
}

const createTitleBlock = (): BlockWithId => {
  const id = 'title'
  const block = {
    id,
    fields: {
      _detailsKey: ['name', 'done'],
    },
    restrictions: {
      remove: true,
      drag: true,
      dropOn: true,
    },
    text: {
      style: 'Title',
      marks: {},
    },
  }
  return { block, id }
}

const createDescriptionBlock = (): BlockWithId => {
  const id = 'description'
  const block = {
    id,
    fields: {
      _detailsKey: 'description',
    },
    restrictions: {
      remove: true,
      drag: true,
      dropOn: true,
    },
    text: {
      style: 'Description',
      marks: {},
    },
  }
  return { block, id }
}

const createFeaturedRelationsBlock = (): BlockWithId => {
  const id = 'featuredRelations'
  const block = {
    id,
    restrictions: {
      remove: true,
      drag: true,
      dropOn: true,
    },
    featuredRelations: {},
  }
  return { block, id }
}

const createTextBlocks = (textContent: string | undefined): BlockWithId[] =>
  textContent
    ? textContent.split('\n').map((text) => {
        const id = uuidv4()
        const marks: Marks = generateMarksForText(text)
        const block = {
          id,
          text: {
            text,
            marks,
          },
        }
        return { block, id }
      })
    : []

const createAnnotationBlocks = (
  annotations: Annotation[] | undefined
): BlockWithId[] =>
  annotations
    ? annotations.map((annotation) => {
        const id = uuidv4()
        const block = {
          id,
          text: {
            text: annotation.title,
            marks: {
              marks: annotation.url
                ? [
                    {
                      range: { to: annotation.title.length },
                      type: 'Link',
                      param: annotation.url,
                    },
                  ]
                : [],
            },
          },
        }
        return { block, id }
      })
    : []

const createListBlocks = (
  listContent: ListContentItem[] | undefined
): BlockWithId[] =>
  listContent
    ? listContent.map((item) => {
        const id = uuidv4()
        const marks: Marks = generateMarksForText(item.text)
        const block = {
          id,
          text: {
            text: item.text,
            style: 'Checkbox',
            checked: item.isChecked,
            marks,
          },
        }
        return { block, id }
      })
    : []

const convertToAnyBlockPage = (note: GoogleKeepNote, mode: Mode): Page => {
  const hasTitle = note.title !== undefined && note.title !== ''
  const objectType = getObjectType(mode, hasTitle)
  console.log(`Converting ${note.sourceFileName} to ${objectType}`)

  let titleText = ''
  if (objectType === 'page') {
    titleText = note.title || genTitleFromDate(note.createdTimestampUsec)
  }

  const headerBlock = createHeaderBlock(objectType)
  const featuredRelationsBlock = createFeaturedRelationsBlock()
  const textBlocks = createTextBlocks(note.textContent)
  const listBlocks = createListBlocks(note.listContent)
  const annotationBlocks = createAnnotationBlocks(note.annotations)

  const allBlocks = [
    headerBlock,
    ...textBlocks,
    ...listBlocks,
    ...annotationBlocks,
    featuredRelationsBlock,
  ]

  if (objectType === 'page') {
    const titleBlock = createTitleBlock()
    const descriptionBlock = createDescriptionBlock()

    allBlocks.push(titleBlock)
    allBlocks.push(descriptionBlock)
  }

  const nonChildrenIds = ['title', 'description', 'featuredRelations']

  const blocks = allBlocks.map((blockWithId) => blockWithId.block)
  const childrenIds = allBlocks
    .filter((blockWithId) => !nonChildrenIds.includes(blockWithId.block.id))
    .map((blockWithId) => blockWithId.id)

  const mainBlock = {
    id: '',
    restrictions: {},
    childrenIds: [...childrenIds],
    smartblock: {},
  }

  const completeBlocks = [mainBlock, ...blocks]

  const tagId = getEnvVar('TAG_ID', '')
  const tag = tagId ? [tagId] : []

  let featuredRelations = ['type']
  if (objectType === 'page') {
    featuredRelations = [...featuredRelations, 'description']
  }

  return {
    sbType: 'Page',
    snapshot: {
      data: {
        blocks: completeBlocks,
        details: {
          backlinks: [],
          createdDate: convertMicrosecondsToSeconds(note.createdTimestampUsec),
          creator: '',
          description: '',
          featuredRelations,
          iconEmoji: '',
          id: '',
          lastModifiedBy: '',
          lastModifiedDate: convertMicrosecondsToSeconds(
            note.userEditedTimestampUsec
          ),
          lastOpenedDate: convertMicrosecondsToSeconds(
            note.userEditedTimestampUsec
          ),
          layout: getLayoutNumber(objectType),
          links: [],
          name: titleText,
          restrictions: [],
          snippet: '',
          sourceFilePath: note.sourceFilePath,
          tag,
          type: getObjectTypeString(objectType),
          workspaceId: '',
        },
        objectTypes: [getObjectTypeString(objectType)],
        relationLinks: relationLinks,
      },
    },
  }
}

export const generateAnyBlockFile = async (
  note: GoogleKeepNote,
  outputFolder: string,
  mode: Mode
) => {
  const filePath = path.resolve(outputFolder, `${note.sourceFileName}.json`)
  const anyBlockPage = convertToAnyBlockPage(note, mode)
  const serializedData = JSON.stringify(anyBlockPage, null, 2)
  await writeFile(filePath, serializedData)
  return filePath
}

const genTitleFromDate = (createdTimestampUsec: number) => {
  return new Date(createdTimestampUsec / 1000).toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

const getObjectType = (mode: Mode, hasTitle: boolean): ObjectType => {
  if (mode === 'pages') {
    return 'page'
  }
  if (mode === 'mixed') {
    return hasTitle ? 'page' : 'note'
  }
  throw new Error(`Invalid mode ${mode}`)
}

const getObjectTypeString = (objectType: ObjectType): string => {
  if (objectType === 'page') {
    return 'ot-page'
  }
  if (objectType === 'note') {
    return 'ot-note'
  }
  throw new Error(`Invalid object type ${objectType}`)
}

const getLayoutNumber = (objectType: ObjectType): number => {
  if (objectType === 'page') {
    return 0
  }
  if (objectType === 'note') {
    return 9
  }
  throw new Error(`Invalid object type ${objectType}`)
}

const relationLinks: RelationLink[] = [
  {
    key: 'id',
    format: 'object',
  },
  {
    key: 'type',
    format: 'object',
  },
  {
    key: 'snippet',
  },
  {
    key: 'lastModifiedDate',
    format: 'date',
  },
  {
    key: 'lastModifiedBy',
    format: 'object',
  },
  {
    key: 'sourceFilePath',
  },
  {
    key: 'iconEmoji',
    format: 'emoji',
  },
  {
    key: 'layout',
    format: 'number',
  },
  {
    key: 'name',
    format: 'shorttext',
  },
  {
    key: 'workspaceId',
    format: 'object',
  },
  {
    key: 'backlinks',
    format: 'object',
  },
  {
    key: 'creator',
    format: 'object',
  },
  {
    key: 'createdDate',
    format: 'date',
  },
  {
    key: 'description',
  },
  {
    key: 'iconImage',
    format: 'file',
  },
  {
    key: 'layoutAlign',
    format: 'number',
  },
  {
    key: 'coverId',
  },
  {
    key: 'coverScale',
    format: 'number',
  },
  {
    key: 'coverType',
    format: 'number',
  },
  {
    key: 'coverX',
    format: 'number',
  },
  {
    key: 'coverY',
    format: 'number',
  },
  {
    key: 'lastOpenedDate',
    format: 'date',
  },
  {
    key: 'featuredRelations',
    format: 'object',
  },
  {
    key: 'isFavorite',
    format: 'checkbox',
  },
  {
    key: 'links',
    format: 'object',
  },
  {
    key: 'internalFlags',
    format: 'number',
  },
  {
    key: 'restrictions',
    format: 'number',
  },
]

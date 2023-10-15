import * as dotenv from 'dotenv'
import { convertMicrosecondsToSeconds, getEnvVar } from '../utils'
import { Mode } from '../cli'
import {
  Block,
  BlockWithId,
  CreateAnyBlockPageConfig,
  ObjectType,
  Page,
} from './types'
import { relationLinks } from './config'
import { createBlock } from './blocks'
import { GoogleKeepNote } from '../keep/types'
dotenv.config()

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

const createCoreBlocks = (
  note: GoogleKeepNote,
  objectType: ObjectType
): BlockWithId[] => {
  const headerBlock = createBlock('Header', { objectType })
  const featuredRelationsBlock = createBlock('FeaturedRelations', undefined)

  const textBlocks: BlockWithId[] = note.textContent
    ? note.textContent
        .split('\n')
        .map((text) => createBlock('Text', { content: text }))
    : []

  const listBlocks: BlockWithId[] = note.listContent
    ? note.listContent.map((item) =>
        createBlock('List', { checked: item.isChecked, content: item.text })
      )
    : []

  const annotationBlocks: BlockWithId[] = note.annotations
    ? note.annotations.map((annotation) =>
        createBlock('Annotation', {
          url: annotation.url,
          content: annotation.title,
        })
      )
    : []

  let allBlocks: BlockWithId[] = [
    headerBlock,
    ...textBlocks,
    ...listBlocks,
    ...annotationBlocks,
    featuredRelationsBlock,
  ]

  if (objectType === 'page') {
    const titleBlock = createBlock('Title', undefined)
    const descriptionBlock = createBlock('Description', undefined)
    allBlocks = [...allBlocks, titleBlock, descriptionBlock]
  }

  return allBlocks
}

const createBlocks = (
  note: GoogleKeepNote,
  objectType: ObjectType
): Block[] => {
  const allBlocks = createCoreBlocks(note, objectType)

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

  return [mainBlock, ...blocks]
}

const createAnyBlockPage = (config: CreateAnyBlockPageConfig): Page => {
  const {
    blocks,
    titleText,
    createdTimestamp,
    editedTimestamp,
    objectType,
    sourcePath,
  } = config

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
        blocks,
        details: {
          backlinks: [],
          createdDate: convertMicrosecondsToSeconds(createdTimestamp),
          creator: '',
          description: '',
          featuredRelations,
          iconEmoji: '',
          id: '',
          lastModifiedBy: '',
          lastModifiedDate: convertMicrosecondsToSeconds(editedTimestamp),
          lastOpenedDate: convertMicrosecondsToSeconds(editedTimestamp),
          layout: getLayoutNumber(objectType),
          links: [],
          name: titleText,
          restrictions: [],
          snippet: '',
          sourceFilePath: sourcePath,
          tag,
          type: getObjectTypeString(objectType),
          workspaceId: '',
        },
        objectTypes: [getObjectTypeString(objectType)],
        relationLinks,
      },
    },
  }
}

export const convertToAnyBlockPage = (
  note: GoogleKeepNote,
  mode: Mode
): Page => {
  const hasTitle = note.title !== undefined && note.title !== ''
  const objectType = getObjectType(mode, hasTitle)

  let titleText = ''
  if (objectType === 'page') {
    titleText = note.title || genTitleFromDate(note.createdTimestampUsec)
  }

  const blocks = createBlocks(note, objectType)

  return createAnyBlockPage({
    blocks,
    titleText,
    createdTimestamp: note.createdTimestampUsec,
    editedTimestamp: note.userEditedTimestampUsec,
    objectType,
    sourcePath: note.sourceFilePath,
  })
}

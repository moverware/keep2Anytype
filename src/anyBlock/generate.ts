import { writeFile } from 'fs/promises'
import { GoogleKeepNote } from '../keep'
import * as dotenv from 'dotenv'
import { convertMicrosecondsToSeconds, getEnvVar } from '../utils'
import path from 'path'
import { Mode } from '../cli'
import { BlockWithId, ObjectType, Page } from './types'
import { relationLinks } from './config'
import { createBlock } from './blocks'
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

const convertToAnyBlockPage = (note: GoogleKeepNote, mode: Mode): Page => {
  const hasTitle = note.title !== undefined && note.title !== ''
  const objectType = getObjectType(mode, hasTitle)
  console.log(`Converting ${note.sourceFileName} to ${objectType}`)

  let titleText = ''
  if (objectType === 'page') {
    titleText = note.title || genTitleFromDate(note.createdTimestampUsec)
  }

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

  let allBlocks = [
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
        relationLinks,
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

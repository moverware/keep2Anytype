import { v4 as uuidv4 } from 'uuid'
import {
  AnnotationConfig,
  Block,
  BlockHandler,
  BlockType,
  BlockWithId,
  ContentfulConfig,
  HandlerConfig,
  HandlersMap,
  HeaderConfig,
  ListConfig,
  Mark,
  Marks,
  Range,
  Restrictions,
} from './types'
import { extractUrls } from '../utils'

const createRestrictions = (
  edit = false,
  remove = true,
  drag = true,
  dropOn = true
): { restrictions: Restrictions } => {
  const restrictions: Restrictions = {}

  if (edit) restrictions.edit = edit
  if (remove) restrictions.remove = remove
  if (drag) restrictions.drag = drag
  if (dropOn) restrictions.dropOn = dropOn

  return { restrictions }
}

const generateLinkMarksForText = (
  text: string
): Marks | Record<string, never> => {
  const marks: Mark[] = []
  const urls = extractUrls(text)
  if (urls.length === 0) {
    return {}
  }

  for (const url of urls) {
    const range: Range =
      url.start > 0 ? { to: url.end, from: url.start } : { to: url.end }
    marks.push({
      range,
      type: 'Link',
      param: url.url,
    })
  }

  return { marks }
}

const generateTextContent = (config: ContentfulConfig) => {
  const marks: Marks = generateLinkMarksForText(config.content)
  return {
    text: config.content,
    marks,
  }
}

// Block Handlers
const headerBlockHandler: BlockHandler<HeaderConfig> = {
  prepareContent(config) {
    const childrenIds = ['featuredRelations']
    if (config.objectType === 'page') {
      childrenIds.push('title', 'description')
    }

    return {
      id: 'header',
      ...createRestrictions(true),
      layout: { style: 'Header' },
      childrenIds,
    }
  },
}

const featuredRelationsBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      id: 'featuredRelations',
      ...createRestrictions(),
      featuredRelations: {},
    }
  },
}

const descriptionBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      id: 'description',
      ...createRestrictions(),
      fields: { _detailsKey: 'description' },
      text: { style: 'Description', marks: {} },
    }
  },
}

const titleBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      id: 'title',
      ...createRestrictions(),
      fields: { _detailsKey: ['name', 'done'] },
      text: { style: 'Title', marks: {} },
    }
  },
}

const textBlockHandler: BlockHandler<ContentfulConfig> = {
  prepareContent(config) {
    return {
      text: generateTextContent(config),
    }
  },
}

const listBlockHandler: BlockHandler<ListConfig> = {
  prepareContent(config) {
    return {
      text: {
        ...generateTextContent(config),
        style: 'Checkbox',
        checked: config.checked,
      },
    }
  },
}

const annotationBlockHandler: BlockHandler<AnnotationConfig> = {
  prepareContent(config) {
    return {
      text: {
        text: config.content,
        marks: {
          marks: [
            {
              range: { to: config.content.length },
              type: 'Link',
              param: config.url,
            },
          ],
        },
      },
    }
  },
}

const handlers: HandlersMap = {
  Text: textBlockHandler,
  List: listBlockHandler,
  Annotation: annotationBlockHandler,
  Header: headerBlockHandler,
  FeaturedRelations: featuredRelationsBlockHandler,
  Description: descriptionBlockHandler,
  Title: titleBlockHandler,
}

export const createBlock = <T extends BlockType>(
  type: T,
  config: HandlerConfig[T]
): BlockWithId => {
  let id = uuidv4()
  const handler = handlers[type]

  const fields = handler.prepareContent(config as HandlerConfig[T])

  if (fields.id) {
    id = fields.id
  }

  const block: Block = { id, ...fields }
  return { block, id }
}

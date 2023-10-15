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
  ListConfig,
  Mark,
  Marks,
  Range,
  Restrictions,
} from './types'
import { extractUrls } from '../utils'

const createRestrictions = (
  edit = true,
  remove = true,
  drag = true,
  dropOn = true
): Restrictions => ({
  edit,
  remove,
  drag,
  dropOn,
})

const prepareCommonContent = (
  restrictions: Restrictions,
  additionalFields: Partial<Block> = {}
): Partial<Block> => ({
  restrictions,
  ...additionalFields,
})

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
const headerBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      ...prepareCommonContent(createRestrictions(), {
        layout: { style: 'Header' },
      }),
    }
  },
}

const featuredRelationsBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      ...prepareCommonContent(createRestrictions(), {
        featuredRelations: {},
      }),
    }
  },
}

const descriptionBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      ...prepareCommonContent(createRestrictions(), {
        fields: { _detailsKey: 'description' },
        text: { style: 'Description', marks: {} },
      }),
    }
  },
}

const titleBlockHandler: BlockHandler<never> = {
  prepareContent() {
    return {
      ...prepareCommonContent(createRestrictions(), {
        fields: { _detailsKey: ['name', 'done'] },
        text: { style: 'Title', marks: {} },
      }),
    }
  },
}

const textBlockHandler: BlockHandler<ContentfulConfig> = {
  prepareContent(config): Partial<Block> {
    return {
      text: generateTextContent(config),
    }
  },
}

const listBlockHandler: BlockHandler<ListConfig> = {
  prepareContent(config): Partial<Block> {
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
  prepareContent(config): Partial<Block> {
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
  config?: HandlerConfig[T]
): BlockWithId => {
  const id = uuidv4()
  const handler = handlers[type]

  const specialFields = handler.prepareContent(config as HandlerConfig[T])

  const block: Block = { id, ...specialFields, ...config }
  return { block, id }
}

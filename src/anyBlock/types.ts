export type ObjectType = 'page' | 'note'

export type BlockWithId = { block: Block; id: string }

export interface Page {
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

export interface Block {
  id: string
  restrictions?: Restrictions
  childrenIds?: string[]
  layout?: Layout
  text?: Text
  fields?: Fields
  featuredRelations?: any
  smartblock?: any
}

export interface Restrictions {
  edit?: boolean
  remove?: boolean
  drag?: boolean
  dropOn?: boolean
}

export interface Layout {
  style: string
}

export interface Range {
  to: number
  from?: number
}

export interface Mark {
  range: Range
  type: string
  param?: string
}

export interface Marks {
  marks?: Mark[]
}

export interface Text {
  text?: string
  style?: string
  marks?: Marks
  checked?: boolean
}

export interface Fields {
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

export interface RelationLink {
  key: string
  format?: string
}

type SpecialBlockType = 'Header' | 'FeaturedRelations' | 'Description' | 'Title'
export type BlockType = 'Text' | 'List' | 'Annotation' | SpecialBlockType

export interface HeaderConfig {
  objectType: ObjectType
}

export interface ContentfulConfig {
  content: string
}

export interface ListConfig extends ContentfulConfig {
  checked: boolean
}

export interface AnnotationConfig extends ContentfulConfig {
  url: string
}

export type HandlerConfig = {
  Header: HeaderConfig
  FeaturedRelations: undefined
  Title: undefined
  Description: undefined
  Text: ContentfulConfig
  List: ListConfig
  Annotation: AnnotationConfig
}

export type HandlersMap = {
  [K in BlockType]: BlockHandler<HandlerConfig[K]>
}

export interface BlockHandler<T> {
  prepareContent(config: T): Partial<Block>
}

import {z} from 'zod'

export const fileMetadataSchema = z.object({
  language: z.string().describe('The primary programming language detected in the code snippet'),
  description: z.string().max(200).describe('A concise description of what the code does'),
  prettyFilename: z
    .string()
    .describe(
      'A clear, descriptive filename that represents the content of this file, using kebab-case (e.g., user-authentication-middleware.ts)',
    ),
})

export type FormValues = {
  files: File[]
}

export type SearchFormValues = {
  query: string
}

export type SearchResultCellProps = {
  result: {
    score: number
    id: string
    payload: {
      filename: string
      prettyFilename: string
      fullContent: string
      language: string
      description: string
    }
  }
}

export const COLLECTION_SCHEMA = [
  {name: 'filename', schema: 'keyword'},
  {name: 'prettyFilename', schema: 'keyword'},
  {name: 'language', schema: 'keyword'},
  {
    name: 'description',
    schema: 'text',
    // Optional: Add text index params if needed, e.g., tokenizer
    // text_index_params: {
    //   tokenizer: 'whitespace',
    //   lowercase: true,
    // }
  },
  {
    name: 'fullContent',
    schema: 'text',
    text_index_params: {
      tokenizer: 'word',
      lowercase: true,
    },
  },
  // 'fullContent' will be stored but not indexed by default
]

export interface CodeSnippet {
  code: string
  score: number
}

export interface SearchMetadata {
  total_results: number
  query_embedding_model: string
}

export interface SearchResult {
  snippets: CodeSnippet[]
  metadata: SearchMetadata
}

export type CodeSnippetSearchParams = {
  query: string
  limit: number
}

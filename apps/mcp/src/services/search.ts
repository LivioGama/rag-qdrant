import {QdrantClient} from '@qdrant/js-client-rest'
import OpenAI from 'openai'
import type {CodeSnippet, SearchMetadata, SearchResult} from '../types.js'

export class SearchService {
  private qdrant: QdrantClient
  private openai: OpenAI
  private readonly collectionName = 'code_snippets'
  private readonly embeddingModel = 'text-embedding-3-small'

  constructor() {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    })

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  private async getQueryEmbedding(query: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: query,
      encoding_format: 'float',
    })

    if (!response.data?.[0]?.embedding) {
      throw new Error('Failed to generate embedding: No embedding data returned')
    }

    return response.data[0].embedding
  }

  async searchCodeSnippets(query: string, limit: number): Promise<SearchResult> {
    try {
      const queryEmbedding = await this.getQueryEmbedding(query)

      const searchResponse = await this.qdrant.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        with_payload: true,
      })

      const snippets: CodeSnippet[] = searchResponse
        .filter(hit => hit.payload && typeof hit.payload.fullContent === 'string')
        .map(hit => ({
          code: hit.payload!.fullContent as string,
          score: hit.score,
        }))

      const metadata: SearchMetadata = {
        total_results: searchResponse.length,
        query_embedding_model: this.embeddingModel,
      }

      return {snippets, metadata}
    } catch (error) {
      throw new Error('Failed to search code snippets')
    }
  }
}

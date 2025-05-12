import OpenAI from 'openai'

export class EmbeddingService {
  private openai: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    this.openai = new OpenAI({apiKey})
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      })

      if (!response.data?.[0]?.embedding) {
        throw new Error('Failed to generate embedding: No embedding data returned')
      }

      return response.data[0].embedding
    } catch (error) {
      throw error
    }
  }
}

import {OPENAI_CHAT_MODEL, OPENAI_EMBEDDING_MODEL, VECTOR_SIZE} from '@/consts'
import {openai} from '@ai-sdk/openai'
import {embed, generateObject} from 'ai'
import {z} from 'zod'

const openaiEmbeddingModel = openai.embedding(OPENAI_EMBEDDING_MODEL)
const openaiChatModel = openai(OPENAI_CHAT_MODEL)

export const getOpenAIEmbedding = async (text: string) => {
  try {
    const result = await embed({
      model: openaiEmbeddingModel,
      value: text,
    })

    if (
      !result.embedding ||
      !Array.isArray(result.embedding) ||
      result.embedding.length !== VECTOR_SIZE
    )
      throw new Error('Invalid embedding format from OpenAI')

    return result.embedding
  } catch (error: any) {
    console.error('Error getting embedding from OpenAI:', error.message)
    throw new Error(`OpenAI embedding error: ${error.message}`)
  }
}

export const generateOpenAIObject = async <T extends z.ZodType>(schema: T, prompt: string) => {
  try {
    const result = await generateObject({
      model: openaiChatModel,
      schema,
      prompt,
    })

    return result.object
  } catch (error: any) {
    console.error('Error generating object from OpenAI:', error.message)
    throw new Error(`OpenAI generation error: ${error.message}`)
  }
}

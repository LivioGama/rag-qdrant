import {OLLAMA_CHAT_MODEL, OLLAMA_EMBEDDING_MODEL, OLLAMA_URL} from '@/consts'
import axios from 'axios'

export const getOllamaEmbedding = async (text: string) => {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    })

    return response.data.embedding
  } catch (error: any) {
    console.error('Error getting embedding from Ollama:', error.message)
    throw new Error(`Ollama embedding error: ${error.message}`)
  }
}

export const generateOllamaText = async (prompt: string) => {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_CHAT_MODEL,
      prompt,
      stream: false,
    })

    return response.data.response
  } catch (error: any) {
    console.error('Error generating text from Ollama:', error.message)
    throw new Error(`Ollama generation error: ${error.message}`)
  }
}

export const parseOllamaJsonResponse = (response: string) => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*}/)
    if (!jsonMatch) throw new Error('Could not extract JSON from Ollama response')

    return JSON.parse(jsonMatch[0])
  } catch (error: any) {
    console.error('Error parsing Ollama response:', error.message)
    throw new Error(`Failed to parse response from Ollama: ${error.message}`)
  }
}

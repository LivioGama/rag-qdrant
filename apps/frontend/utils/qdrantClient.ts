import {COLLECTION_NAME, QDRANT_API_KEY, QDRANT_URL} from '@/consts'
import {QdrantClient} from '@qdrant/js-client-rest'
import {v4 as uuidv4} from 'uuid'

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
})

export type FilePayload = {
  filename: string
  prettyFilename: string
  fullContent: string
  language: string
  description: string
}

export const searchSimilarDocuments = async (
  embedding: number[],
  limit = 1,
  scoreThreshold = 0.95,
) =>
  client.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    score_threshold: scoreThreshold,
  })

export const storeDocument = async (embedding: number[], payload: FilePayload) => {
  const point = {
    id: uuidv4(),
    vector: embedding,
    payload,
  }

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [point],
  })

  return point.id
}

export const getAllDocuments = async (limit = 100) =>
  client
    .scroll(COLLECTION_NAME, {
      limit,
      with_payload: true,
      with_vector: false,
    })
    .then(response => response.points)

export const searchDocuments = async (embedding: number[], limit = 10) =>
  client.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
  })

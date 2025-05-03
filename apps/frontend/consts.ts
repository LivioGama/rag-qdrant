export const USE_LOCAL_LLM = process.env.USE_LOCAL_LLM === 'true'

export const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
export const OPENAI_CHAT_MODEL = 'gpt-3.5-turbo'

export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
export const OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text'
export const OLLAMA_CHAT_MODEL = 'deepseek-coder:6.7b-instruct'

export const VECTOR_SIZE = USE_LOCAL_LLM ? 768 : 1536
export const COLLECTION_NAME = USE_LOCAL_LLM ? 'code_snippets_local' : 'code_snippets'

export const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY

export const SIMILARITY_THRESHOLD = 0.95

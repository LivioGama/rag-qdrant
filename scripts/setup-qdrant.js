require('dotenv').config()
const {QdrantClient} = require('@qdrant/js-client-rest')
const {
  QDRANT_URL,
  QDRANT_API_KEY,
  COLLECTION_NAME,
  VECTOR_SIZE,
} = require('../apps/frontend/consts.ts')
const {COLLECTION_SCHEMA} = require('frontend/models/index.js')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

const clientOptions = {url: QDRANT_URL}
if (QDRANT_API_KEY) {
  clientOptions.apiKey = QDRANT_API_KEY
}
const qdrantClient = new QdrantClient(clientOptions)

const askQuestion = query => new Promise(resolve => readline.question(query, resolve))

const setupCollection = async () => {
  const recreate = process.argv.includes('--recreate')
  let collectionExists = false

  try {
    console.group('\x1b[36m🔄 Qdrant Setup Process\x1b[0m')
    console.log(
      `\x1b[33mℹ️ Checking if collection '${COLLECTION_NAME}' exists at ${QDRANT_URL}...\x1b[0m`,
    )
    try {
      await qdrantClient.getCollection(COLLECTION_NAME)
      collectionExists = true
      console.log(`\x1b[32m✓ Collection '${COLLECTION_NAME}' found.\x1b[0m`)
    } catch (error) {
      if (error.status === 404) {
        console.log(`\x1b[33mℹ️ Collection '${COLLECTION_NAME}' does not exist.\x1b[0m`)
        collectionExists = false
      } else {
        throw error
      }
    }

    if (collectionExists && recreate) {
      console.warn(
        `WARNING: The --recreate flag will delete all data in the '${COLLECTION_NAME}' collection.`,
      )
      const answer = await askQuestion('Are you sure you want to proceed? (y/n): ')
      readline.close()

      if (answer.toLowerCase() !== 'y') {
        console.log('\x1b[31m✗ Operation cancelled by user.\x1b[0m')
        process.exit(0)
      }

      console.group('\x1b[36m🗑️ Cleanup\x1b[0m')
      console.log(`\x1b[33mℹ️ Deleting collection '${COLLECTION_NAME}'...\x1b[0m`)
      await qdrantClient.deleteCollection(COLLECTION_NAME)
      console.log(`\x1b[32m✓ Collection '${COLLECTION_NAME}' deleted.\x1b[0m`)
      console.groupEnd()
      collectionExists = false
    }

    if (!collectionExists) {
      console.group('\x1b[36m📦 Collection Creation\x1b[0m')
      console.log(
        `\x1b[33mℹ️ Creating collection '${COLLECTION_NAME}' with vector size ${VECTOR_SIZE}...\x1b[0m`,
      )
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      })
      console.log(`\x1b[32m✓ Collection '${COLLECTION_NAME}' created.\x1b[0m`)
      console.groupEnd()

      console.group('\x1b[36m📑 Index Creation\x1b[0m')
      console.log('\x1b[33mℹ️ Creating payload indexes...\x1b[0m')
      for (const field of COLLECTION_SCHEMA) {
        console.log(
          `\x1b[34mℹ️ Creating index for payload field: ${field.name} (Type: ${field.schema})\x1b[0m`,
        )
        await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: field.name,
          field_schema: field.schema,
          ...(field.text_index_params && {params: field.text_index_params}),
          wait: true,
        })
      }
      console.log('\x1b[32m✓ Payload indexes created successfully.\x1b[0m')
      console.groupEnd()
    } else if (!recreate) {
      console.log(
        `Collection '${COLLECTION_NAME}' already exists. Indexes are assumed to be correct. Use --recreate to force schema update.`,
      )
    }

    console.log('\x1b[32m✓ Qdrant setup completed successfully.\x1b[0m')
    console.groupEnd()
  } catch (error) {
    console.error('Error during Qdrant setup:', error)
    readline.close()
    process.exit(1)
  } finally {
    if (!readline.closed) {
      readline.close()
    }
  }
}

setupCollection()

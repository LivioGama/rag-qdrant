import {QdrantClient} from '@qdrant/js-client-rest'
import axios from 'axios'
import {config} from 'dotenv'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

import {COLLECTION_NAME, QDRANT_API_KEY, QDRANT_URL, VECTOR_SIZE} from '../apps/frontend/consts.ts'

const {prompt} = require('enquirer')

config()

const clientOptions = {url: QDRANT_URL}
if (QDRANT_API_KEY) {
  clientOptions.apiKey = QDRANT_API_KEY
}
const qdrantClient = new QdrantClient(clientOptions)

const API_ENDPOINT = 'http://localhost:3000/api/process-file'

const MAX_FILES_WITHOUT_CONFIRM = 5

const IGNORED_DIRECTORIES = new Set(['node_modules', 'build', 'dist', 'coverage', 'fixtures'])

const findTsFiles = dir => {
  let results = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const itemPath = path.join(dir, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      if (item.startsWith('.') || IGNORED_DIRECTORIES.has(item)) continue
      results = results.concat(findTsFiles(itemPath))
    } else if (itemPath.endsWith('.tsx') || itemPath.endsWith('.ts')) {
      results.push(itemPath)
    }
  }

  return results
}

const processFile = async filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const filename = path.basename(filePath)

    const response = await axios.post(API_ENDPOINT, {
      content,
      filename,
    })

    const result = response.data

    if (response.status >= 200 && response.status < 300) {
      console.log(`\x1b[32m✓ Successfully processed ${filename}\x1b[0m`)
      return {success: true, file: filename}
    } else {
      console.group('\x1b[31m❌ Processing Error\x1b[0m')
      console.log(`\x1b[31m✗ Error processing ${filename}: ${result.error}\x1b[0m`)
      if (result.details) {
        console.log(`\x1b[31m  Details: ${result.details}\x1b[0m`)
      }
      console.groupEnd()
      return {success: false, file: filename, error: result.error}
    }
  } catch (error) {
    console.group('\x1b[31m❌ Processing Exception\x1b[0m')
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message
      console.log(`\x1b[31m✗ Exception processing ${filePath}: ${errorMessage}\x1b[0m`)
      console.groupEnd()
      return {success: false, file: filePath, error: errorMessage}
    } else {
      console.log(`\x1b[31m✗ Exception processing ${filePath}: ${error.message}\x1b[0m`)
      console.groupEnd()
      return {success: false, file: filePath, error: error.message}
    }
  }
}

const main = async () => {
  try {
    const targetDir = process.argv[2]

    if (!targetDir) {
      console.group('\x1b[31m❌ Validation Error\x1b[0m')
      console.log('\x1b[31m✗ Please provide a directory path as an argument\x1b[0m')
      console.log('\x1b[33mℹ️ Usage: node load-charge-test.js <directory-path>\x1b[0m')
      console.groupEnd()
      process.exit(1)
    }

    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      console.group('\x1b[31m❌ Directory Error\x1b[0m')
      console.log(`\x1b[31m✗ Directory not found: ${targetDir}\x1b[0m`)
      console.groupEnd()
      process.exit(1)
    }

    console.group('\x1b[36m🔍 File Search\x1b[0m')
    console.log(`\x1b[33mℹ️ Searching for TS files in: ${targetDir}\x1b[0m`)

    const tsFiles = findTsFiles(targetDir)

    if (tsFiles.length === 0) {
      console.log('\x1b[31m✗ No TS files found in the specified directory.\x1b[0m')
      console.groupEnd()
      process.exit(0)
      console.groupEnd()
    }

    console.log(`\x1b[32m✓ Found ${tsFiles.length} TS files.\x1b[0m`)
    console.groupEnd()

    if (tsFiles.length > MAX_FILES_WITHOUT_CONFIRM) {
      console.group('\x1b[36m📑 File List\x1b[0m')
      tsFiles.forEach(file => {
        console.log(`\x1b[34mℹ️ ${file}\x1b[0m`)
      })
      console.groupEnd()

      const response = await prompt({
        type: 'confirm',
        name: 'proceed',
        message: `You are about to process ${tsFiles.length} files. Do you want to continue?`,
      })

      if (!response.proceed) {
        console.log('\x1b[33mℹ️ Operation cancelled by user\x1b[0m')
        console.groupEnd()
        process.exit(0)
      }
    }

    console.time('\x1b[36m⏱️ Total Processing Time\x1b[0m')

    try {
      console.group('\x1b[36m📦 Collection Management\x1b[0m')
      console.log(`\x1b[33mℹ️ Ensuring collection '${COLLECTION_NAME}' exists...\x1b[0m`)
      await qdrantClient.getCollection(COLLECTION_NAME)
      console.log(`\x1b[32m✓ Collection '${COLLECTION_NAME}' already exists.\x1b[0m`)
      console.log(
        `\x1b[33mℹ️ Clearing all documents from collection '${COLLECTION_NAME}'...\x1b[0m`,
      )

      const deleteResult = await qdrantClient.delete(COLLECTION_NAME, {
        filter: {must: []},
      })

      if (deleteResult.status === 'ok' || deleteResult.status === 'acknowledged') {
        console.log(
          `\x1b[32m✓ Collection cleared successfully. Operation ID: ${deleteResult.operation_id}, Status: ${deleteResult.status}\x1b[0m`,
        )
      } else {
        console.log(
          `\x1b[33m⚠️ Collection clearing finished with status: ${deleteResult.status}\x1b[0m`,
          deleteResult,
        )
      }
      console.groupEnd()
    } catch (error) {
      if (error.status === 404) {
        console.group('\x1b[36m📦 Collection Creation\x1b[0m')
        console.log(`\x1b[33mℹ️ Collection '${COLLECTION_NAME}' does not exist. Creating...\x1b[0m`)
        try {
          await qdrantClient.createCollection(COLLECTION_NAME, {
            vectors: {size: VECTOR_SIZE, distance: 'Cosine'},
          })
          console.log(`\x1b[32m✓ Collection '${COLLECTION_NAME}' created successfully.\x1b[0m`)
          console.groupEnd()
        } catch (creationError) {
          console.group('\x1b[31m❌ Collection Creation Error\x1b[0m')
          console.log(
            `\x1b[31m✗ Failed to create collection '${COLLECTION_NAME}': ${creationError}\x1b[0m`,
          )
          console.groupEnd()
          process.exit(1)
        }
      } else {
        console.group('\x1b[31m❌ Collection Check Error\x1b[0m')
        console.log(`\x1b[31m✗ Error checking collection '${COLLECTION_NAME}': ${error}\x1b[0m`)
        console.groupEnd()
        process.exit(1)
      }
    }

    console.group('\x1b[36m🔄 Processing Files\x1b[0m')
    console.log('\x1b[33mℹ️ Starting to process files...\x1b[0m')

    const results = {
      success: 0,
      failed: 0,
      files: [],
    }

    for (const file of tsFiles) {
      const result = await processFile(file)
      results.files.push(result)

      if (result.success) {
        results.success++
      } else {
        results.failed++
      }
    }

    console.group('\x1b[36m📊 Processing Summary\x1b[0m')
    console.log(`\x1b[34mℹ️ Total files: ${tsFiles.length}\x1b[0m`)
    console.log(`\x1b[32m✓ Successfully processed: ${results.success}\x1b[0m`)
    console.log(`\x1b[31m✗ Failed: ${results.failed}\x1b[0m`)

    if (results.failed > 0) {
      console.group('\x1b[31m❌ Failed Files\x1b[0m')
      results.files
        .filter(r => !r.success)
        .forEach(r => console.log(`\x1b[31m✗ ${r.file}:\x1b[0m ${r.error}`))
      console.groupEnd()
    }
    console.groupEnd()
    console.groupEnd()
    console.timeEnd('\x1b[36m⏱️ Total Processing Time\x1b[0m')
  } catch (error) {
    console.timeEnd('\x1b[36m⏱️ Total Processing Time\x1b[0m')
    console.group('\x1b[31m❌ Unexpected Error\x1b[0m')
    console.log('\x1b[31m✗ Error:\x1b[0m', error)
    console.groupEnd()
    process.exit(1)
  }
}

main()

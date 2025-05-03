import {SIMILARITY_THRESHOLD, USE_LOCAL_LLM} from '@/consts'
import {fileMetadataSchema} from '@/models'
import {getLanguageFromFilename, minifyCode} from '@/utils/fileHelper'
import {generateOllamaText, getOllamaEmbedding, parseOllamaJsonResponse} from '@/utils/ollamaClient'
import {generateOpenAIObject, getOpenAIEmbedding} from '@/utils/openaiClient'
import {FilePayload, searchSimilarDocuments, storeDocument} from '@/utils/qdrantClient'
import isEmpty from 'lodash/isEmpty'
import {NextRequest} from 'next/server'

export const POST = async (request: NextRequest) => {
  try {
    const {content, filename} = await request.json()

    if (isEmpty(content) || isEmpty(filename)) {
      return Response.json({error: 'Missing content or filename'}, {status: 400})
    }

    const optimizedContent = minifyCode(content)
    console.group('\x1b[36m📝 File Processing\x1b[0m')
    console.log('\x1b[33mℹ️ Processing request:\x1b[0m', {
      filename,
      contentLength: content.length,
    })
    const reductionPercentage =
      content.length > 0
        ? (((content.length - optimizedContent.length) / content.length) * 100).toFixed(1)
        : 0
    console.log(
      `\x1b[32m✓ Optimized content: ${content.length} -> ${optimizedContent.length} bytes (${reductionPercentage}% reduction)\x1b[0m`,
    )
    console.groupEnd()

    const embedding = USE_LOCAL_LLM
      ? await getOllamaEmbedding(content)
      : await getOpenAIEmbedding(content)

    const similarDocs = await searchSimilarDocuments(embedding, 1, SIMILARITY_THRESHOLD)

    if (!isEmpty(similarDocs)) {
      return Response.json(
        {
          error: 'Similar file already exists',
        },
        {status: 409},
      )
    }

    const metadataPrompt = `Analyze the following code content and its filename to provide:
1. The primary programming language
2. A concise description (max 200 chars) of what the code does
3. A clear, descriptive filename in kebab-case that represents the file's purpose

Current filename: '${filename}'

Content:
\n---\n${optimizedContent.substring(0, 4000)}...
---
`

    const metadata = USE_LOCAL_LLM
      ? await generateOllamaText(`${metadataPrompt}
Please respond with a valid JSON object containing these fields:
{
  "language": "${getLanguageFromFilename(filename)}", // this is already the correct value
  "description": "generate concise description of what the code does",
  "prettyFilename": "clear-descriptive-filename-in-kebab-case"
}
`).then(parseOllamaJsonResponse)
      : await generateOpenAIObject(fileMetadataSchema, metadataPrompt)

    if (!metadata.language || !metadata.description || !metadata.prettyFilename) {
      throw new Error('Incomplete metadata')
    }

    const payload: FilePayload = {
      filename,
      prettyFilename: metadata.prettyFilename,
      fullContent: content,
      language: metadata.language,
      description: metadata.description,
    }

    try {
      const id = await storeDocument(embedding, payload)

      return Response.json({
        message: `File ${filename} processed and indexed successfully.`,
        id,
        metadata,
      })
    } catch (error: any) {
      return Response.json(
        {
          error: 'Failed to store data in Qdrant',
          details: error?.message || 'Unknown error',
        },
        {status: 500},
      )
    }
  } catch (error: any) {
    console.error(error)
    return Response.json(
      {
        error: 'An unexpected error occurred',
        details: error?.message || 'Unknown error',
      },
      {status: 500},
    )
  }
}

import {USE_LOCAL_LLM} from '@/consts'
import {getOllamaEmbedding} from '@/utils/ollamaClient'
import {getOpenAIEmbedding} from '@/utils/openaiClient'
import {getAllDocuments, searchDocuments} from '@/utils/qdrantClient'
import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'edge'

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const fetchAll = url.searchParams.get('all') === 'true'

    if (!fetchAll) {
      return NextResponse.json(
        {error: 'Invalid request, use POST for search or GET with all=true'},
        {status: 400},
      )
    }

    const allDocuments = await getAllDocuments(500)

    return NextResponse.json(allDocuments)
  } catch (error: any) {
    console.error('Error fetching all documents:', error)
    return NextResponse.json({error: error.message || 'Failed to fetch documents'}, {status: 500})
  }
}

export const POST = async (req: Request) => {
  try {
    const {query} = await req.json()

    if (!query) {
      return NextResponse.json({error: 'Query is required'}, {status: 400})
    }

    const embedding = USE_LOCAL_LLM
      ? await getOllamaEmbedding(query)
      : await getOpenAIEmbedding(query)

    const searchResponse = await searchDocuments(embedding)

    return NextResponse.json(searchResponse)
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({error: error.message || 'Failed to perform search'}, {status: 500})
  }
}

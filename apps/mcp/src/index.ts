import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import * as dotenv from 'dotenv'
import {z} from 'zod'
import {SearchService} from './services/search.js'
import type {CodeSnippetSearchParams} from './types.js'

// Load environment variables from .env file
dotenv.config()

// Add process-level error handlers
process.on('uncaughtException', error => {
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1)
})

const searchService = new SearchService()

const server = new McpServer({
  name: 'code-snippet-search',
  description: 'Search for relevant code snippets in the codebase using semantic search',
  version: '0.0.11',
  capabilities: {
    tools: {
      listChanged: true,
    },
  },
  checkCompatibility: false,
  transport: {
    type: 'stdio',
  },
})

const searchParamsSchema = {
  query: z.string().describe('The search query to find relevant code snippets'),
  limit: z.number().default(4).describe('Maximum number of snippets to return'),
}

server.tool(
  'search_code_snippets',
  searchParamsSchema,
  {
    title: 'Search for relevant code snippets using semantic search',
  },
  async ({query, limit}: CodeSnippetSearchParams) => {
    try {
      const result = await searchService.searchCodeSnippets(query, limit)
      return {
        content: result.snippets.map(snippet => ({
          type: 'text' as const,
          text: `${snippet.code}\nRelevance: ${snippet.score}`,
        })),
        _meta: {
          total_results: result.metadata.total_results,
          model: result.metadata.query_embedding_model,
        },
      }
    } catch (error) {
      throw new Error('Failed to search code snippets')
    }
  },
)

const startServer = async () => {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)

    process.on('SIGINT', () => {
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      process.exit(0)
    })
  } catch (error) {
    process.exit(1)
  }
}

startServer()

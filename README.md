# RAG-Qdrant Playground 🚀

A Turborepo workspace containing a Next.js frontend to feed a vectorial database using Qdrant.

This project focuses on collecting source code files, specifically TypeScript, JavaScript, and related web technologies.

## 🛠️ Quick Setup

### Automated Setup

Run the following command to automatically set up everything (recommended):
```bash
bun run setup-all
```

This will:
- Check and install prerequisites (Docker, Bun)
- Set up environment variables
- Install project dependencies
- Start Qdrant database
- Install and configure Ollama with required models
- Initialize the database schema

### Manual Setup Steps

If you prefer to set up manually, follow these steps:

1. Set up environment variables
2. Start Qdrant database
3. Initialize database schema
4. (Optional) Configure local LLM with Ollama

## 🔑 Environment Setup

Create a `.env` file in the root directory:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here           # For generating embeddings

# Optional - Qdrant Cloud
QDRANT_URL=http://localhost:6333                  # Defaults to http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here          # Required only for Qdrant cloud

# Optional - Local LLM with Ollama
USE_LOCAL_LLM=true                               # Use Ollama instead of OpenAI
OLLAMA_URL=http://localhost:11434                # Ollama API URL
```

Link the environment file to the frontend:
```bash
sudo ln -sf .env apps/frontend/.env
```

## 💾 Qdrant Database Setup

### Local Installation

```bash
# Pull the image
docker pull qdrant/qdrant

# Run the container
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant
```

📍 Access Points:
- API: http://localhost:6333
- Dashboard: http://localhost:6333/dashboard

### Initialize Database Schema

```bash
# First-time setup
bun run setup:qdrant

# Force recreate collection and indexes
bun run setup:qdrant --recreate
```

## 🤖 Local LLM Setup (Optional)

This setup replaces OpenAI with local models using [Ollama](https://ollama.ai/):
- `nomic-embed-text`: For code content embeddings
- `deepseek-coder:6.7b-instruct` or `mistral:7b`: For code summary assessment

> Uses a separate collection `code_snippets_local` to preserve your main collection.

### Ollama Configuration

1. Install Ollama from [ollama.com](https://ollama.ai/)

2. Configure environment:
   ```bash
   USE_LOCAL_LLM=true
   # OLLAMA_URL=optional_remote_ollama_url
   ```

3. Install required models:
   ```bash
   # Embeddings model
   ollama pull nomic-embed-text
   
   # Chat completion model
   ollama run mistral:7b
   ```

4. Start Ollama:
   ```bash
   ollama serve
   ```

5. Restart the application to use local LLMs

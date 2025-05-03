#!/usr/bin/env node

import {execSync} from 'child_process'
import Enquirer from 'enquirer'
import {existsSync, symlinkSync, unlinkSync, writeFileSync} from 'fs'
import {platform} from 'os'
import {join, relative} from 'path'

const isMacOS = platform() === 'darwin'
const isLinux = platform() === 'linux'

const run = (cmd, options = {}) => {
  try {
    execSync(cmd, {stdio: 'inherit', ...options})
    return true
  } catch (e) {
    if (options.ignoreError) return false
    console.error(`Failed to execute: ${cmd}`)
    console.error(e.message)
    process.exit(1)
  }
}

const checkPrerequisites = () => {
  console.log('🔍 Checking prerequisites...')

  if (!run('docker --version', {stdio: 'ignore', ignoreError: true})) {
    console.error('❌ Docker is not installed. Please install Docker first:')
    console.log(
      isMacOS
        ? '   https://docs.docker.com/desktop/install/mac-install/'
        : isLinux
          ? '   https://docs.docker.com/engine/install/'
          : '   https://docs.docker.com/desktop/install/windows-install/',
    )
    process.exit(1)
  }

  if (!run('bun --version', {stdio: 'ignore', ignoreError: true})) {
    console.error('❌ Bun is not installed. Installing Bun...')
    run('curl -fsSL https://bun.sh/install | bash')
    console.log('✅ Bun installed successfully')
  }
}

const setupEnvironment = async () => {
  console.log('📝 Setting up environment...')

  const envPath = join(process.cwd(), '.env')
  const frontendEnvPath = join(process.cwd(), 'apps/frontend/.env')

  if (!existsSync(envPath)) {
    const llmChoice = await new Enquirer.Select({
      name: 'llm',
      message: 'Choose your LLM provider',
      choices: [
        {name: 'Ollama (local LLM, free)', value: 'ollama'},
        {name: 'OpenAI (requires API key)', value: 'openai'},
      ],
    }).run()

    const useOllama = llmChoice === 'ollama'
    let envContent = ''

    if (useOllama) {
      envContent = `# Local LLM Configuration
USE_LOCAL_LLM=true
OLLAMA_URL=http://localhost:11434

# Qdrant Configuration (defaults are fine for local setup)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=`
      console.log('\n✅ Configured for local Ollama LLM')
    } else {
      const apiKey = await new Enquirer.Password({
        name: 'apiKey',
        message: 'Enter your OpenAI API key',
      }).run()

      envContent = `# OpenAI Configuration
OPENAI_API_KEY=${apiKey}
USE_LOCAL_LLM=false

# Qdrant Configuration (defaults are fine for local setup)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=`
      console.log('\n✅ Configured for OpenAI')
    }

    writeFileSync(envPath, envContent)

    // Create symlink for frontend .env
    try {
      // Remove the existing symlink or file if it exists
      if (existsSync(frontendEnvPath)) {
        unlinkSync(frontendEnvPath)
      }
      // Create relative symlink
      const relativePath = relative(join(process.cwd(), 'apps/frontend'), envPath)
      symlinkSync(relativePath, frontendEnvPath)
      console.log('✅ Environment files created and linked')
    } catch (error) {
      console.log('⚠️ Could not create symlink, copying .env instead...')
      writeFileSync(frontendEnvPath, envContent)
      console.log('✅ Environment files created and copied')
    }
  }
}

const setupQdrant = () => {
  console.log('\n🗄️ Setting up Qdrant...')

  run('docker pull qdrant/qdrant')

  // Check if Qdrant is already running
  if (!run('docker ps | grep qdrant', {stdio: 'ignore', ignoreError: true})) {
    run(
      'docker run -d -p 6333:6333 -p 6334:6334 -v "$(pwd)/qdrant_storage:/qdrant/storage:z" qdrant/qdrant',
    )
    console.log('✅ Qdrant is now running')
  } else {
    console.log('ℹ️ Qdrant is already running')
  }
}

const setupOllama = async () => {
  const envContent = existsSync('.env')
    ? await import('fs').then(fs => fs.readFileSync('.env', 'utf8'))
    : ''
  const useOllama = envContent.includes('USE_LOCAL_LLM=true')

  if (!useOllama) {
    console.log('\n🤖 Skipping Ollama setup (OpenAI selected)')
    return
  }

  console.log('\n🤖 Setting up Ollama...')

  if (!run('ollama --version', {stdio: 'ignore', ignoreError: true})) {
    if (isMacOS) {
      run('curl -fsSL https://ollama.ai/install.sh | sh')
    } else if (isLinux) {
      run('curl -fsSL https://ollama.ai/install.sh | sh')
    } else {
      console.log('⚠️ Please install Ollama manually from https://ollama.ai')
      return
    }
  }

  // Start Ollama server
  if (!run('pgrep ollama', {stdio: 'ignore', ignoreError: true})) {
    run('ollama serve &')
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  console.log('📥 Pulling Ollama models...')
  run('ollama pull nomic-embed-text')
  run('ollama pull mistral:7b')
}

const setupProject = async () => {
  try {
    console.log('🚀 Starting complete setup...\n')

    checkPrerequisites()
    console.log('')

    await setupEnvironment()
    console.log('')

    console.log('📦 Installing dependencies...')
    run('bun install')
    console.log('')

    setupQdrant()
    console.log('')

    await setupOllama()
    console.log('')

    console.log('🔧 Initializing Qdrant schema...')
    run('bun run setup:qdrant')

    console.log('\n✨ Setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Start the development server with: bun dev')
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupProject()

import {execSync} from 'child_process'
import fs from 'fs'
import path from 'path'
import {logger} from './logger' // Import shared logger

// --- Logger Setup removed ---

// --- Interfaces ---
export interface IndexedFileInfo {
  filePath: string
  projectRootDir: string
  featureType: string
  description?: string
  lastModified: number
}

interface LLMInfo {
  featureType: string
  description: string
}

// --- File System, Git & Project Discovery Utilities ---

const getGitIgnoredFiles = (targetDir: string): string[] => {
  try {
    if (!fs.existsSync(path.join(targetDir, '.git'))) {
      return []
    }
    const ignored = execSync('git ls-files --ignored --exclude-standard --others', {
      cwd: targetDir,
      stdio: 'pipe',
    })
      .toString()
      .split('\n')
      .filter(p => p)

    const gitDir = path.join(targetDir, '.git')
    return ignored.map(p => path.join(targetDir, p)).concat(gitDir)
  } catch (error) {
    return []
  }
}

const getAllTsFilesRecursive = (dir: string, ignoredFiles: Set<string>): string[] => {
  let files: string[] = []
  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)

      if (ignoredFiles.has(fullPath) || item === 'node_modules' || item.startsWith('.')) {
        continue
      }

      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          files = files.concat(getAllTsFilesRecursive(fullPath, ignoredFiles))
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
          files.push(fullPath)
        }
      } catch (statError) {
        logger.warn(`Could not stat file ${fullPath}`, {error: statError})
      }
    }
  } catch (readdirError) {
    logger.warn(`Could not read directory ${dir}`, {error: readdirError})
  }
  return files
}

export const discoverProjectDirectories = (baseDir: string, requiredFile: string): string[] => {
  logger.info(`Scanning ${baseDir} for directories containing ${requiredFile}...`)
  const projectDirs: string[] = []
  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
    logger.error(`Base scan directory not found or is not a directory: ${baseDir}`)
    return []
  }
  try {
    const items = fs.readdirSync(baseDir)
    for (const item of items) {
      const itemPath = path.join(baseDir, item)
      try {
        const stat = fs.statSync(itemPath)
        if (stat.isDirectory()) {
          const requiredFilePath = path.join(itemPath, requiredFile)
          if (fs.existsSync(requiredFilePath) && fs.statSync(requiredFilePath).isFile()) {
            logger.info(`Found qualifying project directory: ${itemPath}`)
            projectDirs.push(itemPath)
          }
        }
      } catch (statError) {
        // Silently ignore stat errors
      }
    }
  } catch (readError) {
    logger.error(`Error reading base scan directory ${baseDir}`, {error: readError})
  }
  logger.info(`Found ${projectDirs.length} potential project directories.`)
  return projectDirs
}

// --- Initial Indexing Logic ---

// Simplified getLLMInfo placeholder for initial scan
const getLLMInfo = async (filePath: string): Promise<LLMInfo> => {
  await new Promise(resolve => setTimeout(resolve, 2)) // Minimal delay
  return {
    featureType: 'PlaceholderFeatureType',
    description: 'PlaceholderDescription',
  }
}

export const indexDirectoryFiles = async (rootDir: string): Promise<IndexedFileInfo[]> => {
  logger.info(`Scanning project directory: ${rootDir}...`)
  const ignoredFilesSet = new Set(getGitIgnoredFiles(rootDir))
  const tsFiles = getAllTsFilesRecursive(rootDir, ignoredFilesSet)
  logger.info(`Found ${tsFiles.length} TS/TSX files in ${path.basename(rootDir)}.`) // Uses imported logger

  const fileIndex: IndexedFileInfo[] = []
  const batchSize = 50
  for (let i = 0; i < tsFiles.length; i += batchSize) {
    const batch = tsFiles.slice(i, i + batchSize)
    const batchPromises = batch.map(async filePath => {
      try {
        const stat = fs.statSync(filePath)
        const llmInfo = await getLLMInfo(filePath)

        const fileData: IndexedFileInfo = {
          filePath,
          projectRootDir: rootDir,
          featureType: llmInfo.featureType,
          description: llmInfo.description,
          lastModified: stat.mtimeMs,
        }
        return fileData
      } catch (fileProcessingError) {
        logger.warn(`Could not process file ${filePath}`, {error: fileProcessingError})
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    fileIndex.push(...batchResults.filter((result): result is IndexedFileInfo => result !== null))
  }

  return fileIndex
}

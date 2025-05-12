import fs from 'fs'
import inquirer from 'inquirer'
import os from 'os'
import path from 'path'
import {logger} from './logger' // Import shared logger

import {type IndexedFileInfo, discoverProjectDirectories, indexDirectoryFiles} from './fileScanner'
import {processAndEnrichIndex} from './llmProcessor'

const logProcessedData = (processedData: IndexedFileInfo[]): void => {
  if (!processedData || processedData.length === 0) {
    logger.info('No processed data to log.')
    return
  }
  const filesByProject = new Map<string, IndexedFileInfo[]>()
  for (const fileInfo of processedData) {
    const projectFiles = filesByProject.get(fileInfo.projectRootDir) || []
    projectFiles.push(fileInfo)
    filesByProject.set(fileInfo.projectRootDir, projectFiles)
  }

  logger.info('--- Processed Files (Grouped by Project) ---')
  for (const [projectRoot, files] of filesByProject.entries()) {
    logger.info(`\nProject: ${projectRoot} (${files.length} files)`)
    files.forEach(file => {
      const descriptionSnippet = file.description
        ? `${file.description.substring(0, 50)}...`
        : 'N/A'
      logger.info(
        `  - ${path.relative(projectRoot, file.filePath)} (Type: ${file.featureType}, Desc: ${descriptionSnippet})`,
      )
    })
  }
  logger.info('--- End of Processed Files Log ---')
}

const promptUserForProjects = async (projects: string[]): Promise<string[]> => {
  if (projects.length === 0) {
    logger.info('No project directories found to select from.')
    return []
  }

  const choices = projects.map(p => ({name: `${path.basename(p)} (${p})`, value: p}))

  const answers = await inquirer.prompt<{
    selectedProjects: string[]
  }>([
    {
      type: 'checkbox',
      name: 'selectedProjects',
      message: 'Select the projects to index (use spacebar to select/deselect, enter to confirm):',
      choices: choices,
      pageSize: 15,
    },
  ])

  const {selectedProjects} = answers

  if (selectedProjects.length > 0) {
    logger.info('\nSelected projects to index:')
    selectedProjects.forEach(p => logger.info(`  - ${path.basename(p)} (${p})`))
  } else {
    logger.info('No projects selected.')
  }

  return selectedProjects
}

const main = async () => {
  try {
    const args = process.argv.slice(2)
    const outputFilePathArg = args[0]
    const baseScanDirectory = path.join(os.homedir(), 'Documents')
    const requiredRootFile = 'package.json'
    const defaultOutputFileName = 'combined_file_index.json'
    const outputFilePath = path.resolve(outputFilePathArg || defaultOutputFileName)

    logger.info(`Output File: ${outputFilePath}`)

    let processedData: IndexedFileInfo[] | null = null

    // Check if index needs to be created
    if (!fs.existsSync(outputFilePath)) {
      logger.info(`Index file not found at ${outputFilePath}. Starting creation process...`)

      const projectDirectories = discoverProjectDirectories(baseScanDirectory, requiredRootFile)
      if (projectDirectories.length === 0) {
        logger.info(`No projects found to index in ${baseScanDirectory}. Exiting.`)
        return
      }

      const selectedProjectDirs = await promptUserForProjects(projectDirectories)
      if (selectedProjectDirs.length === 0) {
        logger.info('No projects selected for indexing. Exiting.')
        return
      }

      logger.info(`Starting initial indexing for ${selectedProjectDirs.length} project(s)...`)
      let initialIndex: IndexedFileInfo[] = []
      for (const projectDir of selectedProjectDirs) {
        const projectIndex = await indexDirectoryFiles(projectDir)
        initialIndex = initialIndex.concat(projectIndex)
      }

      if (initialIndex.length > 0) {
        logger.info(`Writing initial index with placeholders to ${outputFilePath}...`)
        fs.writeFileSync(outputFilePath, JSON.stringify(initialIndex, null, 2))
        logger.info('Initial index generated successfully.')
      } else {
        logger.info('No files indexed. Index file not created. Exiting.')
        return // Exit if no files were indexed initially
      }
    }

    // Process and enrich the index file (either existing or newly created)
    try {
      logger.info(`Processing and enriching index file: ${outputFilePath}`)
      processedData = await processAndEnrichIndex(outputFilePath)
    } catch (enrichError) {
      logger.error(
        'Failed during the enrichment phase. Logging any partially processed data if available.',
        {enrichError},
      )
      // Optionally try to read the file again to log its last state
      try {
        const lastStateContent = fs.readFileSync(outputFilePath, 'utf-8')
        processedData = JSON.parse(lastStateContent) as IndexedFileInfo[]
      } catch (readError) {
        logger.error('Could not read index file after enrichment error.', {readError})
      }
    }

    // Log final results
    if (processedData) {
      logProcessedData(processedData)
    }
  } catch (error) {
    logger.error('An unexpected error occurred in main execution:', {error})
    process.exit(1)
  }
}

main()

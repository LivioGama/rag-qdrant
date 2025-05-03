'use client'

import {FormValues} from '@/models'
import isEmpty from 'lodash/isEmpty'
import {useCallback, useRef, useState} from 'react'
import {FileRejection, useDropzone} from 'react-dropzone'
import {SubmitHandler, useForm} from 'react-hook-form'

const CODE_ACCEPTED_TYPES = {
  'text/plain': ['.txt', '.log', '.conf'],
  'text/markdown': ['.md'],
  'application/javascript': ['.js'],
  'text/jsx': ['.jsx'],
  'text/typescript': ['.ts', '.tsx'],
  'application/json': ['.json'],
  'application/x-python-code': ['.py'],
  'text/x-java-source': ['.java'],
  'text/html': ['.html', '.htm'],
  'text/css': ['.css'],
  'application/x-sh': ['.sh'],
  'application/x-yaml': ['.yaml', '.yml'],
  'application/xml': ['.xml'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_FILES = 50

export const useUploadCode = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const {setValue, handleSubmit, watch} = useForm<FormValues>({
    defaultValues: {
      files: [],
    },
  })

  const selectedFiles = watch('files')

  const processAndIndexFile = async (file: File): Promise<{success: boolean; message: string}> => {
    try {
      const content = await file.text()
      const response = await fetch('/api/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({content, filename: file.name}),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || 'API request failed')
      }

      console.group('\x1b[36m📤 File Upload Process\x1b[0m')
      console.log(`\x1b[33m🔄 Processing ${file.name}\x1b[0m`)
      console.log(`\x1b[32m✓ API Response for ${file.name}:\x1b[0m`, result.message)
      console.groupEnd()
      return {success: true, message: result.message}
    } catch (error: any) {
      console.error(`Failed to process file ${file.name}:`, error)
      return {success: false, message: error.message || 'Unknown error'}
    }
  }

  const uploadAndProcessFiles = async (files: File[]) => {
    const results = {success: 0, failed: 0}
    const errors: string[] = []

    try {
      console.group('\x1b[36m📤 File Upload Process\x1b[0m')
      console.log(`\x1b[33m🔄 Processing ${files.length} files...\x1b[0m`)
      for (const file of files) {
        setUploadProgress(prev => ({...prev, [file.name]: 50}))

        const result = await processAndIndexFile(file)

        setUploadProgress(prev => ({...prev, [file.name]: result.success ? 100 : -1}))

        if (result.success) {
          results.success++
        } else {
          results.failed++
          errors.push(`${file.name}: ${result.message}`)
        }
      }

      console.log(`\x1b[34m📊 Processing complete:\x1b[0m
        \x1b[32m✓ Success: ${results.success}\x1b[0m
        \x1b[31m✗ Failed: ${results.failed}\x1b[0m`)
      if (results.failed > 0) {
        alert(`Some files failed to process:\n${errors.join('\n')}`)
        throw new Error(`${results.failed} file(s) failed to process.`)
      }

      console.log('\x1b[32m✓ Upload successful:\x1b[0m')
    } catch (error) {
      console.error('Upload process failed overall:', error)
      throw error
    } finally {
      setTimeout(() => setUploadProgress({}), 2000)
    }
  }

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (isEmpty(data.files)) return
    try {
      await uploadAndProcessFiles(data.files)
      setValue('files', [])
    } catch (error: any) {
      console.error('Submit failed:', error.message || error)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (!isEmpty(fileRejections)) {
        console.warn(
          'Files rejected:',
          fileRejections.map(rejection => ({
            file: rejection.file.name,
            errors: rejection.errors.map(error => error.message),
          })),
        )
      }

      if (!isEmpty(acceptedFiles)) {
        setValue('files', acceptedFiles)
        formRef.current?.requestSubmit()
      }
    },
    [setValue],
  )

  const {getRootProps, getInputProps, isDragActive, isFocused, isDragAccept, isDragReject} =
    useDropzone({
      onDrop,
      accept: CODE_ACCEPTED_TYPES,
      maxFiles: MAX_FILES,
      maxSize: MAX_FILE_SIZE,
      multiple: true,
    })

  return {
    formRef,
    handleSubmit,
    onSubmit,
    getRootProps,
    getInputProps,
    isDragActive,
    isFocused,
    isDragAccept,
    isDragReject,
    selectedFiles,
    uploadProgress,
    MAX_FILES,
  }
}

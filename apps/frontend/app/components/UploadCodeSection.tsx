'use client'

import {useUploadCode} from '@/hooks/useUploadCode'
import isEmpty from 'lodash/isEmpty'

const UploadCodeSection = () => {
  const {
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
  } = useUploadCode()

  const baseStyle =
    'flex flex-col items-center justify-center p-6 w-full border border-gray-200 dark:border-gray-700 rounded-md bg-white/50 dark:bg-gray-700/50'
  const activeStyle =
    'border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
  const acceptStyle =
    'border-2 border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
  const rejectStyle = 'border-2 border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
  const focusStyle = 'ring-2 ring-indigo-300 dark:ring-indigo-500'

  const style = `
    ${baseStyle}
    ${isFocused ? focusStyle : ''}
    ${isDragActive ? activeStyle : ''}
    ${isDragAccept ? acceptStyle : ''}
    ${isDragReject ? rejectStyle : ''}
  `

  return (
    <div className='w-1/4 h-full'>
      <div className='w-full h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-lg shadow-xl flex flex-col flex-1 gap-4'>
        <h2 className='text-xl font-bold text-center text-gray-800 dark:text-white'>Upload Code</h2>
        <p className='text-xs text-center text-gray-600 dark:text-gray-400'>
          Files will be vectorized and stored in Qdrant
        </p>
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col items-center gap-6 flex-1 h-full'>
          <div {...getRootProps({className: `${style} flex-1 transition-all duration-200`})}>
            <input {...getInputProps()} />
            <div className='relative z-10 flex items-center justify-center h-full'>
              {isDragActive ? (
                <p className='text-gray-600 dark:text-gray-300 font-medium'>
                  Drop your documents here ...
                </p>
              ) : !isEmpty(selectedFiles) ? (
                <div className='text-center'>
                  <p className='text-gray-800 dark:text-white font-medium mb-2'>
                    {selectedFiles.length} document{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <div className='max-h-24 overflow-y-auto'>
                    {selectedFiles.map(file => (
                      <div
                        key={file.name}
                        className='text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2'>
                        <span>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                        </span>
                        {uploadProgress[file.name] === 50 && (
                          <div className='flex items-center gap-1'>
                            <div className='animate-spin rounded-full h-3 w-3 border border-yellow-500 border-t-transparent' />
                            <span className='text-xs text-yellow-500 dark:text-yellow-400'>
                              Processing
                            </span>
                          </div>
                        )}
                        {uploadProgress[file.name] === 100 && (
                          <span className='text-xs text-green-500 dark:text-green-400'>Done</span>
                        )}
                        {uploadProgress[file.name] === -1 && (
                          <span className='text-xs text-red-500 dark:text-red-400'>Error</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='text-center'>
                  <p className='text-gray-600 dark:text-gray-300 font-medium mb-2'>
                    Drag 'n' drop your files here, or click to select
                  </p>
                  <p className='text-gray-500 dark:text-gray-400 text-xs mt-1'>
                    Max size: 50MB per file (up to {MAX_FILES} files)
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadCodeSection

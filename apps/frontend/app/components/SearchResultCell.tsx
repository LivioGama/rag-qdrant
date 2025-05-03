import {SearchResultCellProps} from '@/models'
import {getLanguageFromFilename} from '@/utils/fileHelper'
import isFinite from 'lodash/isFinite'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-xml-doc'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism-tomorrow.css'
import {useEffect} from 'react'

const SearchResultCell = ({result}: SearchResultCellProps) => {
  useEffect(() => {
    const codeElement = document.querySelector(`.result-cell-code[data-result-id="${result.id}"]`)
    if (!codeElement) return
    Prism.highlightElement(codeElement)
  }, [result.id])

  const file = result.payload
  const language = getLanguageFromFilename(file.filename)

  return (
    <div className='flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'>
      <div className='flex flex-col gap-4 min-w-[200px] max-w-[300px]'>
        <h3 className='font-medium text-gray-900 dark:text-white'>{file.description}</h3>

        <hr className='border-gray-300 dark:border-gray-600' />

        <h3 className='font-medium text-gray-900 dark:text-white'>
          {file.prettyFilename} ({file.filename})
        </h3>
        <div className='mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400'>
          {isFinite(result.score) && <p>Score: {(result.score * 100).toFixed(0)}%</p>}
          <p>Language: {language}</p>
        </div>
      </div>

      <div className='w-px bg-gray-300 dark:bg-gray-600' />

      <div className='flex-[2] min-w-0 max-h-[50vh] overflow-y-auto'>
        <style jsx>{`
          pre.result-cell-pre,
          pre.result-cell-pre > code.result-cell-code {
            white-space: pre-wrap !important;
            word-break: break-word !important;
          }
        `}</style>
        <pre
          className={`language-${language} result-cell-pre !m-0 whitespace-pre-wrap break-words rounded-md bg-gray-900/80 p-4`}>
          <code
            className={`language-${language} result-cell-code whitespace-pre-wrap break-words`}
            data-result-id={result.id}>
            {file.fullContent}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default SearchResultCell

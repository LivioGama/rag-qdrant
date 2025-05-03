'use client'

import SearchResultCell from '@/app/components/SearchResultCell'
import {useSearchCode} from '@/hooks/useSearchCode'
import isEmpty from 'lodash/isEmpty'
import {useEffect, useState} from 'react'

const SearchCodeSection = () => {
  const {registerSearch, isSearching, searchResults, debouncedQuery, clearSearch} = useSearchCode()
  const [visibleResults, setVisibleResults] = useState<any[]>([])

  useEffect(() => {
    if (!isSearching) {
      setVisibleResults(searchResults)
    }
  }, [searchResults, isSearching])

  return (
    <div className='flex-1 h-full'>
      <div className='w-full h-full gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-lg shadow-xl flex flex-col'>
        <h2 className='text-xl font-bold text-gray-800 dark:text-white'>Search Code</h2>
        <p className='text-xs text-gray-600 dark:text-gray-400'>
          Search uses vector similarity to find semantically related code snippets
        </p>
        <form className='relative'>
          {isSearching && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 z-10'>
              <div className='animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent' />
            </div>
          )}
          <input
            type='text'
            {...registerSearch('query')}
            className={`w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
              isSearching ? 'pl-10' : ''
            } ${!isEmpty(debouncedQuery) ? 'pr-10' : ''}`}
            placeholder='Search in code...'
          />
          {!isEmpty(debouncedQuery) && (
            <button
              type='button'
              onClick={clearSearch}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'>
              <svg
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </form>

        <div className='flex-1 overflow-y-auto flex flex-col gap-4'>
          {visibleResults.map((result: any) => (
            <div
              key={result.id}
              className={`transition-all duration-300 ease-in-out ${
                isSearching ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
              }`}>
              <SearchResultCell result={result} />
            </div>
          ))}
          {isEmpty(visibleResults) && !isSearching && (
            <p className='text-center text-gray-500 dark:text-gray-400'>
              {isEmpty(debouncedQuery) ? 'No documents found.' : 'No results found for your query.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchCodeSection

'use client'

import {SearchFormValues} from '@/models'
import {useQuery} from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import isEmpty from 'lodash/isEmpty'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useForm} from 'react-hook-form'

export const useSearchCode = () => {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [cachedResults, setCachedResults] = useState<any[]>([])
  const {
    register: registerSearch,
    watch: watchSearch,
    setValue,
  } = useForm<SearchFormValues>({
    defaultValues: {
      query: '',
    },
  })

  const searchQuery = watchSearch('query')

  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value)
      }, 1000),
    [],
  )

  useEffect(() => {
    if (searchQuery === undefined) return

    if (isEmpty(searchQuery)) {
      setDebouncedQuery('')
      return
    }

    debouncedSetQuery(searchQuery)
    return () => debouncedSetQuery.cancel()
  }, [searchQuery, debouncedSetQuery])

  const {data: searchResults, isFetching: isSearching} = useQuery({
    queryKey: ['search', debouncedQuery || 'all'],
    queryFn: async () => {
      if (isEmpty(debouncedQuery) && !isEmpty(cachedResults)) {
        return cachedResults
      }

      const endpoint = isEmpty(debouncedQuery) ? '/api/search?all=true' : '/api/search'
      const method = isEmpty(debouncedQuery) ? 'GET' : 'POST'
      const headers = {'Content-Type': 'application/json'}
      const body = isEmpty(debouncedQuery) ? undefined : JSON.stringify({query: debouncedQuery})

      const response = await fetch(endpoint, {
        method,
        headers: !isEmpty(debouncedQuery) ? headers : undefined,
        body,
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const results = await response.json()

      if (isEmpty(debouncedQuery)) {
        setCachedResults(results)
      }

      return results
    },
    enabled: true,
  })

  const currentResults = useMemo(
    () => (isEmpty(searchQuery) && !isEmpty(cachedResults) ? cachedResults : searchResults || []),
    [searchQuery, cachedResults, searchResults],
  )

  const clearSearch = useCallback(() => {
    setValue('query', '')
    setDebouncedQuery('')
  }, [setValue])

  return {
    registerSearch,
    isSearching: isEmpty(searchQuery) ? false : isSearching,
    searchResults: currentResults,
    debouncedQuery,
    clearSearch,
  }
}

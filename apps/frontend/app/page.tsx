'use client'

import SearchCodeSection from '@/app/components/SearchCodeSection'
import UploadCodeSection from '@/app/components/UploadCodeSection'

const HomePage = () => (
  <div className='flex flex-col h-screen p-5 bg-gray-50 dark:bg-gray-900'>
    <h1 className='text-3xl font-bold text-center mb-5 text-gray-800 dark:text-white'>
      RAG Qdrant Playground
    </h1>
    <main className='flex flex-row gap-5 flex-1 overflow-hidden'>
      <UploadCodeSection />
      <SearchCodeSection />
    </main>
  </div>
)

export default HomePage

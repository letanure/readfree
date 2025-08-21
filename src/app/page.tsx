'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const ACTIVATION_CODE = '389e729290' // Change this to your secret code

function HomeContent() {
  const [url, setUrl] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for activation code in URL
    const activateCode = searchParams.get('activate')
    
    if (activateCode === ACTIVATION_CODE) {
      // Set cookie for 30 days
      document.cookie = `readfree_auth=true; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Strict`
      setIsAuthenticated(true)
      // Clean URL
      router.replace('/')
      return
    }

    // Check for existing auth cookie
    const hasAuthCookie = document.cookie
      .split('; ')
      .some(cookie => cookie.startsWith('readfree_auth=true'))
    
    setIsAuthenticated(hasAuthCookie)
  }, [searchParams, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url) {
      router.push(`/${encodeURIComponent(url)}`)
    }
  }

  // Show fake 404 if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-2">Page not found</p>
          <p className="text-gray-500">The page you are looking for doesn't exist.</p>
        </div>
      </main>
    )
  }

  // Show normal app if authenticated
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-center mb-2">ReadFree</h1>
        <p className="text-center text-gray-600 mb-8">
          Paste an article URL to read without distractions
        </p>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Read
          </button>
        </form>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
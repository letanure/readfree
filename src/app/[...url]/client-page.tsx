'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientArticlePage({ url }: { url: string }) {
  // Check auth on client side too
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [article, setArticle] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputUrl, setInputUrl] = useState('')
  const [navigationMode, setNavigationMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('navigationMode') === 'true'
    }
    return false
  })
  const router = useRouter()

  useEffect(() => {
    // Check for auth cookie
    const hasAuthCookie = document.cookie
      .split('; ')
      .some(cookie => cookie.startsWith('readfree_auth=true'))
    
    setIsAuthorized(hasAuthCookie)
  }, [])

  useEffect(() => {
    async function fetchArticle() {
      try {
        console.log('🔍 Client: Fetching article for:', url)
        
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        console.log('📊 Client: Response status:', response.status)
        const data = await response.json()
        
        if (!response.ok) {
          console.error('❌ Client: API Error:', data)
          setError(data.details || data.error)
        } else {
          console.log('✅ Client: Success, content length:', data.content?.length)
          setArticle(data)
        }
      } catch (err) {
        console.error('❌ Client: Fetch error:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthorized) {
      fetchArticle()
    } else {
      setLoading(false)
    }
  }, [url, isAuthorized])

  // Show fake 404 if not authorized
  if (!isAuthorized) {
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading...</div>
          <div className="text-gray-600">Fetching article content</div>
        </div>
      </main>
    )
  }

  if (error || !article) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to fetch article</h1>
          <p className="text-gray-600 mb-4">URL: {url}</p>
          {error && (
            <div className="bg-red-50 p-4 rounded mb-4">
              <p className="text-red-800 text-sm font-mono">{error}</p>
            </div>
          )}
          <a href="/" className="text-blue-500 hover:underline">
            Try another URL
          </a>
        </div>
      </main>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl) {
      window.location.href = `/${encodeURIComponent(inputUrl)}`
    }
  }

  const toggleNavigationMode = () => {
    const newMode = !navigationMode
    setNavigationMode(newMode)
    localStorage.setItem('navigationMode', String(newMode))
  }

  const getEnhancedContent = () => {
    if (!article?.content || !navigationMode) {
      return article?.content || ''
    }

    // Inject navigation interceptor script
    const interceptorScript = `
      <script>
        (function() {
          console.log('🔗 ReadFree Navigation Mode Active');
          
          // Function to check if URL is external
          function isExternalUrl(url) {
            try {
              const urlObj = new URL(url, window.location.href);
              return urlObj.hostname !== window.location.hostname;
            } catch {
              return false;
            }
          }
          
          // Intercept all clicks
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link || !link.href) return;
            
            let targetUrl = link.href;
            
            // Handle relative URLs
            try {
              // If href is relative, make it absolute using current document location
              if (!targetUrl.startsWith('http')) {
                const baseUrl = document.location.origin;
                targetUrl = new URL(targetUrl, baseUrl).href;
              }
            } catch (err) {
              console.log('Invalid URL:', targetUrl, err);
              return;
            }
            
            // Check if it's a real navigation link (not # or javascript:)
            if (targetUrl.startsWith('javascript:') || 
                targetUrl === '#' || 
                targetUrl.startsWith('mailto:') ||
                targetUrl.startsWith('tel:')) {
              return;
            }
            
            // Prevent default and redirect through ReadFree
            e.preventDefault();
            e.stopPropagation();
            
            // Navigate through ReadFree
            const encodedUrl = encodeURIComponent(targetUrl);
            window.top.location.href = '/' + encodedUrl;
            
            console.log('🚀 Redirecting through ReadFree:', targetUrl);
          }, true);
          
          // Also rewrite all existing links on hover for visual feedback
          document.addEventListener('mouseover', function(e) {
            const link = e.target.closest('a');
            if (!link || !link.href) return;
            
            // Add visual indicator
            if (!link.dataset.readfreeProcessed) {
              link.dataset.readfreeProcessed = 'true';
              link.style.cursor = 'pointer';
              link.title = 'ReadFree: ' + link.href;
            }
          });
          
          // Add visual indicator that navigation mode is active
          const indicator = document.createElement('div');
          indicator.innerHTML = '🔗 Navigation Mode';
          indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(59,130,246,0.9);color:white;padding:5px 10px;border-radius:5px;z-index:9999;font-size:12px;font-family:sans-serif;';
          document.body.appendChild(indicator);
        })();
      </script>
    `;

    // Insert script at the end of body
    if (article.content.includes('</body>')) {
      return article.content.replace('</body>', interceptorScript + '</body>');
    } else {
      // If no body tag, append at the end
      return article.content + interceptorScript;
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full">
        <div className="bg-gray-100 p-4 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2">
              <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Enter another URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Go
                </button>
              </form>
              <button
                onClick={toggleNavigationMode}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  navigationMode 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={navigationMode ? 'Navigation mode is ON - Links will open through ReadFree' : 'Navigation mode is OFF - Links will open normally'}
              >
                🔗 {navigationMode ? 'ON' : 'OFF'}
              </button>
              <a href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center">
                Home
              </a>
            </div>
          </div>
        </div>
        
        <iframe 
          srcDoc={getEnhancedContent()}
          className={`w-full h-[calc(100vh-64px)] ${navigationMode ? 'border-2 border-blue-500' : ''}`}
          sandbox="allow-same-origin allow-scripts allow-top-navigation"
          title="Article content"
        />
      </div>
    </main>
  )
}
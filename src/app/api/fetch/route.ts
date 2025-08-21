import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Check for auth cookie
  const authCookie = request.cookies.get('readfree_auth')
  if (!authCookie || authCookie.value !== 'true') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }

  try {
    const { url } = await request.json()
    
    console.log('📍 Fetching URL:', url)
    
    if (!url || !url.startsWith('http')) {
      console.error('❌ Invalid URL:', url)
      return NextResponse.json(
        { error: 'Invalid URL', details: `URL must start with http/https: ${url}` },
        { status: 400 }
      )
    }

    // Try different methods
    let response;
    let method = '';
    
    // Method 1: Twitter referrer (works for many news sites)
    console.log('🐦 Trying Twitter referrer...')
    method = 'Twitter'
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://t.co/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })
    
    console.log(`📊 ${method} response:`, response.status)
    
    // If Twitter fails, try Google
    if (!response.ok) {
      console.log('🔍 Trying Google referrer...')
      method = 'Google'
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })
      console.log(`📊 ${method} response:`, response.status)
    }
    
    // If Google fails, try Facebook
    if (!response.ok) {
      console.log('👤 Trying Facebook referrer...')
      method = 'Facebook'
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.facebook.com/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })
      console.log(`📊 ${method} response:`, response.status)
    }
    
    // Last resort: Googlebot
    if (!response.ok) {
      console.log('🤖 Trying Googlebot user-agent...')
      method = 'Googlebot'
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })
      console.log(`📊 ${method} response:`, response.status)
    }

    if (!response.ok) {
      throw new Error(`All methods failed! Last status: ${response.status}, statusText: ${response.statusText}`)
    }
    
    console.log(`✅ Success with ${method} method!`)

    const html = await response.text()
    console.log('✅ HTML fetched, length:', html.length)
    
    return NextResponse.json({ 
      content: html,
      url: url,
      status: response.status
    })
    
  } catch (error) {
    console.error('❌ Fetch error:', error)
    console.error('Stack:', (error as Error).stack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch article',
        details: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    )
  }
}
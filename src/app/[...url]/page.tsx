import { notFound } from 'next/navigation'
import ClientArticlePage from './client-page'

export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ url: string[] }>
}) {
  const resolvedParams = await params
  const fullUrl = decodeURIComponent(resolvedParams.url.join('/'))
  
  if (!fullUrl.startsWith('http')) {
    notFound()
  }
  
  return <ClientArticlePage url={fullUrl} />
}
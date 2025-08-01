import { notFound } from 'next/navigation'

async function getPage(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/pages/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch page')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export default async function PagePage({ params }: { params: { id: string } }) {
  const page = await getPage(params.id)
  
  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
          {page.excerpt && (
            <p className="text-xl text-gray-700 mb-6">{page.excerpt}</p>
          )}
        </header>
        
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        </div>
      </article>
    </div>
  )
} 
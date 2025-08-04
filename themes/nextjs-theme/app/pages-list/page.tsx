import Link from 'next/link'

async function getPages() {
  try {
    const response = await fetch('http://localhost:3000/api/pages?status=publish&per_page=50', {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch pages')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching pages:', error)
    return null
  }
}

export default async function PagesListPage() {
  const content = await getPages()
  
  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Pages</h1>
        <p className="text-muted-foreground">No pages found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 content-fade-in">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Pages</h1>
      
      <div className="grid gap-6">
        {content.pages?.map((page: any) => (
          <article key={page.id} className="border border-border rounded-lg p-6 shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
            <h2 className="text-2xl font-semibold mb-2 text-foreground hover:text-wp-blue transition-colors">
              <Link href={`/pages/${page.id}`}>
                {page.title}
              </Link>
            </h2>
            <div className="text-muted-foreground mb-4 text-sm">
              {new Date(page.createdAt).toLocaleDateString()}
            </div>
            <div className="prose max-w-none">
              {page.excerpt && (
                <p className="text-muted-foreground leading-relaxed">{page.excerpt}</p>
              )}
            </div>
            <Link 
              href={`/pages/${page.id}`}
              className="inline-block mt-4 text-wp-blue hover:text-wp-blue-dark transition-colors font-medium"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
} 
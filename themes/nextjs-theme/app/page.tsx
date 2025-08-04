import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getHomeContent() {
  try {
    const [postsResponse, pagesResponse] = await Promise.all([
      fetch('http://localhost:3000/api/posts?status=publish&type=post&limit=5', {
        cache: 'no-store'
      }),
      fetch('http://localhost:3000/api/pages?status=publish&limit=5', {
        cache: 'no-store'
      })
    ])
    
    if (!postsResponse.ok || !pagesResponse.ok) {
      throw new Error('Failed to fetch content')
    }
    
    const posts = await postsResponse.json()
    const pages = await pagesResponse.json()
    
    return { posts, pages }
  } catch (error) {
    console.error('Error fetching home content:', error)
    return null
  }
}

export default async function HomePage() {
  const content = await getHomeContent()
  
  if (!content) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 content-fade-in">
      <h1 className="text-4xl font-bold mb-8 text-wp-blue">Welcome to NextPress</h1>
      
      {/* Recent Posts Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Recent Posts</h2>
          <Link href="/blog" className="text-wp-blue hover:text-wp-blue-dark transition-colors">
            View all posts →
          </Link>
        </div>
        
        <div className="grid gap-6">
          {content.posts.posts?.map((post: any) => (
            <article key={post.id} className="border border-border rounded-lg p-6 shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold mb-2 text-foreground hover:text-wp-blue transition-colors">
                <Link href={`/posts/${post.id}`}>
                  {post.title}
                </Link>
              </h3>
              <div className="text-muted-foreground mb-4 text-sm">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
              <div className="prose max-w-none">
                {post.excerpt && (
                  <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
                )}
              </div>
              <Link 
                href={`/posts/${post.id}`}
                className="inline-block mt-4 text-wp-blue hover:text-wp-blue-dark transition-colors font-medium"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Pages Section */}
      {content.pages.pages && content.pages.pages.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Pages</h2>
            <Link href="/pages-list" className="text-wp-blue hover:text-wp-blue-dark transition-colors">
              View all pages →
            </Link>
          </div>
          
          <div className="grid gap-6">
            {content.pages.pages.map((page: any) => (
              <article key={page.id} className="border border-border rounded-lg p-6 shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold mb-2 text-foreground hover:text-wp-blue transition-colors">
                  <Link href={`/pages/${page.id}`}>
                    {page.title}
                  </Link>
                </h3>
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
        </section>
      )}
    </div>
  )
} 
import { notFound } from 'next/navigation'

async function getPost(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch post')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)
  
  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 content-fade-in">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{post.title}</h1>
          <div className="text-muted-foreground mb-4 text-sm">
            Published on {new Date(post.createdAt).toLocaleDateString()}
          </div>
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
          )}
        </header>
        
        <div className="prose max-w-none bg-card border border-border rounded-lg p-8 shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </div>
      </article>
    </div>
  )
} 
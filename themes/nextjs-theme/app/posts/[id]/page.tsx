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
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="text-gray-600 mb-4">
            Published on {new Date(post.createdAt).toLocaleDateString()}
          </div>
          {post.excerpt && (
            <p className="text-xl text-gray-700 mb-6">{post.excerpt}</p>
          )}
        </header>
        
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </div>
      </article>
    </div>
  )
} 
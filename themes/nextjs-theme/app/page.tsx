import { notFound } from 'next/navigation'

async function getHomeContent() {
  try {
    const response = await fetch('http://localhost:3000/api/posts?status=publish&limit=10', {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch content')
    }
    
    return await response.json()
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to NextPress</h1>
      
      <div className="grid gap-6">
        {content.posts?.map((post: any) => (
          <article key={post.id} className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
            <div className="text-gray-600 mb-4">
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
            <div className="prose max-w-none">
              {post.excerpt && (
                <p className="text-gray-700">{post.excerpt}</p>
              )}
            </div>
            <a 
              href={`/posts/${post.id}`}
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              Read more →
            </a>
          </article>
        ))}
      </div>
    </div>
  )
} 
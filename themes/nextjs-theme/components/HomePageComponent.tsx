import Header from './Header'
import Footer from './Footer'
import { formatDate, truncateText } from '@/lib/utils'

interface Post {
  id: number
  title: string
  content: string
  excerpt?: string
  slug: string
  created_at: string
  author?: {
    username: string
  }
}

interface HomePageProps {
  posts?: Post[]
  site?: {
    name: string
    description: string
  }
}

export default function HomePageComponent({ posts = [], site }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        siteName={site?.name} 
        siteDescription={site?.description} 
      />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to {site?.name || 'NextPress'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {site?.description || 'A modern WordPress alternative built with Next.js'}
            </p>
          </div>

          {posts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <a href={`/posts/${post.slug}`} className="hover:text-wp-blue transition-colors">
                          {post.title}
                        </a>
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {truncateText(post.excerpt || post.content)}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(post.created_at)}</span>
                        {post.author && (
                          <span>By {post.author.username}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
} 
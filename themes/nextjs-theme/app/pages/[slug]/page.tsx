import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { formatDate, parseContent } from '@/lib/utils'

interface Page {
  id: number
  title: string
  content: string
  slug: string
  created_at: string
  author?: {
    username: string
  }
  meta?: {
    [key: string]: any
  }
}

interface PageProps {
  page?: Page
  site?: {
    name: string
    description: string
  }
}

export default function PageTemplate({ page, site }: PageProps) {
  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header siteName={site?.name} siteDescription={site?.description} />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName={site?.name} siteDescription={site?.description} />
      
      <main className="flex-grow">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime={page.created_at}>
                Last updated: {formatDate(page.created_at)}
              </time>
              {page.author && (
                <>
                  <span className="mx-2">•</span>
                  <span>By {page.author.username}</span>
                </>
              )}
            </div>
          </header>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: parseContent(page.content) 
            }}
          />

          {page.meta && Object.keys(page.meta).length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Meta</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(page.meta).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  )
} 
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import BlockRenderer from "@/components/PageBuilder/BlockRenderer";
import type { Post, BlockConfig } from "@shared/schema";

interface PublicPageViewProps {
  slug?: string;
  type?: 'page' | 'post' | 'homepage';
}

export default function PublicPageView({ slug: propSlug, type = 'page' }: PublicPageViewProps) {
  const { slug: routeSlug } = useParams();
  const slug = propSlug || routeSlug;
  
  // Determine the API endpoint based on type
  const getApiEndpoint = () => {
    if (type === 'homepage') {
      return '/api/public/homepage';
    }
    return `/api/public/${type}/${slug}`;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [getApiEndpoint()],
    queryFn: async () => {
      const response = await fetch(getApiEndpoint());
      if (!response.ok) {
        throw new Error('Content not found');
      }
      return response.json() as Promise<Post>;
    },
    enabled: !!(slug || type === 'homepage'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3 mt-8">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-xl text-gray-600 mb-8">
              {type === 'homepage' ? 'No homepage content found' : `${type.charAt(0).toUpperCase() + type.slice(1)} not found`}
            </h2>
            <p className="text-gray-500 mb-8">
              {type === 'homepage' 
                ? 'No published page has been set as the homepage.' 
                : `The ${type} you're looking for doesn't exist or hasn't been published yet.`
              }
            </p>
            <a 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="link-home"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  const blocks: BlockConfig[] = (data.builderData as BlockConfig[]) || [];
  const publishDate = data.publishedAt ? new Date(data.publishedAt) : new Date();

  // SEO meta information
  const metaTitle = `${data.title} | Your Site`;
  const metaDescription = data.excerpt || `Read ${data.title} on our website.`;
  const canonicalUrl = `${window.location.origin}/${data.type}/${data.slug}`;

  return (
    <div className="min-h-screen bg-white" data-testid={`public-${type}-view`}>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content={type === 'post' ? 'article' : 'website'} />
        <meta property="og:url" content={canonicalUrl} />
        {data.featuredImage && (
          <meta property="og:image" content={data.featuredImage} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={metaDescription} />
        {data.featuredImage && (
          <meta name="twitter:image" content={data.featuredImage} />
        )}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Article specific meta for posts */}
        {type === 'post' && (
          <>
            <meta property="article:published_time" content={publishDate.toISOString()} />
            <meta property="article:modified_time" content={data.updatedAt || publishDate.toISOString()} />
          </>
        )}
      </Helmet>

      {/* Page content */}
      <div className="w-full">
        {/* Handle pages with traditional content (non-page builder) */}
        {!data.usePageBuilder && data.content ? (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <article className="prose prose-lg max-w-none">
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
                  {data.title}
                </h1>
                {type === 'post' && (
                  <div className="text-sm text-gray-500 mb-4" data-testid="post-meta">
                    Published on {publishDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </div>
                )}
                {data.excerpt && (
                  <p className="text-xl text-gray-600 font-light" data-testid="page-excerpt">
                    {data.excerpt}
                  </p>
                )}
              </header>
              <div 
                dangerouslySetInnerHTML={{ __html: data.content }}
                data-testid="page-content"
              />
            </article>
          </div>
        ) : (
          /* Page Builder content */
          <>
            {blocks.length === 0 ? (
              <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
                    {data.title}
                  </h1>
                  <p className="text-gray-600" data-testid="empty-content">
                    This {type} doesn't have any content yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full" data-testid="page-builder-content">
                {blocks.map((block) => (
                  <div key={block.id} className="block-container">
                    <BlockRenderer
                      block={block}
                      isSelected={false}
                      isPreview={true}
                      onDuplicate={() => {}}
                      onDelete={() => {}}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post footer for blog posts */}
      {type === 'post' && (
        <footer className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Published on {publishDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
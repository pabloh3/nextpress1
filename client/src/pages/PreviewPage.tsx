import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import type { Post, Template, BlockConfig } from "@shared/schema";
import BlockRenderer from "@/components/PageBuilder/BlockRenderer";

interface PreviewPageProps {
  postId?: string;
  templateId?: string;
  type?: 'post' | 'page' | 'template';
}

export default function PreviewPage({ postId, templateId, type }: PreviewPageProps) {
  const params = useParams();
  
  // Get ID from props or URL params
  const contentId = postId || templateId || params.id;
  const contentType = type || params.type || (templateId ? 'template' : 'post');
  
  // Fetch post or template data using preview endpoints
  const { data, isLoading, error } = useQuery({
    queryKey: contentType === 'template' 
      ? [`/api/preview/template/${contentId}`] 
      : [`/api/preview/${contentType}/${contentId}`],
    enabled: !!contentId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Preview Not Available</h1>
          <p className="text-gray-600">
            {error 
              ? 'Failed to load content for preview.' 
              : 'The requested content could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  // Extract blocks from data
  let blocks: BlockConfig[] = [];
  let title = '';
  
  if (contentType === 'template') {
    const template = data as Template;
    blocks = (template.blocks as BlockConfig[]) || [];
    title = template.name;
  } else {
    const post = data as Post;
    blocks = (post.builderData as BlockConfig[]) || [];
    title = post.title;
    
    // If post doesn't use page builder, show traditional content
    if (!post.usePageBuilder && post.content) {
      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <article className="prose prose-lg max-w-none">
              <h1>{post.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
          </div>
        </div>
      );
    }
  }

  // Render page builder content
  return (
    <div className="min-h-screen bg-white">
      {/* SEO meta tags would go here */}
      <title>{title}</title>
      
      {/* Page content */}
      <div className="w-full">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Empty Page</h2>
              <p className="text-gray-600">This {contentType} doesn't have any content yet.</p>
            </div>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="block-container">
              <BlockRenderer
                block={block}
                isSelected={false}
                isPreview={true}
                onDuplicate={() => {}}
                onDelete={() => {}}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, Globe, ExternalLink, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Post, BlockConfig } from "@shared/schema";

interface PublishDialogProps {
  post?: Post;
  blocks: BlockConfig[];
  onPublished?: (updatedData: Post) => void;
  disabled?: boolean;
}

export default function PublishDialog({ post, blocks, onPublished, disabled }: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(post?.slug || "");
  const [originalSlug, setOriginalSlug] = useState(post?.slug || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update slug when post changes
  useEffect(() => {
    if (post?.slug) {
      setSlug(post.slug);
      setOriginalSlug(post.slug);
    }
  }, [post?.slug]);

  // Generate slug from title if empty
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!post) throw new Error("No post data");
      
      const publishData = {
        builderData: blocks,
        usePageBuilder: true,
        status: 'publish',
        publishedAt: new Date(),
        slug: slug || generateSlug(post.title)
      };

      const response = await apiRequest('PUT', `/api/posts/${post.id}`, publishData);
      return await response.json();
    },
    onSuccess: (updatedData) => {
      toast({
        title: "Published!",
        description: `Page is now live at /${updatedData.type}/${updatedData.slug}`,
      });
      setOpen(false);
      onPublished?.(updatedData);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Publishing failed",
        description: error.message || "Failed to publish page",
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    // Validate slug
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      toast({
        title: "Invalid slug",
        description: "Slug can only contain lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }
    
    publishMutation.mutate();
  };

  const isPublished = post?.status === 'publish';
  const hasSlugChanged = slug !== originalSlug;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={isPublished ? "outline" : "default"}
          disabled={disabled || !post}
          className="flex items-center gap-2"
          data-testid="button-publish"
        >
          {isPublished ? (
            <>
              <Globe className="w-4 h-4" />
              Published
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Publish
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md" data-testid="dialog-publish">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {isPublished ? 'Update Published Page' : 'Publish Page'}
          </DialogTitle>
          <DialogDescription>
            {isPublished 
              ? 'Update your published page with the latest changes.'
              : 'Make your page publicly available with a custom URL.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPublished && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Globe className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Currently Published</p>
                <p className="text-xs text-green-600">
                  Live at: /{post?.type}/{post?.slug}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = `/${post?.type}/${post?.slug}`;
                  window.open(url, '_blank');
                }}
                className="h-auto p-1 text-green-600"
                data-testid="button-view-published"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="slug">Page URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">/{post?.type}/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={post ? generateSlug(post.title) : "page-slug"}
                className="flex-1"
                data-testid="input-slug"
              />
            </div>
            <p className="text-xs text-gray-500">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          {hasSlugChanged && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Changing the URL will break existing links to this page.
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Page Status</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {post?.title || 'Untitled Page'}
              </span>
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Blocks</span>
              <Badge variant="outline">
                {blocks.length}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" data-testid="button-cancel-publish">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            data-testid="button-confirm-publish"
          >
            {publishMutation.isPending ? 'Publishing...' : isPublished ? 'Update' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
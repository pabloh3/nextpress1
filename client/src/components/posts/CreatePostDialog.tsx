import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Blog } from "@shared/schema-types";

// API response shape for blogs list
interface BlogsResponse {
  blogs: Blog[];
  total: number;
}

type DialogStep = "select-blog" | "create-blog";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-step dialog for creating a new post:
 * Step 1 — Select an existing blog or switch to "create blog" mode
 * Step 2 — (inline) Create a new blog, then return to step 1
 *
 * Once a blog is selected and a title is entered, the dialog creates
 * the post via POST /api/posts and navigates to the page builder.
 */
export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Dialog state
  const [step, setStep] = useState<DialogStep>("select-blog");
  const [selectedBlogId, setSelectedBlogId] = useState<string>("");
  const [postTitle, setPostTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Create-blog sub-form
  const [newBlogName, setNewBlogName] = useState("");
  const [newBlogDescription, setNewBlogDescription] = useState("");
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);

  // Fetch existing blogs
  const { data: blogsData, isLoading: blogsLoading, refetch: refetchBlogs } = useQuery<BlogsResponse>({
    queryKey: ["/api/blogs", { status: "any" }],
    enabled: open,
  });

  const blogs = blogsData?.blogs ?? [];

  /** Reset all dialog state */
  const resetState = () => {
    setStep("select-blog");
    setSelectedBlogId("");
    setPostTitle("");
    setNewBlogName("");
    setNewBlogDescription("");
    setIsCreating(false);
    setIsCreatingBlog(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  /** Create a new blog, then auto-select it */
  const handleCreateBlog = async () => {
    if (!newBlogName.trim()) return;

    setIsCreatingBlog(true);
    try {
      const response = await apiRequest("POST", "/api/blogs", {
        name: newBlogName.trim(),
        description: newBlogDescription.trim() || undefined,
        status: "publish",
      });
      const blog = await response.json();

      toast({ title: "Blog created", description: `"${blog.name}" is ready` });

      // Refresh the blogs list and auto-select the new blog
      await refetchBlogs();
      setSelectedBlogId(blog.id);
      setNewBlogName("");
      setNewBlogDescription("");
      setStep("select-blog");
    } catch (err) {
      console.error("Error creating blog:", err);
      toast({
        title: "Error",
        description: "Failed to create blog",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBlog(false);
    }
  };

  /** Create the post via API and navigate to page builder */
  const handleCreatePost = async () => {
    if (!postTitle.trim() || !selectedBlogId) return;

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/posts", {
        title: postTitle.trim(),
        blogId: selectedBlogId,
        status: "draft",
        blocks: [],
      });
      const post = await response.json();

      toast({ title: "Post created", description: "Opening editor..." });
      handleClose(false);
      setLocation(`/page-builder/post/${post.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "create-blog" && newBlogName.trim()) {
        handleCreateBlog();
      } else if (step === "select-blog" && postTitle.trim() && selectedBlogId) {
        handleCreatePost();
      }
    }
  };

  // ── Create Blog sub-form ──────────────────────────────────────────────
  if (step === "create-blog") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a Blog</DialogTitle>
            <DialogDescription>
              Give your blog a name. You can add more details later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="blog-name">Blog Name</Label>
              <Input
                id="blog-name"
                placeholder="e.g. Engineering Blog"
                value={newBlogName}
                onChange={(e) => setNewBlogName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-desc">Description (optional)</Label>
              <Input
                id="blog-desc"
                placeholder="What is this blog about?"
                value={newBlogDescription}
                onChange={(e) => setNewBlogDescription(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("select-blog")}>
              Back
            </Button>
            <Button
              onClick={handleCreateBlog}
              disabled={!newBlogName.trim() || isCreatingBlog}
            >
              {isCreatingBlog && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Blog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main form: select blog + post title ───────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
          <DialogDescription>
            Select a blog and enter a title for your new post.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Blog selector */}
          <div className="grid gap-2">
            <Label htmlFor="blog-select">Blog</Label>
            {blogsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading blogs...
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">
                No blogs yet.{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setStep("create-blog")}
                >
                  Create your first blog
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={selectedBlogId} onValueChange={setSelectedBlogId}>
                  <SelectTrigger id="blog-select" className="flex-1">
                    <SelectValue placeholder="Choose a blog..." />
                  </SelectTrigger>
                  <SelectContent>
                    {blogs.map((blog) => (
                      <SelectItem key={blog.id} value={blog.id}>
                        {blog.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStep("create-blog")}
                  title="Create new blog"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Post title */}
          <div className="grid gap-2">
            <Label htmlFor="post-title">Post Title</Label>
            <Input
              id="post-title"
              placeholder="Enter post title..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus={blogs.length > 0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            disabled={!postTitle.trim() || !selectedBlogId || isCreating}
          >
            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

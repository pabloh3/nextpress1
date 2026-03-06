import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, Save, FileText } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import PageBuilder from "@/components/PageBuilder/PageBuilder";
import PublishDialog from "@/components/PageBuilder/PublishDialog";
import { useToast } from "@/hooks/use-toast";
import type { BlockConfig, Page, Post } from "@shared/schema-types";
import { storeSlugToIdMapping, getPageIdFromSlug } from "@/lib/editorStorage";
import {
  clearPageDraft,
  loadPageDraft,
  savePageDraft,
  savePageDraftWithHistory,
} from "@/lib/pageDraftStorage";
import {
  clearPostDraft,
  loadPostDraft,
  savePostDraft,
} from "@/lib/postDraftStorage";

/** Unified editor type — supports both pages and posts */
type EditorContentType = "page" | "post";

/**
 * Common shape used internally so PageBuilder receives a consistent interface.
 * Posts are adapted to this shape (missing page-only fields get safe defaults).
 */
type EditorData = Page;

interface PageBuilderEditorProps {
  postId?: string;
  isSlug?: boolean;
  /** Whether we are editing a page or a post. Defaults to 'page'. */
  type?: EditorContentType;
}

/**
 * Adapts a Post object to the Page shape expected by PageBuilder.
 * Adds safe defaults for page-only fields (siteId, version, history, menuOrder).
 */
const adaptPostToEditorData = (post: Post): EditorData => ({
  ...post,
  siteId: "",
  version: 0,
  history: [],
  menuOrder: 0,
  // Post doesn't have these page-only fields but the type requires them
} as EditorData);

export default function PageBuilderEditor({
  postId,
  isSlug = false,
  type = "page",
}: PageBuilderEditorProps) {
  const isPost = type === "post";
  const [, setLocation] = useLocation();
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>("");
  const [pageSlug, setPageSlug] = useState<string>("");
  const [pageStatus, setPageStatus] = useState<string>("draft");
  const draftSaveRef = useRef<NodeJS.Timeout>();
  const latestPageStateRef = useRef<{
    blocks: BlockConfig[];
    title: string;
    slug: string;
    status: string;
  }>({ blocks: [], title: "", slug: "", status: "draft" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Inline post editing state.
   * When a user clicks a post in the PostListBlock, we swap the canvas
   * to show that post's blocks without navigating away from the blog page URL.
   */
  const [inlinePostId, setInlinePostId] = useState<string | null>(null);
  const [inlinePostData, setInlinePostData] = useState<Post | null>(null);
  const storedBlogPageStateRef = useRef<{
    blocks: BlockConfig[];
    title: string;
    slug: string;
    status: string;
    data: EditorData;
  } | null>(null);

  /** API base path driven by content type */
  const apiBase = isPost ? "/api/posts" : "/api/pages";

  // Resolve page ID from slug if needed (only applicable for pages)
  const [resolvedPageId, setResolvedPageId] = useState<string | undefined>(
    postId
  );

  useEffect(() => {
    if (isSlug && postId && !isPost) {
      const mappingResult = getPageIdFromSlug(postId);
      if (mappingResult.status && mappingResult.data) {
        setResolvedPageId(mappingResult.data);
      } else {
        setResolvedPageId(postId);
      }
    } else {
      setResolvedPageId(postId);
    }
  }, [postId, isSlug, isPost]);

  const { data: rawData, isLoading, error } = useQuery<Page | Post>({
    queryKey: [`${apiBase}/${resolvedPageId || postId}`],
    enabled: !!(resolvedPageId || postId),
  });

  /** Normalise raw API data into the EditorData shape */
  const data: EditorData | undefined = rawData
    ? isPost
      ? adaptPostToEditorData(rawData as Post)
      : (rawData as Page)
    : undefined;

  // Reset state when page/post ID changes (before data loads)
  useEffect(() => {
    if (resolvedPageId || postId) {
      if (draftSaveRef.current) {
        clearTimeout(draftSaveRef.current);
      }
      setIsInitialized(false);
      setBlocks([]);
      setPageTitle("");
      setPageSlug("");
      setPageStatus("draft");
      latestPageStateRef.current = {
        blocks: [],
        title: "",
        slug: "",
        status: "draft",
      };
    }
  }, [resolvedPageId, postId]);

  useEffect(() => {
    if (!data) return;

    const currentId = resolvedPageId || postId;
    if (data.id !== currentId) return;

    // Load local draft — use post or page draft storage based on type
    const localResult = isPost
      ? loadPostDraft(data.id)
      : loadPageDraft(data.id);
    const localDraft = localResult.status ? localResult.data : null;

    const toTs = (value: unknown) => {
      if (!value) return 0;
      if (value instanceof Date) return value.getTime();
      return Date.parse(String(value));
    };

    const remoteTs = toTs(data.updatedAt);
    const localTs = toTs(localDraft?.updatedAt);
    const useLocal = localDraft && localTs > remoteTs;
    const source = useLocal ? localDraft : data;

    const initialBlocks = Array.isArray(source.blocks) ? source.blocks : [];
    const initialTitle = source.title || "Untitled";
    const initialSlug = source.slug || "";
    const initialStatus = source.status || "draft";

    setBlocks(initialBlocks);
    setPageTitle(initialTitle);
    setPageSlug(initialSlug);
    setPageStatus(initialStatus);
    latestPageStateRef.current = {
      blocks: initialBlocks,
      title: initialTitle,
      slug: initialSlug,
      status: initialStatus,
    };

    // Store slug mapping for pages only
    if (!isPost && data.id && data.slug) {
      storeSlugToIdMapping(data.slug, data.id);
    }

    // Persist initial draft
    if (isPost) {
      savePostDraft(data.id, data);
    } else {
      savePageDraft(data.id, data);
    }
    setIsInitialized(true);
  }, [data, resolvedPageId, postId, isPost]);

  // Replace URL with slug for pages (not applicable for posts)
  useEffect(() => {
    if (!isPost && data && postId && !isSlug && data.slug) {
      const currentPath = window.location.pathname;
      const slugPath = `/page-builder/page/${data.slug}`;
      const isUUIDPath =
        /^\/page-builder\/page\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          currentPath
        );
      if (isUUIDPath && currentPath !== slugPath) {
        window.history.replaceState({}, "", slugPath);
      }
    }
  }, [data, postId, isSlug, isPost]);

  const queueDraftSave = (
    override?: Partial<typeof latestPageStateRef.current>
  ) => {
    if (!data?.id) return;
    const next = {
      ...latestPageStateRef.current,
      ...override,
    };
    latestPageStateRef.current = next;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(() => {
      // When inline-editing a post, save draft to post storage
      if (inlinePostId && inlinePostData) {
        savePostDraft(inlinePostId, {
          ...inlinePostData,
          title: next.title,
          slug: next.slug,
          status: next.status,
          blocks: next.blocks,
        });
        return;
      }

      if (isPost) {
        savePostDraft(data.id, {
          ...data,
          title: next.title,
          slug: next.slug,
          status: next.status,
          blocks: next.blocks,
        });
      } else {
        savePageDraftWithHistory(
          data.id,
          {
            ...data,
            title: next.title,
            slug: next.slug,
            status: next.status,
            blocks: next.blocks,
            version: data.version ?? 0,
          },
          3
        );
      }
    }, 300);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (draftSaveRef.current) {
        clearTimeout(draftSaveRef.current);
      }
    };
  }, []);

  /**
   * Listen for `np:edit-post` custom events dispatched by PostListBlock.
   * When received, store the current blog page state and swap the canvas
   * to the clicked post's blocks for inline editing.
   */
  useEffect(() => {
    const handleEditPostEvent = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.postId || !data) return;

      // Store current blog page state so we can restore it later
      storedBlogPageStateRef.current = {
        blocks,
        title: pageTitle,
        slug: pageSlug,
        status: pageStatus,
        data,
      };

      try {
        const { apiRequest } = await import("@/lib/queryClient");
        const response = await apiRequest("GET", `/api/posts/${detail.postId}`);
        const post: Post = await response.json();

        const postBlocks = Array.isArray(post.blocks) ? post.blocks : [];
        setInlinePostId(post.id);
        setInlinePostData(post);
        setBlocks(postBlocks);
        setPageTitle(post.title || "Untitled Post");
        setPageSlug(post.slug || "");
        setPageStatus(post.status || "draft");
        latestPageStateRef.current = {
          blocks: postBlocks,
          title: post.title || "Untitled Post",
          slug: post.slug || "",
          status: post.status || "draft",
        };
      } catch (err) {
        console.error("Failed to load post for inline editing:", err);
        toast({
          title: "Error",
          description: "Failed to load post for editing",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("np:edit-post", handleEditPostEvent);
    return () => window.removeEventListener("np:edit-post", handleEditPostEvent);
  }, [data, blocks, pageTitle, pageSlug, pageStatus, toast]);

  /** Restore the blog page state after inline post editing */
  const handleBackToBlogPage = useCallback(() => {
    const stored = storedBlogPageStateRef.current;
    if (!stored) return;

    setInlinePostId(null);
    setInlinePostData(null);
    setBlocks(stored.blocks);
    setPageTitle(stored.title);
    setPageSlug(stored.slug);
    setPageStatus(stored.status);
    latestPageStateRef.current = {
      blocks: stored.blocks,
      title: stored.title,
      slug: stored.slug,
      status: stored.status,
    };
    storedBlogPageStateRef.current = null;

    // Re-fetch the blog page to pick up any server-side changes
    if (data?.id) {
      queryClient.invalidateQueries({ queryKey: [`${apiBase}/${data.id}`] });
    }
  }, [data, apiBase, queryClient]);

  const handleBlocksChange = (nextBlocks: BlockConfig[]) => {
    setBlocks(nextBlocks);
    queueDraftSave({ blocks: nextBlocks });
  };

  const handleTitleChange = (value: string) => {
    setPageTitle(value);
    queueDraftSave({ title: value });
  };

  const handlePageMetaChange = (
    meta: Partial<{ title: string; slug: string; status: string }>
  ) => {
    if (meta.title !== undefined) setPageTitle(meta.title);
    if (meta.slug !== undefined) setPageSlug(meta.slug);
    if (meta.status !== undefined) setPageStatus(meta.status);
    queueDraftSave(meta);
  };

  if (isLoading || (data && !isInitialized)) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 ml-40">
          <AdminTopBar />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wp-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 ml-40">
          <AdminTopBar />
          <div className="flex items-center justify-center h-full">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {isPost ? "Post" : "Page"} not found or failed to load.
                </p>
                <Button
                  onClick={() => setLocation(isPost ? "/posts" : "/pages")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {isPost ? "Posts" : "Pages"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // When inline-editing a post, show post-specific success message
    if (inlinePostId) {
      toast({
        title: "Success",
        description: "Post saved successfully",
      });
      clearPostDraft(inlinePostId);
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${inlinePostId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      return;
    }

    toast({
      title: "Success",
      description: `${isPost ? "Post" : "Page"} saved successfully`,
    });

    if (isPost) {
      clearPostDraft(data.id);
    } else {
      clearPageDraft(data.id);
    }
    queryClient.invalidateQueries({ queryKey: [`${apiBase}/${postId}`] });
    queryClient.invalidateQueries({ queryKey: [apiBase] });
  };

  const handlePageBuilderSave = async () => {
    if (!data) return;

    setIsSaving(true);
    try {
      const { apiRequest } = await import("@/lib/queryClient");

      // When inline-editing a post, save to the post API
      if (inlinePostId) {
        const postPayload = {
          title: pageTitle,
          slug: pageSlug,
          status: pageStatus,
          blocks,
        };
        const response = await apiRequest(
          "PUT",
          `/api/posts/${inlinePostId}`,
          postPayload
        );
        const updated = await response.json();
        savePostDraft(updated.id, updated);
        clearPostDraft(updated.id);
        setInlinePostData(updated);
        handleSave();
        return;
      }

      const payload = isPost
        ? { title: pageTitle, slug: pageSlug, status: pageStatus, blocks }
        : {
            title: pageTitle,
            slug: pageSlug,
            status: pageStatus,
            blocks,
            version: data.version ?? 0,
          };

      const response = await apiRequest(
        "PUT",
        `${apiBase}/${data.id}`,
        payload
      );
      const updated = await response.json();

      // Persist and clear draft
      if (isPost) {
        savePostDraft(updated.id, updated);
        clearPostDraft(updated.id);
      } else {
        savePageDraft(updated.id, updated);
        clearPageDraft(updated.id);
      }
      handleSave();
    } catch (err) {
      console.error(`Error saving ${type}:`, err);
      toast({
        title: "Error",
        description: `Failed to save ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // When inline-editing a post, preview the post
    if (inlinePostId) {
      window.open(`/preview/post/${inlinePostId}`, "_blank");
      return;
    }
    if (!data) return;
    const previewPath = isPost
      ? `/preview/post/${data.id}`
      : `/preview/page/${data.id}`;
    window.open(previewPath, "_blank");
  };

  const handleBackToList = () => {
    setLocation(isPost ? "/posts" : "/pages");
  };

  /** Determine the label and back behavior based on inline editing state */
  const isInlineEditing = !!inlinePostId;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Full-screen page builder */}
      <div className="w-full h-full flex flex-col">
        {/* Top navigation for page builder */}
        <div className="bg-wp-gray text-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-none">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={isInlineEditing ? handleBackToBlogPage : handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isInlineEditing ? "Back to Blog Page" : "Back"}
            </Button>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {isInlineEditing && (
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <span className="text-sm text-gray-400 flex-shrink-0">
                {isInlineEditing
                  ? "Editing Post:"
                  : `Editing ${isPost ? "Post" : "Page"}:`}
              </span>
              <Input
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-wp-gray border-gray-600 text-white text-sm h-8 focus:border-wp-blue"
                placeholder="Enter title..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="flex items-center gap-2 text-gray-800"
              data-testid="button-preview"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>

            <Button
              size="sm"
              onClick={handlePageBuilderSave}
              disabled={isSaving}
              className="flex items-center gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <PublishDialog
              post={data}
              blocks={blocks}
              onPublished={handleSave}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <PageBuilder
            post={
              isInlineEditing && inlinePostData
                ? adaptPostToEditorData(inlinePostData)
                : data
            }
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onSave={handleSave}
            onPreview={handlePreview}
            pageMeta={{
              title: pageTitle,
              slug: pageSlug,
              status: pageStatus,
              version: isInlineEditing ? 0 : data.version,
            }}
            onPageMetaChange={handlePageMetaChange}
          />
        </div>
      </div>
    </div>
  );
}

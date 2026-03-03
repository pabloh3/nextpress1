import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, Save } from "lucide-react";
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
      if (isPost) {
        // Posts use simple draft save (no history/versioning)
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
    if (!data) return;
    const previewPath = isPost
      ? `/preview/post/${data.id}`
      : `/preview/page/${data.id}`;
    window.open(previewPath, "_blank");
  };

  const handleBackToList = () => {
    setLocation(isPost ? "/posts" : "/pages");
  };

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
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-sm text-gray-400">
                Editing {isPost ? "Post" : "Page"}:
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
            post={data}
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onSave={handleSave}
            onPreview={handlePreview}
            pageMeta={{
              title: pageTitle,
              slug: pageSlug,
              status: pageStatus,
              version: data.version,
            }}
            onPageMetaChange={handlePageMetaChange}
          />
        </div>
      </div>
    </div>
  );
}

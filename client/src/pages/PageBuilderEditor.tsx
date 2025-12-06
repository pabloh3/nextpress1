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
import type { Post, Template, BlockConfig, Page } from "@shared/schema-types";
import {
  saveEditorState,
  loadEditorState,
  clearEditorState,
  storeSlugToIdMapping,
  getPageIdFromSlug,
} from "@/lib/editorStorage";
import {
  clearPageDraft,
  loadPageDraft,
  savePageDraft,
} from "@/lib/pageDraftStorage";

interface PageBuilderEditorProps {
  postId?: string;
  templateId?: string;
  type?: "post" | "page" | "template";
  isSlug?: boolean; // Whether postId is a slug (for pages) or an id
}

export default function PageBuilderEditor({
  postId,
  templateId,
  type = "page",
  isSlug = false,
}: PageBuilderEditorProps) {
  const [, setLocation] = useLocation();
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>("");
  const [settingsView, setSettingsView] = useState<"page" | "block">("page");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pageSlug, setPageSlug] = useState<string>("");
  const [pageStatus, setPageStatus] = useState<string>("draft");
  const pageBuilderRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Resolve page ID from slug if needed
  const [resolvedPageId, setResolvedPageId] = useState<string | undefined>(
    postId
  );

  useEffect(() => {
    if (type === "page" && isSlug && postId) {
      // Try to get ID from localStorage first
      const mappingResult = getPageIdFromSlug(postId);
      if (mappingResult.status && mappingResult.data) {
        setResolvedPageId(mappingResult.data);
      } else {
        // If not in localStorage, we'll fetch by slug and store the mapping
        setResolvedPageId(postId); // Will be resolved when data loads
      }
    } else {
      setResolvedPageId(postId);
    }
  }, [postId, type, isSlug]);

  // Fetch the post/page or template data
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQuery<Post | Page>({
    queryKey:
      type === "page"
        ? [`/api/pages/${resolvedPageId || postId}`]
        : [`/api/posts/${postId}`],
    enabled: !!(resolvedPageId || postId) && type !== "template",
  });

  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery<Template>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId && type === "template",
  });

  const isLoading = postLoading || templateLoading;
  const error = postError || templateError;
  const data = type === "template" ? template : post;

  // Initialize blocks when data is loaded (page uses full draft/local comparison)
  useEffect(() => {
    if (!data) return;

    if (type === "page") {
      const page = data as Page;
      const local = loadPageDraft(page.id);
      const localDraft = local.status ? local.data : null;

      const remoteTs = Date.parse(page.updatedAt || "");
      const localTs = localDraft?.updatedAt ? Date.parse(localDraft.updatedAt) : 0;
      const useLocal = localDraft && localTs > remoteTs;
      const source = useLocal ? localDraft : page;

      setBlocks((source.blocks as BlockConfig[]) || []);
      setPageTitle(source.title || "Untitled");
      setPageSlug(source.slug || "");
      setPageStatus(source.status || "draft");

      if (page.id && page.slug) {
        storeSlugToIdMapping(page.slug, page.id);
      }

      savePageDraft(page.id, source as any);
      return;
    }

    if (type === "template") {
      setBlocks(((data as Template).blocks as BlockConfig[]) || []);
      setPageTitle((data as Template).name || "Untitled");
      return;
    }

    const post = data as Post;
    setBlocks((post.builderData as BlockConfig[]) || []);
    setPageTitle(post.title || "Untitled");
    setPageSlug(post.slug || "");
    setPageStatus(post.status || "draft");
  }, [data, type]);

  // Update URL to show slug after data loads (but keep redirects using id)
  useEffect(() => {
    if (data && type === "page" && postId && !isSlug) {
      const page = data as Page;
      if (page.slug) {
        // Only update URL if slug exists and we're on an id-based URL
        const currentPath = window.location.pathname;
        const slugPath = `/page-builder/page/${page.slug}`;
        // Check if current path uses UUID format (id-based)
        const isUUIDPath =
          /^\/page-builder\/page\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            currentPath
          );
        // Only update if we're on id-based URL and slug is different
        if (isUUIDPath && currentPath !== slugPath) {
          // Use replace to avoid adding to history
          window.history.replaceState({}, "", slugPath);
        }
      }
    }
  }, [data, type, postId, isSlug]);

  // Load editor state from localStorage on mount (non-page)
  useEffect(() => {
    if (type === "page" || !data?.id) return;
    const savedState = loadEditorState(data.id);
    if (savedState.status && savedState.data) {
      if (savedState.data.blocks?.length > 0) {
        setBlocks(savedState.data.blocks);
      }
      if (savedState.data.pageTitle) {
        setPageTitle(savedState.data.pageTitle);
      }
      if (savedState.data.settingsView) {
        setSettingsView(savedState.data.settingsView);
      }
    }
  }, [data?.id, type]);

  // Debounce ref for localStorage save
  const saveDebounceRef = useRef<NodeJS.Timeout>();

  // Debounced auto-save to localStorage when state changes
  // Blocks state updates immediately, but localStorage save is debounced
  useEffect(() => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(() => {
      if (!data?.id) return;

      if (type === "page") {
        savePageDraft(data.id, {
          ...(data as Page),
          blocks,
          title: pageTitle,
          slug: pageSlug,
          status: pageStatus,
          updatedAt: new Date().toISOString(),
        } as any);
        return;
      }

      if (blocks.length > 0 || pageTitle) {
        saveEditorState(data.id, {
          blocks,
          pageTitle,
          settingsView,
        });
      }
    }, 300); // 300ms debounce for localStorage

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [blocks, pageTitle, pageSlug, pageStatus, settingsView, data?.id, type]);

  if (isLoading) {
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

  if (error || (!data && (postId || templateId))) {
    const entityName =
      type === "template" ? "Template" : type === "page" ? "Page" : "Post";
    const backPath =
      type === "template"
        ? "/templates"
        : type === "page"
        ? "/pages"
        : "/posts";
    const entityPlural =
      type === "template" ? "Templates" : type === "page" ? "Pages" : "Posts";

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
                  {entityName} not found or failed to load.
                </p>
                <Button
                  onClick={() => setLocation(backPath)}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {entityPlural}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = (updatedData: Post | Template) => {
    const entityName =
      type === "template" ? "Template" : type === "page" ? "Page" : "Post";
    toast({
      title: "Success",
      description: `${entityName} saved successfully`,
    });

    // Clear localStorage after successful save
    if (data?.id) {
      if (type === "page") {
        clearPageDraft(data.id);
      } else {
        clearEditorState(data.id);
      }
    }

    // Force query refresh to get latest data
    if (type === "page") {
      queryClient.invalidateQueries({ queryKey: [`/api/pages/${postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    } else if (type === "post") {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
    }
    queryClient.invalidateQueries({
      queryKey: [`/api/templates/${templateId}`],
    });
  };

  const handlePageBuilderSave = async () => {
    if (!data) return;
    if (type !== "page") {
      // For non-page, keep existing behavior (templates/posts) if needed later
      return;
    }

    setIsSaving(true);
    try {
      const { apiRequest } = await import("@/lib/queryClient");
      const endpoint = `/api/pages/${data.id}`;
      const payload = {
        title: pageTitle,
        slug: pageSlug,
        status: pageStatus,
        blocks,
        version: (data as Page).version ?? 0,
      };

      const response = await apiRequest("PUT", endpoint, payload);
      const updatedPage = await response.json();

      // Sync local draft with authoritative server response
      savePageDraft(updatedPage.id, updatedPage);
      clearPageDraft(updatedPage.id);

      handleSave(updatedPage as any);
    } catch (error) {
      console.error("Error in save handler:", error);
      toast({
        title: "Error",
        description: `Failed to save ${
          type === "template" ? "template" : "page"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (type === "template") {
      toast({
        title: "Info",
        description:
          "Template preview is not available. Templates are applied to content dynamically.",
      });
      return;
    }

    if (data) {
      const postType = type === "page" ? "page" : "post";
      const previewUrl = `/preview/${postType}/${data.id}`;
      window.open(previewUrl, "_blank");
    }
  };

  const handleBackToList = () => {
    const backPath =
      type === "template"
        ? "/templates"
        : type === "page"
        ? "/pages"
        : "/posts";
    setLocation(backPath);
  };

  const handlePageSettingsSave = async () => {
    if (!data || type === "template") return;

    setIsSaving(true);
    try {
      const { apiRequest } = await import("@/lib/queryClient");

      const endpoint =
        type === "page" ? `/api/pages/${data.id}` : `/api/posts/${data.id}`;

      const response = await apiRequest("PUT", endpoint, {
        title: pageTitle,
        slug: pageSlug,
        status: pageStatus,
      });

      const updatedData = await response.json();
      handleSave(updatedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save page settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
              <span className="text-sm text-gray-400">Editing:</span>
              <Input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
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
              {type === "template" ? "Settings" : "Preview"}
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
            {type !== "template" && data && (
              <PublishDialog
                post={data as Post}
                blocks={blocks}
                onPublished={handleSave}
                disabled={isSaving}
              />
            )}
          </div>
        </div>

        {/* Page Builder Component */}
        <div className="flex-1 min-h-0">
          <PageBuilder
            post={data}
            template={type === "template" ? (data as Template) : undefined}
            blocks={blocks}
            onBlocksChange={setBlocks}
            onSave={handleSave}
            onPreview={handlePreview}
            pageMeta={
              type === "page"
                ? {
                    title: pageTitle,
                    slug: pageSlug,
                    status: pageStatus,
                    version: (data as Page | undefined)?.version,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

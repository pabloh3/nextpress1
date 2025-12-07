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
import type { BlockConfig, Page } from "@shared/schema-types";
import { storeSlugToIdMapping, getPageIdFromSlug } from "@/lib/editorStorage";
import {
  clearPageDraft,
  loadPageDraft,
  savePageDraft,
  savePageDraftWithHistory,
} from "@/lib/pageDraftStorage";

interface PageBuilderEditorProps {
  postId?: string;
  isSlug?: boolean;
}

export default function PageBuilderEditor({
  postId,
  isSlug = false,
}: PageBuilderEditorProps) {
  const [, setLocation] = useLocation();
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
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

  // Resolve page ID from slug if needed
  const [resolvedPageId, setResolvedPageId] = useState<string | undefined>(
    postId
  );

  useEffect(() => {
    if (isSlug && postId) {
      const mappingResult = getPageIdFromSlug(postId);
      if (mappingResult.status && mappingResult.data) {
        setResolvedPageId(mappingResult.data);
      } else {
        setResolvedPageId(postId);
      }
    } else {
      setResolvedPageId(postId);
    }
  }, [postId, isSlug]);

  const { data, isLoading, error } = useQuery<Page>({
    queryKey: [`/api/pages/${resolvedPageId || postId}`],
    enabled: !!(resolvedPageId || postId),
  });

  // Reset state when page ID changes (before data loads)
  useEffect(() => {
    if (resolvedPageId || postId) {
      // Clear any pending draft saves
      if (draftSaveRef.current) {
        clearTimeout(draftSaveRef.current);
      }
      // Reset state
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

    // Ensure data matches the current page ID to avoid stale data
    const currentPageId = resolvedPageId || postId;
    if (data.id !== currentPageId) return;

    const page = data;
    const local = loadPageDraft(page.id);
    const localDraft = local.status ? local.data : null;

    const toTs = (value: unknown) => {
      if (!value) return 0;
      if (value instanceof Date) return value.getTime();
      return Date.parse(String(value));
    };

    const remoteTs = toTs(page.updatedAt);
    const localTs = toTs(localDraft?.updatedAt);
    const useLocal = localDraft && localTs > remoteTs;
    const source = useLocal ? localDraft : page;

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

    if (page.id && page.slug) {
      storeSlugToIdMapping(page.slug, page.id);
    }

    savePageDraft(page.id, source);
  }, [data, resolvedPageId, postId]);

  useEffect(() => {
    if (data && postId && !isSlug && data.slug) {
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
  }, [data, postId, isSlug]);

  const queuePageDraftSave = (
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
    queuePageDraftSave({ blocks: nextBlocks });
  };

  const handleTitleChange = (value: string) => {
    setPageTitle(value);
    queuePageDraftSave({ title: value });
  };

  const handlePageMetaChange = (
    meta: Partial<{ title: string; slug: string; status: string }>
  ) => {
    if (meta.title !== undefined) setPageTitle(meta.title);
    if (meta.slug !== undefined) setPageSlug(meta.slug);
    if (meta.status !== undefined) setPageStatus(meta.status);
    queuePageDraftSave(meta);
  };

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
                  Page not found or failed to load.
                </p>
                <Button
                  onClick={() => setLocation("/pages")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pages
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
      description: "Page saved successfully",
    });

    clearPageDraft(data.id);
    queryClient.invalidateQueries({ queryKey: [`/api/pages/${postId}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
  };

  const handlePageBuilderSave = async () => {
    if (!data) return;

    setIsSaving(true);
    try {
      const { apiRequest } = await import("@/lib/queryClient");
      const payload = {
        title: pageTitle,
        slug: pageSlug,
        status: pageStatus,
        blocks,
        version: data.version ?? 0,
      };

      const response = await apiRequest(
        "PUT",
        `/api/pages/${data.id}`,
        payload
      );
      const updatedPage: Page = await response.json();

      savePageDraft(updatedPage.id, updatedPage);
      clearPageDraft(updatedPage.id);
      handleSave();
    } catch (err) {
      console.error("Error saving page:", err);
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!data) return;
    window.open(`/preview/page/${data.id}`, "_blank");
  };

  const handleBackToList = () => {
    setLocation("/pages");
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

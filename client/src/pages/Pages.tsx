import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, Eye, Pencil } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { CreatePageModal } from "@/components/Pages/CreatePageModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page } from "@shared/schema-types";

interface PagesApiResponse {
  pages: Page[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function Pages() {
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [location, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL param for create modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const createParam = urlParams.get('create');
    const titleParam = urlParams.get('title');
    
    if (createParam === 'true') {
      setCreateModalOpen(true);
      // Clean up URL
      const newUrl = titleParam 
        ? `/pages?title=${encodeURIComponent(titleParam)}`
        : '/pages';
      setLocation(newUrl, { replace: true });
    }
  }, [location, setLocation]);

  const { data: pagesData, isLoading } = useQuery<PagesApiResponse>({
    queryKey: ['/api/pages', { status: 'any', page, per_page: 10 }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/pages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    setPageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pageToDelete) {
      deleteMutation.mutate(pageToDelete);
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  const handleNewPage = () => {
    setCreateModalOpen(true);
  };

  const handleView = (page: Page) => {
    // Published pages: open public URL. Draft/preview: open preview by ID so content is visible.
    if (page.status === 'publish' && page.siteId && page.slug) {
      window.open(`/sites/${page.siteId}/${page.slug}`, '_blank');
    } else {
      window.open(`/preview/page/${page.id}`, '_blank');
    }
  };

  const handlePageBuilder = (pageId: string) => {
    setLocation(`/page-builder/page/${pageId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      publish: "default",
      draft: "secondary",
      private: "outline",
      trash: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredPages = pagesData?.pages?.filter((page: Page) =>
    page.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-wp-gray">Pages</h1>
            <Button 
              className="bg-wp-blue hover:bg-wp-blue-dark text-white"
              onClick={handleNewPage}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Page
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Pages</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search pages..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading pages...</div>
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pages found. <Button variant="link" onClick={handleNewPage}>Create your first page</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPages.map((page: Page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-wp-gray">{page.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(page.status || 'draft')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{page.createdAt ? new Date(page.createdAt).toLocaleDateString() : 'N/A'}</div>
                            <div className="text-gray-500">
                              {page.createdAt ? new Date(page.createdAt).toLocaleTimeString() : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(page)}
                              title={page.status === 'publish' ? 'View published page' : 'Preview page'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePageBuilder(page.id)}
                              title="Edit with Page Builder"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(page.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {pagesData && pagesData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagesData.total)} of {pagesData.total} pages
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page >= pagesData.total_pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Page Modal */}
      <CreatePageModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialTitle={new URLSearchParams(window.location.search).get('title') || ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setPageToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

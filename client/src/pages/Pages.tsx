import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@shared/schema";

export default function Pages() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['/api/posts', { type: 'page', page, per_page: 10 }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/posts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this page?")) {
      deleteMutation.mutate(id);
    }
  };

  const createPageMutation = useMutation({
    mutationFn: async (pageData: any) => {
      return await apiRequest('POST', '/api/posts', pageData);
    },
    onSuccess: (newPage) => {
      toast({
        title: "Success",
        description: "New page created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      // Redirect to page builder for the new page
      window.location.href = `/page-builder/page/${newPage.id}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (pageId: number) => {
    window.location.href = `/page-builder/page/${pageId}`;
  };

  const handleNewPage = () => {
    const newPageData = {
      title: 'New Page',
      content: '',
      type: 'page',
      status: 'draft',
      usePageBuilder: true,
      builderData: []
    };
    
    createPageMutation.mutate(newPageData);
  };

  const handleView = (pageId: number) => {
    window.open(`/pages/${pageId}`, '_blank');
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

  const filteredPages = pagesData?.posts?.filter((page: Post) =>
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
                    {filteredPages.map((page: Post) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-wp-gray">{page.title}</div>
                            {page.excerpt && (
                              <div className="text-sm text-gray-500 mt-1">
                                {page.excerpt.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(page.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(page.createdAt).toLocaleDateString()}</div>
                            <div className="text-gray-500">
                              {new Date(page.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(page.id)}
                              title="View Page"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(page.id)}
                              title="Edit with Page Builder"
                            >
                              <Edit className="w-4 h-4" />
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


    </div>
  );
}

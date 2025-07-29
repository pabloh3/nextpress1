import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layout, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  Copy,
  Download
} from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { Link } from "wouter";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates'],
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest('POST', `/api/templates/${templateId}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: "Default template updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set default template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest('DELETE', `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: "Template deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-wp-gray">Templates</h1>
              <p className="text-gray-600 mt-1">
                Manage page templates and layouts for your NextPress site
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/templates/new">
                <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates?.templates?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.templates.map((template: Template) => (
                <Card key={template.id} className="border border-gray-200 hover:border-wp-blue/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Layout className="w-5 h-5 text-wp-blue" />
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {template.isDefault && (
                        <Badge className="bg-wp-blue text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Template Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-dashed border-gray-200">
                      <div className="text-center text-gray-400">
                        <Layout className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Template Preview</p>
                        <p className="text-xs capitalize">{template.type} Template</p>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {template.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-800">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link href={`/templates/${template.id}/preview`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/templates/${template.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      {!template.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setDefaultMutation.mutate(template.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteMutation.mutate(template.id)}
                        disabled={deleteMutation.isPending || template.isDefault}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Templates Yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first template to start building beautiful pages.
              </p>
              <Link href="/templates/new">
                <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
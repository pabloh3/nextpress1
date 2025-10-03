import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Edit, Trash2, Copy, Code, Settings, Eye, Paintbrush2 } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema";

interface TemplateCondition {
  type: 'page_type' | 'post_type' | 'specific_page' | 'specific_post' | 'taxonomy' | 'author' | 'date_range';
  operator: 'is' | 'is_not' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
  relation: 'and' | 'or';
}

export default function Templates() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [page, setPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/templates', { type: selectedType === 'all' ? undefined : selectedType, page, per_page: 20 }],
  });

  const createMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return await apiRequest('POST', '/api/templates', templateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setEditingTemplate(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return await apiRequest('POST', `/api/templates/${id}/duplicate`, { name });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "page" as const,
    applyTo: "all" as const,
    priority: 0,
    isActive: true,
    conditions: [] as TemplateCondition[],
    customHtml: "",
    customCss: "",
    customJs: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "page",
      applyTo: "all",
      priority: 0,
      isActive: true,
      conditions: [],
      customHtml: "",
      customCss: "",
      customJs: "",
    });
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      type: template.type as any,
      applyTo: (template.applyTo as any) || "all",
      priority: template.priority || 0,
      isActive: template.isActive ?? true,
      conditions: (template.conditions as TemplateCondition[]) || [],
      customHtml: template.customHtml || "",
      customCss: template.customCss || "",
      customJs: template.customJs || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDuplicate = (template: Template) => {
    const name = prompt(`Enter name for duplicated template:`, `${template.name} - Copy`);
    if (name) {
      duplicateMutation.mutate({ id: template.id, name });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePageBuilder = (templateId: number) => {
    window.open(`/page-builder/template/${templateId}?mode=builder`, '_blank');
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { type: 'page_type', operator: 'is', value: '', relation: 'and' }
      ]
    }));
  };

  const updateCondition = (index: number, field: keyof TemplateCondition, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (template: Template) => {
    return (
      <div className="flex gap-1">
        <Badge variant={template.isActive ? "default" : "secondary"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
        {template.type && (
          <Badge variant="outline" className="capitalize">
            {template.type}
          </Badge>
        )}
      </div>
    );
  };

  const filteredTemplates = (templatesData as any)?.filter((template: Template) =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-wp-gray">Templates</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-wp-blue hover:bg-wp-blue-dark text-white"
                  onClick={() => {
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="conditions">Display Conditions</TabsTrigger>
                    <TabsTrigger value="code">Custom Code</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter template name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Template Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="footer">Footer</SelectItem>
                            <SelectItem value="page">Page</SelectItem>
                            <SelectItem value="post">Post</SelectItem>
                            <SelectItem value="popup">Pop-up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this template"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Input
                          id="priority"
                          type="number"
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                        />
                        <p className="text-sm text-gray-500">Higher numbers take precedence</p>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="conditions" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Display Conditions</Label>
                      <p className="text-sm text-gray-500">
                        Define where this template should be applied. Leave empty to apply everywhere.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                          <Select
                            value={condition.type}
                            onValueChange={(value) => updateCondition(index, 'type', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="page_type">Page Type</SelectItem>
                              <SelectItem value="post_type">Post Type</SelectItem>
                              <SelectItem value="specific_page">Specific Page</SelectItem>
                              <SelectItem value="specific_post">Specific Post</SelectItem>
                              <SelectItem value="taxonomy">Taxonomy</SelectItem>
                              <SelectItem value="author">Author</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, 'operator', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="is">Is</SelectItem>
                              <SelectItem value="is_not">Is Not</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="starts_with">Starts With</SelectItem>
                              <SelectItem value="ends_with">Ends With</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1"
                          />
                          
                          {index > 0 && (
                            <Select
                              value={condition.relation}
                              onValueChange={(value) => updateCondition(index, 'relation', value)}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="and">AND</SelectItem>
                                <SelectItem value="or">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button variant="outline" onClick={addCondition}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Condition
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customHtml">Custom HTML</Label>
                        <Textarea
                          id="customHtml"
                          value={formData.customHtml}
                          onChange={(e) => setFormData(prev => ({ ...prev, customHtml: e.target.value }))}
                          placeholder="Enter custom HTML code"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customCss">Custom CSS</Label>
                        <Textarea
                          id="customCss"
                          value={formData.customCss}
                          onChange={(e) => setFormData(prev => ({ ...prev, customCss: e.target.value }))}
                          placeholder="Enter custom CSS code"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customJs">Custom JavaScript</Label>
                        <Textarea
                          id="customJs"
                          value={formData.customJs}
                          onChange={(e) => setFormData(prev => ({ ...prev, customJs: e.target.value }))}
                          placeholder="Enter custom JavaScript code"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Templates</CardTitle>
                <div className="flex items-center space-x-4">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="popup">Pop-up</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
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
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates found. <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>Create your first template</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template: Template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-wp-gray">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {template.description.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(template)}
                        </TableCell>
                        <TableCell>
                          {template.priority || 0}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                             {new Date(template.createdAt || '').toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePageBuilder(template.id)}
                                  >
                                    <Paintbrush2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit with page builder</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Template settings</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDuplicate(template)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Duplicate template</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDelete(template.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete template</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Plus, 
  Trash2,
  Settings,
  Palette,
  Layout as LayoutIcon
} from "lucide-react";
import { useLocation } from "wouter";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TemplateEditorProps {
  templateId?: string;
}

export default function TemplateEditor({ templateId }: TemplateEditorProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);

  const isEditing = Boolean(templateId);

  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/templates', templateId],
    enabled: isEditing,
  });

  const [templateData, setTemplateData] = useState(() => ({
    name: '',
    description: '',
    type: 'page',
    isDefault: false,
    config: {
      header: {
        title: 'Page Title',
        subtitle: 'Page subtitle',
        showButtons: true,
        backgroundColor: 'bg-white'
      },
      sections: [],
      footer: {
        showLinks: true,
        text: 'NextPress'
      },
      styling: {
        backgroundColor: 'bg-wp-gray-light',
        textColor: 'text-wp-gray',
        accentColor: 'text-wp-blue'
      }
    }
  }));

  // Update local state when template loads
  useState(() => {
    if (template) {
      setTemplateData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        isDefault: template.isDefault,
        config: template.config
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return await apiRequest('PUT', `/api/templates/${templateId}`, data);
      } else {
        return await apiRequest('POST', '/api/templates', data);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: `Template ${isEditing ? 'updated' : 'created'} successfully`,
      });
      if (!isEditing) {
        navigate(`/templates/${result.id}/edit`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(templateData);
  };

  const addSection = () => {
    setTemplateData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: [
          ...prev.config.sections,
          {
            id: `section-${Date.now()}`,
            type: 'content',
            title: 'New Section',
            config: {}
          }
        ]
      }
    }));
  };

  const removeSection = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSection = (index: number, updates: any) => {
    setTemplateData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map((section, i) => 
          i === index ? { ...section, ...updates } : section
        )
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wp-gray-light">
        <AdminTopBar />
        <AdminSidebar />
        <div className="ml-40 pt-8 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Editor
              </Button>
              <Badge>Preview Mode</Badge>
            </div>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-wp-blue hover:bg-wp-blue-dark text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
        <div className="pt-16">
          <TemplateRenderer 
            template={{
              ...templateData,
              id: parseInt(templateId || '0'),
              createdAt: new Date(),
              updatedAt: new Date()
            } as Template} 
            isPreview={true} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/templates')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-wp-gray">
                  {isEditing ? 'Edit Template' : 'Create Template'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing ? `Editing: ${templateData.name}` : 'Create a new page template'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-wp-blue hover:bg-wp-blue-dark text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <Settings className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="layout">
                <LayoutIcon className="w-4 h-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="styling">
                <Palette className="w-4 h-4 mr-2" />
                Styling
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={templateData.name}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Template Type</Label>
                      <select
                        id="type"
                        value={templateData.type}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="page">Page</option>
                        <option value="post">Post</option>
                        <option value="homepage">Homepage</option>
                        <option value="landing">Landing Page</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={templateData.description}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this template is for"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="default"
                      checked={templateData.isDefault}
                      onCheckedChange={(checked) => setTemplateData(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="default">Set as default template for this type</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Header Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-title">Title</Label>
                      <Input
                        id="header-title"
                        value={templateData.config.header?.title || ''}
                        onChange={(e) => setTemplateData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            header: { ...prev.config.header, title: e.target.value }
                          }
                        }))}
                        placeholder="Page title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-subtitle">Subtitle</Label>
                      <Input
                        id="header-subtitle"
                        value={templateData.config.header?.subtitle || ''}
                        onChange={(e) => setTemplateData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            header: { ...prev.config.header, subtitle: e.target.value }
                          }
                        }))}
                        placeholder="Page subtitle"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-buttons"
                      checked={templateData.config.header?.showButtons || false}
                      onCheckedChange={(checked) => setTemplateData(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          header: { ...prev.config.header, showButtons: checked }
                        }
                      }))}
                    />
                    <Label htmlFor="show-buttons">Show action buttons in header</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Page Sections</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSection}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templateData.config.sections?.map((section, index) => (
                    <Card key={section.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Section Title</Label>
                              <Input
                                value={section.title || ''}
                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                placeholder="Section title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Section Type</Label>
                              <select
                                value={section.type}
                                onChange={(e) => updateSection(index, { type: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="stats">Stats</option>
                                <option value="content">Content</option>
                                <option value="cards">Cards</option>
                                <option value="grid">Grid</option>
                                <option value="hero">Hero</option>
                              </select>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {templateData.config.sections?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <LayoutIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No sections added yet.</p>
                      <Button variant="outline" onClick={addSection} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Section
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="styling" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bg-color">Background Color</Label>
                      <Input
                        id="bg-color"
                        value={templateData.config.styling?.backgroundColor || ''}
                        onChange={(e) => setTemplateData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            styling: { ...prev.config.styling, backgroundColor: e.target.value }
                          }
                        }))}
                        placeholder="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Text Color</Label>
                      <Input
                        id="text-color"
                        value={templateData.config.styling?.textColor || ''}
                        onChange={(e) => setTemplateData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            styling: { ...prev.config.styling, textColor: e.target.value }
                          }
                        }))}
                        placeholder="text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <Input
                        id="accent-color"
                        value={templateData.config.styling?.accentColor || ''}
                        onChange={(e) => setTemplateData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            styling: { ...prev.config.styling, accentColor: e.target.value }
                          }
                        }))}
                        placeholder="text-blue-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50">
                    <div className="text-center text-gray-500">
                      <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="mb-4">Live preview will be shown here</p>
                      <Button onClick={() => setPreviewMode(true)}>
                        Open Full Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
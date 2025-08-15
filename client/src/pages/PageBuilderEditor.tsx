import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Eye, Settings } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import PageBuilder from "@/components/PageBuilder/PageBuilder";
import PostEditor from "@/components/PostEditor";
import { useToast } from "@/hooks/use-toast";
import type { Post, Template } from "@shared/schema";

interface PageBuilderEditorProps {
  postId?: string;
  templateId?: string;
  type?: 'post' | 'page' | 'template';
}

export default function PageBuilderEditor({ postId, templateId, type = 'page' }: PageBuilderEditorProps) {
  const [, setLocation] = useLocation();
  const [editorMode, setEditorMode] = useState<'builder' | 'classic'>('builder');
  const { toast } = useToast();

  // Fetch the post/page or template data
  const { data: post, isLoading: postLoading, error: postError } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId && type !== 'template',
  });

  const { data: template, isLoading: templateLoading, error: templateError } = useQuery<Template>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId && type === 'template',
  });

  const isLoading = postLoading || templateLoading;
  const error = postError || templateError;
  const data = type === 'template' ? template : post;

  useEffect(() => {
    // Check URL parameters for explicit mode override
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    if (modeParam === 'builder' || modeParam === 'classic') {
      // Override mode if explicitly specified in URL
      setEditorMode(modeParam);
    } else if (type === 'template') {
      // Templates always use the page builder
      setEditorMode('builder');
    } else if (post) {
      // Set editor mode based on whether the post uses page builder
      setEditorMode(post.usePageBuilder ? 'builder' : 'classic');
    }
  }, [post, template, type]);

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
    const entityName = type === 'template' ? 'Template' : type === 'page' ? 'Page' : 'Post';
    const backPath = type === 'template' ? '/templates' : type === 'page' ? '/pages' : '/posts';
    const entityPlural = type === 'template' ? 'Templates' : type === 'page' ? 'Pages' : 'Posts';
    
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
    const entityName = type === 'template' ? 'Template' : type === 'page' ? 'Page' : 'Post';
    toast({
      title: "Success",
      description: `${entityName} saved successfully`,
    });
    // Optionally redirect or update UI
  };

  const handlePreview = () => {
    if (type === 'template') {
      toast({
        title: "Info",
        description: "Template preview is not available. Templates are applied to content dynamically.",
      });
      return;
    }
    const previewUrl = type === 'page' ? `/pages/${data?.id}` : `/posts/${data?.id}`;
    window.open(previewUrl, '_blank');
  };

  const handleBackToList = () => {
    const backPath = type === 'template' ? '/templates' : type === 'page' ? '/pages' : '/posts';
    setLocation(backPath);
  };

  const handleModeSwitch = (newMode: 'builder' | 'classic') => {
    if (newMode !== editorMode) {
      const confirmMessage = newMode === 'builder' 
        ? 'Switch to Page Builder? This will enable visual editing but may affect how your content is displayed.'
        : 'Switch to Classic Editor? You may lose some visual formatting from the page builder.';
      
      if (confirm(confirmMessage)) {
        setEditorMode(newMode);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {editorMode === 'builder' ? (
        // Full-screen page builder
        <div className="w-full">
          {/* Top navigation for page builder */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="text-sm text-gray-500">
                Editing: {type === 'template' ? (data as Template)?.name : (data as Post)?.title || 'Untitled'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {type !== 'template' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModeSwitch('classic')}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Classic Editor
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {type === 'template' ? 'Settings' : 'Preview'}
              </Button>
            </div>
          </div>
          
          {/* Page Builder Component */}
          <PageBuilder
            post={data}
            template={type === 'template' ? data as Template : undefined}
            onSave={handleSave}
            onPreview={handlePreview}
          />
        </div>
      ) : (
        // Classic editor with sidebar
        <>
          <AdminSidebar />
          <div className="flex-1 ml-40">
            <AdminTopBar />
            
            <div className="px-6 pt-8 pb-6">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 py-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToList}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <h1 className="text-2xl font-bold text-wp-gray">
                      Edit {type === 'template' ? 'Template' : type === 'page' ? 'Page' : 'Post'}
                    </h1>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeSwitch('builder')}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Page Builder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Editor Tabs */}
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Content Editor</TabsTrigger>
                    <TabsTrigger value="settings">Page Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="mt-6">
                    {type !== 'template' && (
                      <PostEditor
                        postId={parseInt(postId!)}
                        type={type}
                        onSave={handleSave}
                        noContainer={true}
                      />
                    )}
                    {type === 'template' && (
                      <div className="text-center py-8 text-gray-500">
                        Templates use the Page Builder exclusively. Switch to Page Builder mode to edit this template.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Page Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {type === 'template' ? (
                            <>
                              <div>
                                <label className="text-sm font-medium">Name: {(data as Template)?.name}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Type: {(data as Template)?.type}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status: {(data as Template)?.isActive ? 'Active' : 'Inactive'}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Priority: {(data as Template)?.priority || 0}</label>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-sm font-medium">Status: {(data as Post)?.status}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Type: {(data as Post)?.type}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Slug: {(data as Post)?.slug}</label>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Editor Mode: {(data as Post)?.usePageBuilder ? 'Page Builder' : 'Classic'}
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
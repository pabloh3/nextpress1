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
import type { Post } from "@shared/schema";

interface PageBuilderEditorProps {
  postId?: string;
  type?: 'post' | 'page';
}

export default function PageBuilderEditor({ postId, type = 'page' }: PageBuilderEditorProps) {
  const [, setLocation] = useLocation();
  const [editorMode, setEditorMode] = useState<'builder' | 'classic'>('builder');
  const { toast } = useToast();

  // Fetch the post/page data
  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId,
  });

  useEffect(() => {
    if (post) {
      // Set editor mode based on whether the post uses page builder
      setEditorMode(post.usePageBuilder ? 'builder' : 'classic');
    }
  }, [post]);

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

  if (error || !post) {
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
                  {type === 'page' ? 'Page' : 'Post'} not found or failed to load.
                </p>
                <Button 
                  onClick={() => setLocation(type === 'page' ? '/pages' : '/posts')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {type === 'page' ? 'Pages' : 'Posts'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = (updatedPost: Post) => {
    toast({
      title: "Success",
      description: `${type === 'page' ? 'Page' : 'Post'} saved successfully`,
    });
    // Optionally redirect or update UI
  };

  const handlePreview = () => {
    const previewUrl = type === 'page' ? `/pages/${post.id}` : `/posts/${post.id}`;
    window.open(previewUrl, '_blank');
  };

  const handleBackToList = () => {
    setLocation(type === 'page' ? '/pages' : '/posts');
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
                Editing: {post.title}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModeSwitch('classic')}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Classic Editor
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
          
          {/* Page Builder Component */}
          <PageBuilder
            post={post}
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
            
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
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
                      Edit {type === 'page' ? 'Page' : 'Post'}
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
                    <PostEditor
                      postId={parseInt(postId!)}
                      type={type}
                      onSave={handleSave}
                    />
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Page Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Status: {post.status}</label>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Type: {post.type}</label>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Slug: {post.slug}</label>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Editor Mode: {post.usePageBuilder ? 'Page Builder' : 'Classic'}
                            </label>
                          </div>
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
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useContentLists } from '@/hooks/useContentLists';
import { Save } from 'lucide-react';
import type { Page, Post, Template } from '@shared/schema-types';

interface PageSettingsProps {
  page: Page | Post | Template | undefined;
  isTemplate?: boolean;
  onUpdate?: (updatedPage: Page | Post | Template) => void;
}

/**
 * Component to display and edit page properties.
 * Shows all page fields from schema and allows editing.
 */
export default function PageSettings({
  page,
  isTemplate = false,
  onUpdate,
}: PageSettingsProps) {
  const [formData, setFormData] = useState({
    title: (page as any)?.title || (page as Template)?.name || '',
    slug: (page as any)?.slug || '',
    status: (page as any)?.status || 'draft',
    featuredImage: (page as any)?.featuredImage || '',
    allowComments: (page as any)?.allowComments ?? true,
    password: (page as any)?.password || '',
    parentId: (page as Page)?.parentId || '',
    menuOrder: (page as Page)?.menuOrder || 0,
    templateId: (page as Page)?.templateId || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pages, templates } = useContentLists();

  // Update form data when page changes
  useEffect(() => {
    if (page) {
      setFormData({
        title: (page as any)?.title || (page as Template)?.name || '',
        slug: (page as any)?.slug || '',
        status: (page as any)?.status || 'draft',
        featuredImage: (page as any)?.featuredImage || '',
        allowComments: (page as any)?.allowComments ?? true,
        password: (page as any)?.password || '',
        parentId: (page as Page)?.parentId || '',
        menuOrder: (page as Page)?.menuOrder || 0,
        templateId: (page as Page)?.templateId || '',
      });
    }
  }, [page]);

  const handleFieldChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!page?.id) return;

    setIsSaving(true);
    try {
      const { apiRequest } = await import('@/lib/queryClient');
      
      if (isTemplate) {
        const response = await apiRequest('PUT', `/api/templates/${page.id}`, {
          name: formData.title,
        });
        const updated = await response.json();
        onUpdate?.(updated);
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      } else {
        // Check if it's a page (has menuOrder) or post
        const isPage = 'menuOrder' in page;
        const endpoint = isPage ? `/api/pages/${page.id}` : `/api/posts/${page.id}`;
        
        const payload: any = {
          title: formData.title,
          slug: formData.slug,
          status: formData.status,
          featuredImage: formData.featuredImage || undefined,
          allowComments: formData.allowComments,
          password: formData.password || undefined,
        };

        if (isPage) {
          payload.parentId = formData.parentId || undefined;
          payload.menuOrder = formData.menuOrder;
          payload.templateId = formData.templateId || undefined;
        }

        const response = await apiRequest('PUT', endpoint, payload);
        const updated = await response.json();
        onUpdate?.(updated);
        
        queryClient.invalidateQueries({ queryKey: isPage ? ['/api/pages'] : ['/api/posts'] });
        queryClient.invalidateQueries({ queryKey: [endpoint] });
      }

      toast({
        title: 'Success',
        description: `${isTemplate ? 'Template' : 'Page'} settings saved successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!page) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No page data available
      </div>
    );
  }

  if (isTemplate) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="template-name">Name</Label>
          <Input
            id="template-name"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    );
  }

  const isPage = 'menuOrder' in page;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="page-title">Title</Label>
        <Input
          id="page-title"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Enter page title"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="page-slug">Slug</Label>
        <Input
          id="page-slug"
          value={formData.slug}
          onChange={(e) => handleFieldChange('slug', e.target.value)}
          placeholder="page-url-slug"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="page-status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleFieldChange('status', value)}
        >
          <SelectTrigger id="page-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="publish">Published</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="page-featured-image">Featured Image URL</Label>
        <Input
          id="page-featured-image"
          value={formData.featuredImage}
          onChange={(e) => handleFieldChange('featuredImage', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="page-allow-comments"
          checked={formData.allowComments}
          onCheckedChange={(checked) =>
            handleFieldChange('allowComments', checked === true)
          }
        />
        <Label htmlFor="page-allow-comments" className="cursor-pointer">
          Allow Comments
        </Label>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="page-password">Password</Label>
        <Input
          id="page-password"
          type="password"
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          placeholder="Leave empty for no password"
        />
      </div>

      {isPage && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="page-parent">Parent Page</Label>
            <Select
              value={formData.parentId || '__none__'}
              onValueChange={(value) =>
                handleFieldChange('parentId', value === '__none__' ? undefined : value)
              }
            >
              <SelectTrigger id="page-parent">
                <SelectValue placeholder="None (Top Level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (Top Level)</SelectItem>
                {pages
                  .filter((p) => p.id !== page.id)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="page-menu-order">Menu Order</Label>
            <Input
              id="page-menu-order"
              type="number"
              value={formData.menuOrder}
              onChange={(e) =>
                handleFieldChange('menuOrder', parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="page-template">Template</Label>
            <Select
              value={formData.templateId || '__none__'}
              onValueChange={(value) =>
                handleFieldChange('templateId', value === '__none__' ? undefined : value)
              }
            >
              <SelectTrigger id="page-template">
                <SelectValue placeholder="Default Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Default Template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full mt-4"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}


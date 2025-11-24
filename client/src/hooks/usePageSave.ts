import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BlockConfig, Post, Template } from '@shared/schema-types';

export function usePageSave({ isTemplate, data, onSave }: { isTemplate: boolean, data: Post | Template | undefined, onSave?: (updatedData: Post | Template) => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (builderData: BlockConfig[]) => {
      if (!data) return null;
      if (isTemplate) {
        const response = await apiRequest('PUT', `/api/templates/${data.id}`, { blocks: builderData });
        return await response.json();
      } else {
        // Check if it's a page (has menuOrder property) or a post
        const isPage = 'menuOrder' in data;
        const endpoint = isPage ? `/api/pages/${data.id}` : `/api/posts/${data.id}`;
        const payload = isPage 
          ? { blocks: builderData }  // Pages use blocks field
          : { builderData, usePageBuilder: true };  // Posts use builderData
        
        const response = await apiRequest('PUT', endpoint, payload);
        return await response.json();
      }
    },
    onSuccess: (updatedData) => {
      const isPage = !isTemplate && data && 'menuOrder' in data;
      toast.toast({
        title: 'Success',
        description: `${isTemplate ? 'Template' : isPage ? 'Page' : 'Post'} saved successfully`,
      });
      onSave?.(updatedData);
      
      // Invalidate appropriate queries
      if (isTemplate) {
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      } else if (isPage) {
        queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      }
    },
    onError: () => {
      const isPage = !isTemplate && data && 'menuOrder' in data;
      toast.toast({
        title: 'Error',
        description: `Failed to save ${isTemplate ? 'template' : isPage ? 'page' : 'post'}`,
        variant: 'destructive',
      });
    },
  });

  return saveMutation;
}

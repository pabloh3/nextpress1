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
        const response = await apiRequest('PUT', `/api/posts/${data.id}`, { builderData, usePageBuilder: true });
        return await response.json();
      }
    },
    onSuccess: (updatedData) => {
      toast.toast({
        title: 'Success',
        description: `${isTemplate ? 'Template' : 'Page'} saved successfully`,
      });
      onSave?.(updatedData);
      queryClient.invalidateQueries({ queryKey: isTemplate ? ['/api/templates'] : ['/api/posts'] });
    },
    onError: () => {
      toast.toast({
        title: 'Error',
        description: `Failed to save ${isTemplate ? 'template' : 'page'}`,
        variant: 'destructive',
      });
    },
  });

  return saveMutation;
}

import { ReactNode, useState } from 'react';
import { Layout, Palette, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContentLists } from '@/hooks/useContentLists';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DesignMenuProps {
  children: ReactNode;
  currentPostId?: string;
  currentType?: 'post' | 'page' | 'template';
}

/**
 * DesignMenu - Dropdown for applying templates and themes
 * Phase 2: Full mutation support with loading states
 */
export function DesignMenu({
  children,
  currentPostId,
  currentType,
}: DesignMenuProps) {
  const { templates, themes } = useContentLists();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);

  // Mutation for applying template to current post/page
  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId }: { templateId: string }) => {
      if (!currentPostId) {
        throw new Error('No post/page selected');
      }
      return await apiRequest('PUT', `/api/posts/${currentPostId}`, {
        templateId,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${currentPostId}`] });
      const template = templates.find((t) => t.id === variables.templateId);
      toast({
        title: 'Template Applied',
        description: `Successfully applied "${template?.name}" template`,
      });
      setIsApplying(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply template',
        variant: 'destructive',
      });
      setIsApplying(false);
    },
  });

  // Mutation for activating theme
  const activateThemeMutation = useMutation({
    mutationFn: async ({ themeId }: { themeId: string }) => {
      return await apiRequest('POST', `/api/themes/${themeId}/activate`, {});
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/active'] });
      const theme = themes.find((t) => t.id === variables.themeId);
      toast({
        title: 'Theme Activated',
        description: `Successfully activated "${theme?.name}" theme`,
      });
      setIsApplying(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate theme',
        variant: 'destructive',
      });
      setIsApplying(false);
    },
  });

  const handleApplyTemplate = (templateId: string, templateName: string) => {
    if (!currentPostId) {
      toast({
        title: 'Error',
        description: 'No post/page selected for template application',
        variant: 'destructive',
      });
      return;
    }
    setIsApplying(true);
    applyTemplateMutation.mutate({ templateId });
  };

  const handleApplyTheme = (themeId: string, themeName: string) => {
    setIsApplying(true);
    activateThemeMutation.mutate({ themeId });
  };

  // Don't show design menu for templates
  if (currentType === 'template') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Templates Section */}
        <DropdownMenuLabel>Templates</DropdownMenuLabel>
        <DropdownMenuGroup>
          {templates.length > 0 ? (
            templates.slice(0, 5).map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() =>
                  handleApplyTemplate(template.id, template.name)
                }
                disabled={isApplying || !currentPostId}>
                {isApplying && applyTemplateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Layout className="w-4 h-4" />
                )}
                {template.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-sm text-muted-foreground">
                No templates
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Themes Section */}
        <DropdownMenuLabel>Themes</DropdownMenuLabel>
        <DropdownMenuGroup>
          {themes.length > 0 ? (
            themes.slice(0, 5).map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleApplyTheme(theme.id, theme.name)}
                disabled={isApplying}>
                {isApplying && activateThemeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Palette className="w-4 h-4" />
                )}
                {theme.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-sm text-muted-foreground">No themes</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

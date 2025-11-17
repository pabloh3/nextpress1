import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { FileText, Plus, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useContentLists } from '@/hooks/useContentLists';
import { CreateContentDialog } from './CreateContentDialog';

interface PagesMenuProps {
  children: ReactNode;
  currentPageId?: string;
}

/**
 * PagesMenu - Dropdown for browsing and creating pages
 * Opens Command palette for searchable page list
 */
export function PagesMenu({ children, currentPageId }: PagesMenuProps) {
  const [, setLocation] = useLocation();
  const [showCommand, setShowCommand] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { pages, pagesLoading } = useContentLists();

  const handlePageSelect = (pageId: string) => {
    setShowCommand(false);
    setLocation(`/pages/${pageId}/edit`);
  };

  const handleCreateNew = () => {
    setShowCreate(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setShowCommand(true)}>
            <Search className="w-4 h-4" />
            Browse Pages
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            Create New Page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Command Palette for browsing pages */}
      <CommandDialog open={showCommand} onOpenChange={setShowCommand}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>
            {pagesLoading ? 'Loading pages...' : 'No pages found.'}
          </CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.id}
                onSelect={() => handlePageSelect(page.id)}
                className={currentPageId === page.id ? 'bg-accent' : ''}>
                <FileText className="w-4 h-4" />
                <span>{page.title}</span>
                {page.status && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {page.status}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Create Page Dialog */}
      <CreateContentDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        type="page"
      />
    </>
  );
}

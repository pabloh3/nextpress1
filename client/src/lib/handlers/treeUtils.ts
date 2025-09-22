
import type { BlockConfig } from '@shared/schema';
import { getDefaultBlock } from '@/components/PageBuilder/blocks';

export function findBlock(rootBlocks: BlockConfig[], targetId: string): BlockConfig | null {
  function search(list: BlockConfig[]): BlockConfig | null {
    for (const block of list) {
      if (block.id === targetId) {
        return block;
      }
      
      // Check for ColumnsBlock structure - search within columns
      if (block.type === 'core/columns' && block.content?.columns) {
        const columns = (block.content as any).columns;
        for (const column of columns) {
          if (Array.isArray(column.children)) {
            const found = search(column.children);
            if (found) return found;
          }
        }
      }
      
      if (Array.isArray(block.children)) {
        const found = search(block.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(rootBlocks);
}

export function findBlockPath(rootBlocks: BlockConfig[], targetId: string): number[] | null {
  const path: number[] = [];
  function dfs(list: BlockConfig[], currentPath: number[]): boolean {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const next = currentPath.concat(i);
      if (b.id === targetId) {
        path.push(...next);
        return true;
      }
      if (Array.isArray(b.children) && dfs(b.children, next.concat(-1))) return true; // -1 marker separating levels
    }
    return false;
  }
  if (!dfs(rootBlocks, [])) return null;
  return path;
}

export function insertNewBlock(rootBlocks: BlockConfig[], parentId: string | null, index: number, type: string): { blocks: BlockConfig[]; newId?: string } {
  const clone = structuredClone(rootBlocks) as BlockConfig[];
  const newBlock = getDefaultBlock(type, crypto.randomUUID());
  if (!newBlock) return { blocks: rootBlocks };
  if (!parentId) {
    clone.splice(index, 0, newBlock);
    return { blocks: clone, newId: newBlock.id };
  }
  function insert(list: BlockConfig[]): boolean {
    for (const b of list) {
      if (b.id === parentId) {
        if (!Array.isArray(b.children)) b.children = [];
        b.children.splice(index, 0, newBlock!);
        return true;
      }
      
      // Check for ColumnsBlock structure - insert into column containers
      if (b.type === 'core/columns' && b.content?.columns) {
        const columns = (b.content as any).columns;
        for (const column of columns) {
          if (column.id === parentId) {
            if (!Array.isArray(column.children)) column.children = [];
            column.children.splice(index, 0, newBlock!);
            return true;
          }
        }
        
        // Also recursively search in column children for nested blocks
        for (const column of columns) {
          if (Array.isArray(column.children) && insert(column.children)) {
            return true;
          }
        }
      }
      
      if (b.children && insert(b.children)) return true;
    }
    return false;
  }
  if (!insert(clone)) return { blocks: rootBlocks };
  return { blocks: clone, newId: newBlock.id };
}

// Helper to find the parent list and index of a block
function findParent(list: BlockConfig[], parentId: string | null): { container: BlockConfig[], parentBlock: BlockConfig | null } {
    if (parentId === null) {
        return { container: list, parentBlock: null };
    }

    const queue: BlockConfig[] = [...list];
    while(queue.length > 0) {
        const block = queue.shift();
        if (block && block.id === parentId) {
            if (!Array.isArray(block.children)) {
                block.children = [];
            }
            return { container: block.children, parentBlock: block };
        }
        
        // Check for ColumnsBlock structure - look for column IDs
        if (block && block.type === 'core/columns' && block.content?.columns) {
            const columns = (block.content as any).columns;
            for (const column of columns) {
                if (column.id === parentId) {
                    if (!Array.isArray(column.children)) {
                        column.children = [];
                    }
                    return { container: column.children, parentBlock: block };
                }
            }
            
            // Also add column children to the queue for recursive search
            for (const column of columns) {
                if (Array.isArray(column.children)) {
                    queue.push(...column.children);
                }
            }
        }
        
        if (block && Array.isArray(block.children)) {
            queue.push(...block.children);
        }
    }

    return { container: list, parentBlock: null }; // Fallback to root
}


export function moveExistingBlock(rootBlocks: BlockConfig[], sourceParentId: string | null, sourceIndex: number, destParentId: string | null, destIndex: number): BlockConfig[] {
  const clone = structuredClone(rootBlocks) as BlockConfig[];

  const { container: sourceContainer } = findParent(clone, sourceParentId);
  if (!sourceContainer || sourceIndex < 0 || sourceIndex >= sourceContainer.length) {
    console.error("Source not found", { sourceParentId, sourceIndex });
    return rootBlocks;
  }

  const movedBlock = sourceContainer[sourceIndex];
  if (!movedBlock) {
    return rootBlocks;
  }

  // Prevent moving a block into itself or its descendants
  if (movedBlock.id === destParentId) {
    console.error("Cannot move a block into itself.");
    return rootBlocks;
  }
  if (destParentId !== null) {
      const isDescendant = findBlock(movedBlock.children || [], destParentId);
      if (isDescendant) {
        console.error("Cannot move a block into one of its own descendants.");
        return rootBlocks;
      }
  }

  const sameParent = sourceParentId === destParentId;
  // No-op scenarios (dropping in the same place)
  if (sameParent && destIndex === sourceIndex) {
    return rootBlocks;
  }
  
  // Additional no-op case: when moving to immediately after itself in same container
  // (e.g., moving from index 0 to index 1 in same container)
  if (sameParent && destIndex === sourceIndex + 1) {
    return rootBlocks;
  }

  // Find destination container *before* mutation
  const { container: destContainer } = findParent(clone, destParentId);
  if (!destContainer) {
    console.error("Destination not found", { destParentId, destIndex });
    return rootBlocks;
  }

  // Now, perform the move
  sourceContainer.splice(sourceIndex, 1);

  let targetIndex = destIndex;
  if (sameParent && destIndex > sourceIndex) {
    targetIndex = destIndex - 1;
  }
  if (targetIndex < 0) targetIndex = 0;
  if (targetIndex > destContainer.length) targetIndex = destContainer.length;

  destContainer.splice(targetIndex, 0, movedBlock);

  return clone;
}

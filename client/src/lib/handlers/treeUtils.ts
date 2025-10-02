
import type { BlockConfig } from '@shared/schema';
import { blockRegistry, getDefaultBlock as getDefaultBlockExport } from '@/components/PageBuilder/blocks';

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
  const id = crypto.randomUUID();
  const def = blockRegistry[type];
  if (!def) return { blocks: rootBlocks };
  const newBlock = {
    id,
    type,
    content: (() => {
      const content = structuredClone(def.defaultContent ?? {});
      if (type === 'core/columns' && content && Array.isArray(content.columns)) {
        content.columns = content.columns.map((col: any, i: number) => ({
          ...col,
          id: `${id}-col-${i + 1}`,
          children: Array.isArray(col?.children) ? col.children : [],
        }));
      }
      return content;
    })(),
    styles: {
      padding: '20px',
      margin: '0px',
      contentAlignHorizontal: 'left',
      contentAlignVertical: 'top',
      ...def.defaultStyles,
    },
    settings: {},
    children: def.isContainer ? [] : undefined,
  } as BlockConfig;
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

    // Do not fallback to root when not found; signal unknown parent
    return { container: [] as BlockConfig[], parentBlock: null };
}


export function moveExistingBlock(rootBlocks: BlockConfig[], sourceParentId: string | null, sourceIndex: number, destParentId: string | null, destIndex: number): BlockConfig[] {
  const clone = structuredClone(rootBlocks) as BlockConfig[];

  const { container: sourceContainer, parentBlock: sourceParent } = findParent(clone, sourceParentId);
  if ((sourceParentId !== null && !sourceParent) || !sourceContainer || sourceIndex < 0 || sourceIndex >= sourceContainer.length) {
    console.error("Source not found", { sourceParentId, sourceIndex });
    return rootBlocks;
  }

  const movedBlock = sourceContainer[sourceIndex];
  if (!movedBlock) {
    return rootBlocks;
  }

  // Prevent moving a block into itself or its descendants (including column containers)
  function containsIdInSubtree(node: BlockConfig, targetId: string): boolean {
    if (node.id === targetId) return true;
    if (node.type === 'core/columns' && (node as any).content?.columns) {
      const columns = (node as any).content.columns;
      for (const column of columns) {
        if (column.id === targetId) return true;
        if (Array.isArray(column.children)) {
          for (const child of column.children) {
            if (containsIdInSubtree(child, targetId)) return true;
          }
        }
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (containsIdInSubtree(child, targetId)) return true;
      }
    }
    return false;
  }

  if (destParentId !== null && containsIdInSubtree(movedBlock, destParentId)) {
    console.error("Cannot move a block into itself or its own descendants.");
    return rootBlocks;
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

  // Now, perform the move by first removing from source
  sourceContainer.splice(sourceIndex, 1);

  // Find destination container after mutation, because the source removal can affect indices
  const { container: destContainer, parentBlock: destParent } = findParent(clone, destParentId);
  if ((destParentId !== null && !destParent) || !destContainer) {
    console.error("Destination not found", { destParentId, destIndex });
    return rootBlocks;
  }

  let targetIndex = destIndex;
  if (sameParent && destIndex > sourceIndex) {
    targetIndex = destIndex - 1;
  }
  if (targetIndex < 0 || Number.isNaN(targetIndex)) targetIndex = 0;
  if (targetIndex > destContainer.length) targetIndex = destContainer.length;

  destContainer.splice(targetIndex, 0, movedBlock);

  return clone;
}

// Legacy deep utilities expected by legacy tests
export function findBlockDeep(rootBlocks: BlockConfig[], targetId: string): { found: boolean; block: BlockConfig; path: number[] } | null {
  function dfs(list: BlockConfig[], path: number[]): { block: BlockConfig; path: number[] } | null {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const nextPath = path.concat(i);
      if (b.id === targetId) return { block: b, path: nextPath };

      // Search within standard children
      if (Array.isArray(b.children)) {
        const res = dfs(b.children, nextPath);
        if (res) return res;
      }

      // Additionally search within columns children if present
      if (b.type === 'core/columns' && (b as any).content?.columns) {
        const columns = (b as any).content.columns as Array<{ children?: BlockConfig[] }>;
        for (const col of columns) {
          if (Array.isArray(col.children)) {
            const res = dfs(col.children, nextPath);
            if (res) return res;
          }
        }
      }
    }
    return null;
  }
  const found = dfs(rootBlocks, []);
  if (!found) return null;
  return { found: true, block: found.block, path: found.path };
}

export function updateBlockDeep(rootBlocks: BlockConfig[], targetId: string, updates: Partial<BlockConfig>): { found: boolean; next: BlockConfig[] } {
  let found = false;
  function walk(list: BlockConfig[]): BlockConfig[] {
    let mutated = false;
    const next = list.map((b) => {
      if (b.id === targetId) {
        found = true;
        mutated = true;
        return { ...b, ...updates };
      }

      let updatedChild = b.children;
      if (Array.isArray(b.children)) {
        const childNext = walk(b.children);
        if (childNext !== b.children) {
          mutated = true;
          updatedChild = childNext;
        }
      }

      // Also process columns children if present
      let updatedBlock: BlockConfig = b;
      if (b.type === 'core/columns' && (b as any).content?.columns) {
        const columns = (b as any).content.columns as Array<{ children?: BlockConfig[] }>;
        let columnsMutated = false;
        const nextColumns = columns.map((col) => {
          if (Array.isArray(col.children)) {
            const childNext = walk(col.children);
            if (childNext !== col.children) {
              columnsMutated = true;
              return { ...col, children: childNext };
            }
          }
          return col;
        });
        if (columnsMutated) {
          mutated = true;
          updatedBlock = { ...b, content: { ...(b as any).content, columns: nextColumns } } as any;
          if (updatedChild !== b.children) {
            updatedBlock = { ...updatedBlock, children: updatedChild };
          }
          return updatedBlock;
        }
      }

      if (updatedChild !== b.children) {
        mutated = true;
        return { ...b, children: updatedChild };
      }
      return b;
    });
    return mutated ? next : list;
  }
  const next = walk(rootBlocks);
  return { found, next };
}

export function deleteBlockDeep(rootBlocks: BlockConfig[], targetId: string): { removed: boolean; found: boolean; next: BlockConfig[] } {
  let removed = false;
  function walk(list: BlockConfig[]): BlockConfig[] {
    let mutated = false;
    const filtered: BlockConfig[] = [];
    for (const b of list) {
      if (b.id === targetId) {
        removed = true;
        mutated = true;
        continue; // drop it
      }

      let nextBlock: BlockConfig = b;

      if (Array.isArray(b.children)) {
        const childNext = walk(b.children);
        if (childNext !== b.children) {
          mutated = true;
          nextBlock = { ...nextBlock, children: childNext };
        }
      }

      if (b.type === 'core/columns' && (b as any).content?.columns) {
        const columns = (b as any).content.columns as Array<{ children?: BlockConfig[] }>;
        let columnsMutated = false;
        const nextColumns = columns.map((col) => {
          if (Array.isArray(col.children)) {
            const childNext = walk(col.children);
            if (childNext !== col.children) {
              columnsMutated = true;
              return { ...col, children: childNext };
            }
          }
          return col;
        });
        if (columnsMutated) {
          mutated = true;
          nextBlock = { ...nextBlock, content: { ...(b as any).content, columns: nextColumns } } as any;
        }
      }

      filtered.push(nextBlock);
    }
    return mutated ? filtered : list;
  }
  const next = walk(rootBlocks);
  return { removed, found: removed, next };
}

export function duplicateBlockDeep(rootBlocks: BlockConfig[], targetId: string, generateBlockId: () => string): { found: boolean; next: BlockConfig[]; duplicatedId: string } {
  let duplicatedId: string = '';
  function remapIds(blk: BlockConfig): void {
    blk.id = generateBlockId();
    if (Array.isArray(blk.children)) blk.children.forEach(remapIds);

    // If block has columns children in content, remap within them as well
    if (blk.type === 'core/columns' && (blk as any).content?.columns) {
      const columns = (blk as any).content.columns as Array<{ children?: BlockConfig[] }>;
      for (const col of columns) {
        if (Array.isArray(col.children)) col.children.forEach(remapIds);
      }
    }
  }

  function walk(list: BlockConfig[]): { next: BlockConfig[]; found: boolean } {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.id === targetId) {
        const clone = structuredClone(b) as BlockConfig;
        remapIds(clone);
        duplicatedId = clone.id;
        const next = [...list];
        next.splice(i + 1, 0, clone);
        return { next, found: true };
      }

      if (Array.isArray(b.children)) {
        const childRes = walk(b.children);
        if (childRes.found) {
          const next = [...list];
          next[i] = { ...b, children: childRes.next };
          return { next, found: true };
        }
      }

      if (b.type === 'core/columns' && (b as any).content?.columns) {
        const columns = (b as any).content.columns as Array<{ children?: BlockConfig[] }>;
        let columnsMutated = false;
        const nextColumns = columns.map((col) => {
          if (Array.isArray(col.children)) {
            const childRes = walk(col.children);
            if (childRes.found) {
              columnsMutated = true;
              return { ...col, children: childRes.next };
            }
          }
          return col;
        });
        if (columnsMutated) {
          const next = [...list];
          next[i] = { ...b, content: { ...(b as any).content, columns: nextColumns } } as any;
          return { next, found: true };
        }
      }
    }
    return { next: list, found: false };
  }

  const { next, found } = walk(rootBlocks);
  return { found, next, duplicatedId };
}

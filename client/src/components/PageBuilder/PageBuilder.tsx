import { useState, useEffect, useCallback, useRef } from "react";
import type { BlockConfig, Page } from "@shared/schema-types";
import { DragDropContext } from "@/lib/dnd";
import type { DropResult as DndDropResult } from "@/lib/dnd";
import { generateBlockId } from "./utils";
import { useDragAndDropHandler } from "../../hooks/useDragAndDropHandler";
import { usePageSave } from "../../hooks/usePageSave";
import { useUndoRedo } from "../../hooks/useUndoRedo";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderTopBar } from "./BuilderTopBar";
import { BuilderCanvas } from "./BuilderCanvas";
import { blockRegistry } from "./blocks";
import { BlockActionsProvider } from "./BlockActionsContext";
import { savePageDraftWithHistory } from "@/lib/pageDraftStorage";
import {
	findBlock,
	updateBlockDeep,
	deleteBlockDeep,
	duplicateBlockDeep,
} from "@/lib/handlers/treeUtils";

function isDescendant(
	blocks: BlockConfig[],
	ancestorId: string,
	candidateId: string,
): boolean {
	const queue = [...blocks];
	while (queue.length) {
		const current = queue.shift()!;
		if (current.id === ancestorId) {
			return containsChild(current, candidateId);
		}
		if (Array.isArray(current.children)) {
			queue.push(...current.children);
		}
	}
	return false;
}

function containsChild(block: BlockConfig, targetId: string): boolean {
	if (!Array.isArray(block.children)) return false;
	for (const child of block.children) {
		if (child.id === targetId) return true;
		if (containsChild(child, targetId)) return true;
	}
	return false;
}

interface PageBuilderProps {
	post?: Page;
	template?: never;
	blocks?: BlockConfig[];
	onBlocksChange?: (blocks: BlockConfig[]) => void;
	onSave?: (updatedData: Page) => void;
	onPreview?: () => void;
	pageMeta?: {
		title?: string;
		slug?: string;
		status?: string;
		version?: number;
	};
	onPageMetaChange?: (meta: Partial<{ title: string; slug: string; status: string }>) => void;
}

export default function PageBuilder({
	post,
	template,
	blocks: propBlocks,
	onBlocksChange,
	onSave,
	onPreview,
	pageMeta,
	onPageMetaChange,
}: PageBuilderProps) {
	const data = post;
	const isTemplate = false;

	const initialBlocks =
		propBlocks ||
		(data
			? (isTemplate
					? ((data as any).blocks as BlockConfig[])
					: ((data as any).builderData as BlockConfig[])) || []
			: []);

	// Use undo/redo for blocks state
	const {
		currentState,
		pushState,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useUndoRedo<BlockConfig[]>(initialBlocks);
	const [blocks, setBlocks] = useState<BlockConfig[]>(currentState);

	useEffect(() => {
		setBlocks(currentState);
	}, [currentState]);

	const commitBlocks = useCallback(
		(next: BlockConfig[] | ((prev: BlockConfig[]) => BlockConfig[])) => {
			setBlocks((prev) => {
				const resolved =
					typeof next === "function" ? (next as (p: BlockConfig[]) => BlockConfig[])(prev) : next;
				if (resolved === prev) {
					return prev;
				}
				pushState(resolved);
				return resolved;
			});
		},
		[pushState],
	);

	const updateBlockPartial = useCallback(
		(blockId: string, updates: Partial<BlockConfig>) => {
			commitBlocks((prev) => {
				const { found, next } = updateBlockDeep(prev, blockId, updates);
				return found ? next : prev;
			});
		},
		[commitBlocks],
	);

	const handleBlockChange = useCallback(
		(updated: BlockConfig) => {
			commitBlocks((prev) => {
				const { found, next } = updateBlockDeep(prev, updated.id, updated);
				return found ? next : prev;
			});
		},
		[commitBlocks],
	);

	const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
	const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">(
		"desktop",
	);
	const [isPreviewMode, setIsPreviewMode] = useState(false);
	const [activeTab, setActiveTab] = useState<"blocks" | "settings">("settings");
	const [hoverHighlight, setHoverHighlight] = useState<
		"padding" | "margin" | null
	>(null);
	const [sidebarVisible, setSidebarVisible] = useState(true);

	// Store onBlocksChange in a ref to avoid infinite loops when parent re-renders
	const onBlocksChangeRef = useRef(onBlocksChange);
	useEffect(() => {
		onBlocksChangeRef.current = onBlocksChange;
	});

	// Notify parent of blocks changes without onBlocksChange in deps
	useEffect(() => {
		onBlocksChangeRef.current?.(blocks);
	}, [blocks]);

	const selectedBlock = selectedBlockId ? findBlock(blocks, selectedBlockId) : null;

	const saveMutation = usePageSave({ isTemplate, data, onSave, pageMeta });

	const handleSave = useCallback(() => {
		if (!isTemplate && data && "menuOrder" in data && data.id) {
			savePageDraftWithHistory(
				data.id as string,
				{
					...(data as any),
					blocks,
					updatedAt: new Date().toISOString(),
				} as any,
			);
		}
		saveMutation.mutate(blocks);
		onSave?.(data as any);
	}, [blocks, saveMutation, onSave, data]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMod = e.ctrlKey || e.metaKey;
			const key = e.key.toLowerCase();

			if (isMod && key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if (isMod && ((e.shiftKey && key === "z") || key === "y")) {
				e.preventDefault();
				redo();
			} else if (isMod && key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo, handleSave]);

	const setBlocksFromDnD = useCallback(
		(next: BlockConfig[]) => {
			commitBlocks(() => next);
		},
		[commitBlocks],
	);

	const { handleDragEnd } = useDragAndDropHandler(
		blocks,
		setBlocksFromDnD,
		setSelectedBlockId,
		setActiveTab,
	);

	const handleDuplicate = useCallback(
		(id: string) => {
			let newId: string | undefined;
			commitBlocks((prev) => {
				const { found, next, duplicatedId } = duplicateBlockDeep(prev, id, generateBlockId);
				if (!found) {
					return prev;
				}
				newId = duplicatedId || undefined;
				return next;
			});
			if (newId) {
				setSelectedBlockId(newId);
				setActiveTab("settings");
			}
		},
		[commitBlocks, setActiveTab],
	);

	const handleDelete = useCallback(
		(id: string) => {
			const shouldClearSelection =
				selectedBlockId === id ||
				(selectedBlockId != null &&
					isDescendant(blocks, id, selectedBlockId));

			commitBlocks((prev) => {
				const { next } = deleteBlockDeep(prev, id);
				return next;
			});

			if (shouldClearSelection) {
				setSelectedBlockId(null);
				setActiveTab("blocks");
			}
		},
		[blocks, commitBlocks, selectedBlockId, setActiveTab],
	);

	const toggleSidebar = () => {
		setSidebarVisible(!sidebarVisible);
	};

	return (
		<div className="flex h-full bg-gray-50">
			<BlockActionsProvider
				value={{
					selectedBlockId,
					onSelect: (id) => {
						setSelectedBlockId(id);
						setActiveTab("settings");
					},
					onDuplicate: handleDuplicate,
					onDelete: handleDelete,
					hoverHighlight,
				}}
			>
				<DragDropContext
					onDragEnd={(result: DndDropResult) => {
						console.log("[DND] PageBuilder onDragEnd (received)", result);
						return handleDragEnd(result as any);
					}}
					onDragStart={() => console.log("Drag started, id:", selectedBlockId)}
					renderOverlay={({ id }) => {
						// id may refer directly to block definition id (library drag) or block instance id (canvas drag)
						// Attempt to resolve instance id by checking current blocks mapping name
						let def = blockRegistry[id];
						if (!def) {
							const instance = blocks.find(b => b.id === id);
							if (instance) def = blockRegistry[instance.name];
						}
						return (
							<div style={{
								background: 'rgba(255,255,255,0.95)',
								border: '1px solid #e5e7eb',
								padding: '6px 10px',
								borderRadius: 0,
								boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
								color: '#374151',
								fontSize: 12,
								display: 'inline-flex',
								alignItems: 'center',
								gap: 6,
							}}>
								{def?.icon ? <def.icon className="w-4 h-4 text-gray-600" /> : null}
								<span style={{ opacity: 0.85 }}>{def?.label || id}</span>
							</div>
						);
					}}
				>
					{sidebarVisible && (
						<BuilderSidebar
							activeTab={activeTab}
							setActiveTab={setActiveTab}
							selectedBlock={selectedBlock}
							updateBlock={updateBlockPartial}
							setHoverHighlight={setHoverHighlight}
							sidebarVisible={sidebarVisible}
							onToggleSidebar={toggleSidebar}
							page={data}
							isTemplate={isTemplate}
							onPageUpdate={onSave}
						onPageMetaChange={onPageMetaChange}
						/>
					)}
					<div className="flex-1 flex flex-col">
						<BuilderTopBar
							data={data}
							isTemplate={isTemplate}
							deviceView={deviceView}
							setDeviceView={setDeviceView}
							blocks={blocks}
							sidebarVisible={sidebarVisible}
							onToggleSidebar={toggleSidebar}
							onSaveClick={handleSave}
							onUndo={undo}
							onRedo={redo}
							canUndo={canUndo}
							canRedo={canRedo}
						/>
						<BuilderCanvas
							blocks={blocks}
							deviceView={deviceView}
							selectedBlockId={selectedBlockId}
							isPreviewMode={isPreviewMode}
							duplicateBlock={handleDuplicate}
							deleteBlock={handleDelete}
							hoverHighlight={hoverHighlight}
							onBlockChange={handleBlockChange}
						/>
					</div>
				</DragDropContext>
			</BlockActionsProvider>
		</div>
	);
}

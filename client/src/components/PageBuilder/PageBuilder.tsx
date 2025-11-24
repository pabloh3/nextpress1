import { useState, useEffect, useCallback, useRef } from "react";
import type { Post, Template, BlockConfig } from "@shared/schema-types";
import { DragDropContext } from "@/lib/dnd";
import type { DropResult as DndDropResult } from "@/lib/dnd";
import { generateBlockId } from "./utils";
import { useBlockManager } from "../../hooks/useBlockManager";
import { useDragAndDropHandler } from "../../hooks/useDragAndDropHandler";
import { usePageSave } from "../../hooks/usePageSave";
import { useUndoRedo } from "../../hooks/useUndoRedo";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderTopBar } from "./BuilderTopBar";
import { BuilderCanvas } from "./BuilderCanvas";
import { blockRegistry } from "./blocks";
import { BlockActionsProvider } from "./BlockActionsContext";

interface PageBuilderProps {
	post?: Post | Template;
	template?: Template;
	blocks?: BlockConfig[];
	onBlocksChange?: (blocks: BlockConfig[]) => void;
	onSave?: (updatedData: Post | Template) => void;
	onPreview?: () => void;
}

export default function PageBuilder({
	post,
	template,
	blocks: propBlocks,
	onBlocksChange,
	onSave,
	onPreview,
}: PageBuilderProps) {
	const data = template || post;
	const isTemplate = !!template;

	const initialBlocks =
		propBlocks ||
		(data
			? (isTemplate
					? ((data as any).blocks as BlockConfig[])
					: ((data as any).builderData as BlockConfig[])) || []
			: []);

	// Use undo/redo for blocks state
	const { currentState: blocks, pushState, undo, redo, canUndo, canRedo } = useUndoRedo<BlockConfig[]>(initialBlocks);

	// Block manager - sync with undo/redo state
	const {
		blocks: managerBlocks,
		setBlocks: setManagerBlocks,
		updateBlock: updateBlockInternal,
		duplicateBlock: duplicateBlockInternal,
		deleteBlock: deleteBlockInternal,
		findBlockById,
	} = useBlockManager(blocks);

	// Track if we're syncing to prevent loops
	const isSyncingRef = useRef(false);

	// Sync undo/redo state to manager when undo/redo happens
	useEffect(() => {
		if (!isSyncingRef.current && blocks !== managerBlocks) {
			isSyncingRef.current = true;
			setManagerBlocks(blocks);
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [blocks, managerBlocks, setManagerBlocks]);

	// Sync manager blocks to undo/redo when they change from user actions
	useEffect(() => {
		if (!isSyncingRef.current && managerBlocks !== blocks) {
			isSyncingRef.current = true;
			pushState(managerBlocks);
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [managerBlocks, blocks, pushState]);

	// Wrapped block operations that push to history
	const updateBlock = useCallback((blockId: string, updates: Partial<BlockConfig>) => {
		const result = updateBlockInternal(blockId, updates);
		// State will be pushed via useEffect watching blocks
		return result;
	}, [updateBlockInternal]);

	const duplicateBlock = useCallback((blockId: string, generateBlockId: () => string) => {
		const result = duplicateBlockInternal(blockId, generateBlockId);
		// State will be pushed via useEffect watching blocks
		return result;
	}, [duplicateBlockInternal]);

	const deleteBlock = useCallback((blockId: string) => {
		const result = deleteBlockInternal(blockId);
		// State will be pushed via useEffect watching blocks
		return result;
	}, [deleteBlockInternal]);

	// Wrapped setBlocks for drag/drop - pushes to history
	const setBlocks = useCallback((newBlocks: BlockConfig[] | ((prev: BlockConfig[]) => BlockConfig[])) => {
		if (typeof newBlocks === 'function') {
			setManagerBlocks((prev: BlockConfig[]) => {
				const next = newBlocks(prev);
				pushState(next);
				return next;
			});
		} else {
			setManagerBlocks(newBlocks);
			pushState(newBlocks);
		}
	}, [setManagerBlocks, pushState]);

	// Keyboard shortcuts for undo/redo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'Z')) {
				e.preventDefault();
				redo();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [undo, redo]);

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

	// Track if update is from props to prevent infinite loop
	const isUpdatingFromPropsRef = useRef(false);
	const prevPropBlocksRef = useRef<BlockConfig[] | undefined>(propBlocks);

	// Only sync propBlocks if they're actually different (prevent infinite loop)
	useEffect(() => {
		if (propBlocks && JSON.stringify(propBlocks) !== JSON.stringify(prevPropBlocksRef.current)) {
			prevPropBlocksRef.current = propBlocks;
			if (JSON.stringify(propBlocks) !== JSON.stringify(managerBlocks)) {
				isUpdatingFromPropsRef.current = true;
				setManagerBlocks(propBlocks);
				// Reset flag after state update
				setTimeout(() => {
					isUpdatingFromPropsRef.current = false;
				}, 0);
			}
		}
	}, [propBlocks, managerBlocks, setManagerBlocks]);

	// Only call onBlocksChange if blocks actually changed and not from props update
	const prevBlocksRef = useRef<BlockConfig[]>(managerBlocks);
	useEffect(() => {
		if (!isUpdatingFromPropsRef.current && JSON.stringify(prevBlocksRef.current) !== JSON.stringify(managerBlocks)) {
			prevBlocksRef.current = managerBlocks;
			onBlocksChange?.(managerBlocks);
		}
	}, [managerBlocks, onBlocksChange]);

	const selectedBlock = selectedBlockId ? findBlockById(selectedBlockId) : null;

	const saveMutation = usePageSave({ isTemplate, data, onSave });

	const { handleDragEnd } = useDragAndDropHandler(
		managerBlocks,
		setBlocks,
		setSelectedBlockId,
		setActiveTab,
	);

	const handleDuplicate = useCallback(
		(id: string) => {
			const res = duplicateBlock(id, generateBlockId);
			const newId = (res.data as any)?.newId;
			if (newId) {
				setSelectedBlockId(newId);
				setActiveTab("settings");
			}
		},
		[duplicateBlock],
	);

	const handleDelete = useCallback(
		(id: string) => {
			deleteBlock(id);
			if (selectedBlockId === id) {
				setSelectedBlockId(null);
			}
		},
		[deleteBlock, selectedBlockId],
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
							const instance = managerBlocks.find(b => b.id === id);
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
							updateBlock={updateBlock}
							setHoverHighlight={setHoverHighlight}
							sidebarVisible={sidebarVisible}
							onToggleSidebar={toggleSidebar}
							page={data}
							isTemplate={isTemplate}
							onPageUpdate={onSave}
						/>
					)}
					<div className="flex-1 flex flex-col">
						<BuilderTopBar
							data={data}
							isTemplate={isTemplate}
							deviceView={deviceView}
							setDeviceView={setDeviceView}
							blocks={managerBlocks}
							sidebarVisible={sidebarVisible}
							onToggleSidebar={toggleSidebar}
							onSaveClick={() => {
								saveMutation.mutate(managerBlocks);
								onSave?.(data as any);
							}}
						/>
						<BuilderCanvas
							blocks={managerBlocks}
							deviceView={deviceView}
							selectedBlockId={selectedBlockId}
							isPreviewMode={isPreviewMode}
							duplicateBlock={handleDuplicate}
							deleteBlock={handleDelete}
							hoverHighlight={hoverHighlight}
						/>
					</div>
				</DragDropContext>
			</BlockActionsProvider>
		</div>
	);
}

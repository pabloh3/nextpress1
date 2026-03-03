import React, { useState } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Image as ImageIcon, Settings, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

export type PostFeaturedImageContent = {
  url?: string;
  alt?: string;
  caption?: string;
  objectFit?: "cover" | "contain" | "fill";
  aspectRatio?: string;
  className?: string;
};

const DEFAULT_CONTENT: PostFeaturedImageContent = {
  url: "",
  alt: "Featured image",
  caption: "",
  objectFit: "cover",
  aspectRatio: "16/9",
  className: "",
};

// Shared inline-input styles used in the editor overlay / placeholder
const urlInputStyle: React.CSSProperties = {
  flex: 1, padding: "6px 10px", fontSize: "0.8rem",
  border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
};
const setButtonStyle: React.CSSProperties = {
  padding: "6px 12px", fontSize: "0.8rem", fontWeight: 500,
  backgroundColor: "#3b82f6", color: "#fff", border: "none",
  borderRadius: "6px", cursor: "pointer",
};
const urlRowStyle: React.CSSProperties = {
  display: "flex", gap: "6px", padding: "0 16px", width: "100%", maxWidth: "400px",
};

// ============================================================================
// URL INPUT ROW — reused in placeholder and hover overlay
// ============================================================================

/** Inline URL input + "Set" button used inside the renderer */
function UrlInputRow({ value, onChange, onApply, placeholder, dark }: {
  value: string; onChange: (v: string) => void; onApply: () => void;
  placeholder: string; dark?: boolean;
}) {
  return (
    <div style={urlRowStyle}>
      <input
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onApply()}
        placeholder={placeholder}
        style={dark
          ? { ...urlInputStyle, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }
          : urlInputStyle}
      />
      <button type="button" onClick={onApply} style={setButtonStyle}>Set</button>
    </div>
  );
}

// ============================================================================
// RENDERER
// ============================================================================

interface RendererProps {
  content: PostFeaturedImageContent;
  styles?: React.CSSProperties;
  isEditor?: boolean;
  onChangeUrl?: (url: string) => void;
}

/**
 * Renders the featured image or a dashed placeholder when no URL is set.
 * In editor mode an overlay with URL input appears on hover (or inline for empty state).
 */
function PostFeaturedImageRenderer({ content, styles, isEditor = false, onChangeUrl }: RendererProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editUrl, setEditUrl] = useState("");

  const { url = "", alt = "Featured image", caption = "", objectFit = "cover", aspectRatio = "16/9", className = "" } = content ?? {};

  const wrapperClass = ["wp-block-post-featured-image", className].filter(Boolean).join(" ");

  const handleApply = () => {
    if (onChangeUrl && editUrl.trim()) { onChangeUrl(editUrl.trim()); setEditUrl(""); }
  };

  // Empty state — placeholder with dashed border
  if (!url) {
    return (
      <figure className={wrapperClass} style={styles}>
        <div style={{
          aspectRatio, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "8px", border: "2px dashed #d1d5db", borderRadius: "8px",
          backgroundColor: "#f9fafb", color: "#6b7280", cursor: isEditor ? "pointer" : "default", width: "100%",
        }}>
          <ImageIcon style={{ width: 32, height: 32, opacity: 0.5 }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Set Featured Image</span>
          {isEditor && (
            <div style={{ marginTop: 4 }}>
              <UrlInputRow value={editUrl} onChange={setEditUrl} onApply={handleApply} placeholder="Paste image URL..." />
            </div>
          )}
        </div>
      </figure>
    );
  }

  // Image present — render with optional editor hover overlay
  return (
    <figure className={wrapperClass} style={styles}>
      <div
        style={{ position: "relative", width: "100%", aspectRatio }}
        onMouseEnter={() => isEditor && setIsHovered(true)}
        onMouseLeave={() => isEditor && setIsHovered(false)}
      >
        <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit, borderRadius: "4px", display: "block" }} />

        {isEditor && isHovered && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "8px",
            backgroundColor: "rgba(0,0,0,0.55)", borderRadius: "4px",
          }}>
            <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600 }}>Change Image</span>
            <UrlInputRow value={editUrl} onChange={setEditUrl} onApply={handleApply} placeholder="Paste new image URL..." dark />
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="wp-element-caption" style={{ textAlign: "center", marginTop: "8px", color: "#6b7280", fontSize: "0.875rem" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PostFeaturedImageComponent({ value, onChange, isPreview }: BlockComponentProps) {
  const { content, setContent, styles } = useBlockState<PostFeaturedImageContent>({
    value, getDefaultContent: () => DEFAULT_CONTENT, onChange,
  });

  return (
    <PostFeaturedImageRenderer
      content={content} styles={styles} isEditor={!isPreview}
      onChangeUrl={(url) => setContent((prev) => ({ ...prev, url }))}
    />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

function PostFeaturedImageSettings({ block, onUpdate }: {
  block: BlockConfig; onUpdate?: (updates: Partial<BlockConfig>) => void;
}) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  const content = accessor
    ? (accessor.getContent() as PostFeaturedImageContent)
    : (block.content as PostFeaturedImageContent) || DEFAULT_CONTENT;

  /** Merges partial updates into current content state */
  const updateContent = (updates: Partial<PostFeaturedImageContent>) => {
    if (accessor) {
      const current = accessor.getContent() as PostFeaturedImageContent;
      accessor.setContent({ ...current, ...updates });
      setUpdateTrigger((n) => n + 1);
    } else if (onUpdate) {
      onUpdate({ content: { ...block.content, ...updates } as BlockContent });
    }
  };

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Image" icon={ImageIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fi-url">Image URL</Label>
            <Input id="fi-url" value={content?.url || ""} onChange={(e) => updateContent({ url: e.target.value })} placeholder="https://example.com/image.jpg" className="h-9" />
          </div>
          <div>
            <Label htmlFor="fi-alt">Alt Text</Label>
            <Input id="fi-alt" value={content?.alt || ""} onChange={(e) => updateContent({ alt: e.target.value })} placeholder="Describe the image" className="h-9" />
          </div>
          <div>
            <Label htmlFor="fi-caption">Caption</Label>
            <Input id="fi-caption" value={content?.caption || ""} onChange={(e) => updateContent({ caption: e.target.value })} placeholder="Optional caption" className="h-9" />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Display" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fi-object-fit">Object Fit</Label>
            <Select value={content?.objectFit || "cover"} onValueChange={(v) => updateContent({ objectFit: v as PostFeaturedImageContent["objectFit"] })}>
              <SelectTrigger id="fi-object-fit" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fi-aspect-ratio">Aspect Ratio</Label>
            <Select value={content?.aspectRatio || "16/9"} onValueChange={(v) => updateContent({ aspectRatio: v })}>
              <SelectTrigger id="fi-aspect-ratio" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="16/9">16 : 9</SelectItem>
                <SelectItem value="4/3">4 : 3</SelectItem>
                <SelectItem value="1/1">1 : 1</SelectItem>
                <SelectItem value="3/2">3 : 2</SelectItem>
                <SelectItem value="21/9">21 : 9</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fi-class">Additional CSS Class(es)</Label>
            <Input id="fi-class" value={content?.className || ""} onChange={(e) => updateContent({ className: e.target.value })} placeholder="e.g. custom-featured" className="h-9" />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER
// ============================================================================

function LegacyRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <PostFeaturedImageRenderer
      content={(block.content as PostFeaturedImageContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const PostFeaturedImageBlock: BlockDefinition = {
  id: "post/featured-image",
  label: "Featured Image",
  icon: ImageIcon,
  description: "Display and set the post featured image",
  category: "post",
  defaultContent: { ...DEFAULT_CONTENT },
  defaultStyles: { width: "100%" },
  component: PostFeaturedImageComponent,
  renderer: LegacyRenderer,
  settings: PostFeaturedImageSettings,
  hasSettings: true,
};

export default PostFeaturedImageBlock;

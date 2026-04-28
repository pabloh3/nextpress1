import type { CSSProperties, JSX, ReactNode } from "react";
import { generateBlockAnimationCSS, getEntryAnimationAttributes } from "@shared/animation-utils";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import { generateBlockModifierCSS, resolveTokenMap } from "@/lib/tailwind-tokens";

type PublicBlockRendererProps = {
  block: BlockConfig;
};

type BlockRenderer = (block: BlockConfig, styles: CSSProperties) => ReactNode;

type TextContent = Extract<BlockContent, { kind: "text" }> & {
  align?: CSSProperties["textAlign"];
  anchor?: string;
  className?: string;
};

type MediaContent = Extract<BlockContent, { kind: "media" }> & {
  align?: string;
  className?: string;
  href?: string;
  linkDestination?: "none" | "media" | "attachment" | "custom";
  linkTarget?: "_self" | "_blank";
  rel?: string;
  sizeSlug?: string;
  target?: string;
  title?: string;
};

type ButtonsData = {
  buttons?: Array<{
    id?: string;
    text?: string;
    url?: string;
    linkTarget?: "_self" | "_blank";
    rel?: string;
    title?: string;
    className?: string;
  }>;
  className?: string;
  layout?: string;
  orientation?: "horizontal" | "vertical";
};

const HEADING_FONT_SIZES: Record<number, string> = {
  1: "2.5rem",
  2: "2rem",
  3: "1.75rem",
  4: "1.5rem",
  5: "1.25rem",
  6: "1rem",
};

const HEADING_FONT_WEIGHTS: Record<number, string> = {
  1: "800",
  2: "700",
  3: "700",
  4: "600",
  5: "600",
  6: "600",
};

const publicBlockRenderers: Record<string, BlockRenderer> = {
  "core/audio": renderAudioBlock,
  "core/button": renderButtonBlock,
  "core/buttons": renderButtonsBlock,
  "core/code": renderCodeBlock,
  "core/cover": renderCoverBlock,
  "core/divider": renderDividerBlock,
  "core/gallery": renderGalleryBlock,
  "core/group": renderGroupBlock,
  "core/heading": renderHeadingBlock,
  "core/html": renderHtmlBlock,
  "core/image": renderImageBlock,
  "core/list": renderListBlock,
  "core/markdown": renderMarkdownBlock,
  "core/media-text": renderMediaTextBlock,
  "core/paragraph": renderParagraphBlock,
  "core/preformatted": renderPreformattedBlock,
  "core/pullquote": renderPullquoteBlock,
  "core/quote": renderQuoteBlock,
  "core/separator": renderSeparatorBlock,
  "core/spacer": renderSpacerBlock,
  "core/table": renderTableBlock,
  "core/video": renderVideoBlock,
  "post/excerpt": renderParagraphBlock,
  "post/featured-image": renderImageBlock,
  "post/title": renderHeadingBlock,
};

/**
 * Renders published page-builder blocks without importing editor modules.
 * This keeps public routes fast and avoids loading drag/drop, settings panels, and pickers.
 */
export default function PublicBlockRenderer({ block }: PublicBlockRendererProps) {
  const { styles, css } = getPublicBlockStyles(block);
  const renderer = publicBlockRenderers[block.name] ?? renderUnsupportedBlock;
  const animationAttributes = block.other?.animation?.entry
    ? getEntryAnimationAttributes(block.other.animation.entry)
    : {};

  return (
    <div className="block-container">
      <div
        className={`block-${block.id}`}
        style={{ width: styles.width || "100%" }}
        {...animationAttributes}
      >
        {renderer(block, styles)}
      </div>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
    </div>
  );
}

function getPublicBlockStyles(block: BlockConfig): {
  css: string;
  styles: CSSProperties;
} {
  const tokenResolution = block.other?.tokenMap
    ? resolveTokenMap(block.other.tokenMap, block.other?.units || {})
    : null;

  const styles: CSSProperties = {
    ...block.styles,
    ...(tokenResolution?.style || {}),
  };

  const modifierCSS = tokenResolution?.modifierEntries?.length
    ? generateBlockModifierCSS(block.id, tokenResolution.modifierEntries)
    : "";

  const animationCSS = block.other?.animation
    ? generateBlockAnimationCSS(block.id, block.other.animation)
    : "";

  return {
    css: [modifierCSS, animationCSS].filter(Boolean).join("\n"),
    styles,
  };
}

function renderNestedBlocks(blocks: BlockConfig[] | undefined) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return blocks.map((child) => <PublicBlockRenderer key={child.id} block={child} />);
}

function getTextContent(content: BlockContent): string {
  return content?.kind === "text" ? content.value : "";
}

function getStructuredData(content: BlockContent): Record<string, unknown> {
  return content?.kind === "structured" && content.data ? content.data : {};
}

function renderHeadingBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as TextContent | undefined;
  const level = typeof content?.level === "number" ? content.level : 2;
  const safeLevel = Math.min(6, Math.max(1, level));
  const Tag = `h${safeLevel}` as keyof JSX.IntrinsicElements;
  const className = [
    "wp-block-heading",
    content?.textAlign ? `has-text-align-${content.textAlign}` : "",
    content?.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      id={content?.anchor}
      className={className}
      style={{
        fontSize: HEADING_FONT_SIZES[safeLevel],
        fontWeight: HEADING_FONT_WEIGHTS[safeLevel],
        ...styles,
      }}
    >
      {getTextContent(block.content)}
    </Tag>
  );
}

function renderParagraphBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as TextContent | undefined;
  const align = styles.textAlign || content?.textAlign || content?.align;
  const className = [
    "wp-block-paragraph",
    align ? `has-text-align-${align}` : "",
    content?.dropCap ? "has-drop-cap" : "",
    content?.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p
      id={content?.anchor}
      className={className}
      style={{
        ...styles,
        ...(align ? { textAlign: align } : {}),
      }}
    >
      {getTextContent(block.content)}
    </p>
  );
}

function renderButtonBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as TextContent | undefined;
  const url = content?.url || "#";
  const target = content?.linkTarget || content?.target;
  const className = ["wp-block-button", content?.className || ""].filter(Boolean).join(" ");

  return (
    <div className={className} role="presentation">
      <a
        className="wp-block-button__link wp-element-button"
        href={url}
        target={target}
        rel={content?.rel}
        title={content?.title}
        style={{
          ...styles,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: styles.justifyContent || "center",
        }}
      >
        {getTextContent(block.content)}
      </a>
    </div>
  );
}

function renderButtonsBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content) as ButtonsData;
  const buttons = Array.isArray(data.buttons) ? data.buttons : [];
  const orientation = data.orientation || "horizontal";
  const layout = data.layout || "flex-start";
  const className = [
    "wp-block-buttons",
    orientation === "vertical" ? "is-vertical" : "",
    layout === "center" ? "is-content-justification-center" : "",
    layout === "right" ? "is-content-justification-right" : "",
    layout === "space-between" ? "is-content-justification-space-between" : "",
    data.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={{
        ...styles,
        alignItems: orientation === "vertical" ? "flex-start" : "center",
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        flexWrap: "wrap",
        gap: "0.5em",
        justifyContent: layout,
      }}
    >
      {buttons.map((button, index) => (
        <div
          key={button.id || `${button.url}-${index}`}
          className={["wp-block-button", button.className || ""].filter(Boolean).join(" ")}
        >
          <a
            className="wp-block-button__link"
            href={button.url || "#"}
            target={button.linkTarget}
            rel={button.rel}
            title={button.title}
            style={{
              backgroundColor: "#007cba",
              border: "none",
              borderRadius: "4px",
              color: "#ffffff",
              display: "inline-block",
              fontSize: "16px",
              fontWeight: "600",
              padding: "12px 24px",
              textDecoration: "none",
            }}
          >
            {button.text || "Button"}
          </a>
        </div>
      ))}
    </div>
  );
}

function renderImageBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as MediaContent | undefined;
  const url = content?.kind === "media" && content.mediaType === "image" ? content.url : "";
  if (!url) return null;

  const linkHref =
    content?.linkDestination === "custom" && content.href
      ? content.href
      : content?.linkDestination === "media"
        ? url
        : undefined;

  const image = (
    <img src={url} alt={content?.alt || ""} style={{ ...styles }} draggable={false} />
  );

  return (
    <figure
      className={[
        "wp-block-image",
        content?.sizeSlug ? `size-${content.sizeSlug}` : "",
        content?.align ? `align${content.align}` : "",
        styles.width || styles.height ? "is-resized" : "",
        content?.className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ margin: styles.margin, padding: styles.padding }}
    >
      {linkHref ? (
        <a href={linkHref} target={content?.linkTarget || content?.target} rel={content?.rel} title={content?.title}>
          {image}
        </a>
      ) : (
        image
      )}
      {content?.caption ? <figcaption className="wp-element-caption">{content.caption}</figcaption> : null}
    </figure>
  );
}

function renderVideoBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as MediaContent | undefined;
  const url = content?.kind === "media" && content.mediaType === "video" ? content.url : "";
  if (!url) return null;

  return (
    <figure className="wp-block-video" style={{ margin: styles.margin }}>
      <video controls src={url} style={{ ...styles, width: styles.width || "100%" }}>
        <track kind="captions" />
      </video>
      {content?.caption ? <figcaption className="wp-element-caption">{content.caption}</figcaption> : null}
    </figure>
  );
}

function renderAudioBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as MediaContent | undefined;
  const url = content?.kind === "media" && content.mediaType === "audio" ? content.url : "";
  if (!url) return null;

  return (
    <figure className="wp-block-audio" style={{ margin: styles.margin }}>
      <audio controls src={url} style={{ width: styles.width || "100%" }}>
        <track kind="captions" />
      </audio>
      {content?.caption ? <figcaption className="wp-element-caption">{content.caption}</figcaption> : null}
    </figure>
  );
}

function renderSpacerBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const height = typeof data.height === "string" ? data.height : styles.height || "40px";
  return <div aria-hidden="true" className="wp-block-spacer" style={{ ...styles, height }} />;
}

function renderSeparatorBlock(_block: BlockConfig, styles: CSSProperties) {
  return <hr className="wp-block-separator" style={styles} />;
}

function renderDividerBlock(_block: BlockConfig, styles: CSSProperties) {
  return <hr className="wp-block-divider" style={styles} />;
}

function renderGroupBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content as Record<string, unknown> | undefined;
  const tagName = typeof content?.tagName === "string" ? content.tagName : "div";
  const Tag = tagName as keyof JSX.IntrinsicElements;
  const display = typeof content?.display === "string" ? content.display : "block";
  const gap = typeof content?.gap === "string" ? content.gap : "0px";

  return (
    <Tag
      className={["wp-block-group", typeof content?.className === "string" ? content.className : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...styles,
        alignItems: content?.alignItems as CSSProperties["alignItems"],
        display,
        flexDirection: content?.flexDirection as CSSProperties["flexDirection"],
        flexWrap: content?.flexWrap as CSSProperties["flexWrap"],
        gap,
        gridTemplateColumns: content?.gridTemplateColumns as CSSProperties["gridTemplateColumns"],
        justifyContent: content?.justifyContent as CSSProperties["justifyContent"],
        overflow: content?.overflow as CSSProperties["overflow"],
      }}
    >
      <div className="wp-block-group__inner-container">{renderNestedBlocks(block.children)}</div>
    </Tag>
  );
}

function renderCoverBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const imageUrl = typeof data.url === "string" ? data.url : "";
  const overlay = typeof data.overlayColor === "string" ? data.overlayColor : "rgba(0,0,0,0.35)";

  return (
    <div
      className="wp-block-cover"
      style={{
        ...styles,
        backgroundImage: imageUrl ? `linear-gradient(${overlay}, ${overlay}), url(${imageUrl})` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        minHeight: styles.minHeight || "320px",
      }}
    >
      <div className="wp-block-cover__inner-container">{renderNestedBlocks(block.children)}</div>
    </div>
  );
}

function renderGalleryBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const images = Array.isArray(data.images) ? data.images : [];

  return (
    <figure
      className="wp-block-gallery"
      style={{
        ...styles,
        display: "grid",
        gap: styles.gap || "16px",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      {images.map((image, index) => {
        if (!image || typeof image !== "object") return null;
        const item = image as { alt?: string; caption?: string; id?: string; url?: string };
        if (!item.url) return null;
        return (
          <figure key={item.id || `${item.url}-${index}`} className="wp-block-image">
            <img src={item.url} alt={item.alt || ""} />
            {item.caption ? <figcaption className="wp-element-caption">{item.caption}</figcaption> : null}
          </figure>
        );
      })}
    </figure>
  );
}

function renderListBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const items = Array.isArray(data.items) ? data.items.map(String) : [getTextContent(block.content)].filter(Boolean);
  const ordered = Boolean(data.ordered);
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className="wp-block-list" style={styles}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </Tag>
  );
}

function renderQuoteBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const text = typeof data.text === "string" ? data.text : getTextContent(block.content);
  const citation = typeof data.citation === "string" ? data.citation : "";

  return (
    <blockquote className="wp-block-quote" style={styles}>
      <p>{text}</p>
      {citation ? <cite>{citation}</cite> : null}
    </blockquote>
  );
}

function renderPullquoteBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const text = typeof data.text === "string" ? data.text : getTextContent(block.content);
  const citation = typeof data.citation === "string" ? data.citation : "";

  return (
    <figure className="wp-block-pullquote" style={styles}>
      <blockquote>
        <p>{text}</p>
        {citation ? <cite>{citation}</cite> : null}
      </blockquote>
    </figure>
  );
}

function renderMediaTextBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const mediaUrl = typeof data.mediaUrl === "string" ? data.mediaUrl : "";
  const mediaAlt = typeof data.mediaAlt === "string" ? data.mediaAlt : "";

  return (
    <div
      className="wp-block-media-text"
      style={{
        ...styles,
        display: "grid",
        gap: styles.gap || "24px",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {mediaUrl ? <img src={mediaUrl} alt={mediaAlt} /> : null}
      <div className="wp-block-media-text__content">{renderNestedBlocks(block.children)}</div>
    </div>
  );
}

function renderCodeBlock(block: BlockConfig, styles: CSSProperties) {
  return (
    <pre className="wp-block-code" style={styles}>
      <code>{getTextContent(block.content)}</code>
    </pre>
  );
}

function renderPreformattedBlock(block: BlockConfig, styles: CSSProperties) {
  return (
    <pre className="wp-block-preformatted" style={styles}>
      {getTextContent(block.content)}
    </pre>
  );
}

function renderMarkdownBlock(block: BlockConfig, styles: CSSProperties) {
  return (
    <div className="wp-block-markdown whitespace-pre-wrap" style={styles}>
      {getTextContent(block.content)}
    </div>
  );
}

function renderHtmlBlock(block: BlockConfig, styles: CSSProperties) {
  const content = block.content;
  const html = content?.kind === "html" ? content.value : "";
  return <div className="wp-block-html" style={styles} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderTableBlock(block: BlockConfig, styles: CSSProperties) {
  const data = getStructuredData(block.content);
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <figure className="wp-block-table" style={styles}>
      <table>
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row) ? row : [];
            return (
              <tr key={`row-${rowIndex}`}>
                {cells.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>{String(cell)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}

function renderUnsupportedBlock(block: BlockConfig, styles: CSSProperties) {
  return (
    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500" style={styles}>
      {block.label || block.name} block is not available in the public renderer yet.
    </div>
  );
}

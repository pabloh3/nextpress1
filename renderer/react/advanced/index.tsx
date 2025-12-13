import * as React from "react";
import type { BlockData } from "../block-types";

/**
 * Quote Block Component
 * Renders a blockquote with optional citation
 */
export function QuoteBlock(props: BlockData) {
  const { content, citation, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/quote" }
  >;

  const mergedClassName = ["wp-block-quote", className]
    .filter(Boolean)
    .join(" ");

  return (
    <blockquote
      className={mergedClassName || undefined}
      style={style}
      {...attributes}
    >
      <p>{content || ""}</p>
      {citation && <cite>{citation}</cite>}
    </blockquote>
  );
}

/**
 * List Block Component
 * Renders an ordered or unordered list
 */
export function ListBlock(props: BlockData) {
  const { content, ordered, start, className, style, attributes } =
    props as Extract<BlockData, { blockName: "core/list" }>;

  const mergedClassName = ["wp-block-list", className]
    .filter(Boolean)
    .join(" ");

  // Parse content into list items (simple line break splitting)
  const items = content
    ? content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  if (ordered) {
    return (
      <ol
        className={mergedClassName || undefined}
        style={style}
        start={start}
        {...attributes}
      >
        {items.map((item, index) => {
          // Use item content + index as key for stability
          const itemKey = `${item}-${index}`;
          return <li key={itemKey}>{item}</li>;
        })}
      </ol>
    );
  }

  return (
    <ul className={mergedClassName || undefined} style={style} {...attributes}>
      {items.map((item, index) => {
        // Use item content + index as key for stability
        const itemKey = `${item}-${index}`;
        return <li key={itemKey}>{item}</li>;
      })}
    </ul>
  );
}

/**
 * Code Block Component
 * Renders code with optional language syntax highlighting class
 */
export function CodeBlock(props: BlockData) {
  const { content, language, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/code" }
  >;

  const mergedClassName = [
    "wp-block-code",
    language ? `language-${language}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <pre className={mergedClassName || undefined} style={style} {...attributes}>
      <code>{content || ""}</code>
    </pre>
  );
}

/**
 * HTML Block Component
 * Renders raw HTML content
 */
export function HtmlBlock(props: BlockData) {
  const { content, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/html" }
  >;

  const mergedClassName = ["wp-block-html", className]
    .filter(Boolean)
    .join(" ");

  // HTML blocks intentionally use dangerouslySetInnerHTML to render raw HTML
  // In production, content should be sanitized before reaching this point
  // eslint-disable-next-line react/no-danger
  return (
    <div
      className={mergedClassName || undefined}
      style={style}
      {...attributes}
      dangerouslySetInnerHTML={{ __html: content || "" }}
    />
  );
}

/**
 * Pullquote Block Component
 * Renders a pullquote (highlighted quote) with optional citation
 */
export function PullquoteBlock(props: BlockData) {
  const { content, citation, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/pullquote" }
  >;

  const mergedClassName = ["wp-block-pullquote", className]
    .filter(Boolean)
    .join(" ");

  return (
    <figure
      className={mergedClassName || undefined}
      style={style}
      {...attributes}
    >
      <blockquote>
        <p>{content || ""}</p>
      </blockquote>
      {citation && <cite>{citation}</cite>}
    </figure>
  );
}

/**
 * Preformatted Block Component
 * Renders preformatted text (preserves whitespace)
 */
export function PreformattedBlock(props: BlockData) {
  const { content, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/preformatted" }
  >;

  const mergedClassName = ["wp-block-preformatted", className]
    .filter(Boolean)
    .join(" ");

  return (
    <pre className={mergedClassName || undefined} style={style} {...attributes}>
      {content || ""}
    </pre>
  );
}

/**
 * Table Block Component
 * Renders an HTML table with headers and rows
 */
export function TableBlock(props: BlockData) {
  const { headers, rows, hasFixedLayout, className, style, attributes } =
    props as Extract<BlockData, { blockName: "core/table" }>;

  const mergedClassName = [
    "wp-block-table",
    hasFixedLayout ? "is-style-fixed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const tableStyle: React.CSSProperties = {
    ...style,
    ...(hasFixedLayout ? { tableLayout: "fixed" } : {}),
  };

  return (
    <figure
      className={mergedClassName || undefined}
      style={style}
      {...attributes}
    >
      <table style={tableStyle}>
        {headers && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => {
                // Use header content + index as key for stability
                const headerKey = `${header}-${index}`;
                return <th key={headerKey}>{header}</th>;
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, rowIndex) => {
              // Use row content + index as key for stability
              const rowKey = `${row.join("-")}-${rowIndex}`;
              return (
                <tr key={rowKey}>
                  {row.map((cell, cellIndex) => {
                    const cellKey = `${cell}-${cellIndex}`;
                    return <td key={cellKey}>{cell}</td>;
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={headers?.length || 1}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </figure>
  );
}

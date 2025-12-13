import * as React from "react";
import type { BlockData } from "../block-types";

/**
 * Heading Block Component
 * Renders heading elements (h1-h6) with optional styling
 */
export function HeadingBlock(props: BlockData) {
  const { content, level, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/heading" }
  >;

  const Tag = `h${level || 2}` as keyof JSX.IntrinsicElements;
  const mergedClassName = ["wp-block-heading", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={mergedClassName || undefined} style={style} {...attributes}>
      {content || ""}
    </Tag>
  );
}

/**
 * Paragraph Block Component
 * Renders paragraph text with optional styling and drop cap
 */
export function ParagraphBlock(props: BlockData) {
  const { content, textAlign, dropCap, className, style, attributes } =
    props as Extract<BlockData, { blockName: "core/paragraph" }>;

  const mergedClassName = [
    "wp-block-paragraph",
    textAlign ? `has-text-align-${textAlign}` : "",
    dropCap ? "has-drop-cap" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(textAlign ? { textAlign } : {}),
  };

  return (
    <p
      className={mergedClassName || undefined}
      style={mergedStyle}
      {...attributes}
    >
      {content || ""}
    </p>
  );
}

/**
 * Button Block Component
 * Renders a single button with link support
 * Uses semantic HTML: <a> for links, <button> for actions without links
 */
export function ButtonBlock(props: BlockData) {
  const { content, link, target, variant, className, style, attributes } =
    props as Extract<BlockData, { blockName: "core/button" }>;

  const buttonClassName = [
    "wp-block-button__link",
    variant ? `is-style-${variant}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // If there's a link, use semantic <a> tag (no wrapper div)
  if (link && link !== "#" && link.trim() !== "") {
    return (
      <a
        href={link}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={buttonClassName || undefined}
        style={style}
        {...attributes}
      >
        {content || ""}
      </a>
    );
  }

  // If no link, use semantic <button> element (no wrapper div)
  return (
    <button
      type="button"
      className={buttonClassName || undefined}
      style={style}
      {...attributes}
    >
      {content || ""}
    </button>
  );
}

/**
 * Buttons Block Component
 * Renders multiple buttons in a group
 * Uses semantic HTML: <a> for links, <button> for actions without links
 */
export function ButtonsBlock(props: BlockData) {
  const buttonsConfig = props as Extract<
    BlockData,
    { blockName: "core/buttons" }
  >;
  const { buttons, className, style, attributes } = buttonsConfig;

  const mergedClassName = ["wp-block-buttons", className]
    .filter(Boolean)
    .join(" ");

  if (!buttons || buttons.length === 0) {
    return (
      <div
        className={mergedClassName || undefined}
        style={style}
        {...attributes}
      >
        {/* Empty buttons container */}
      </div>
    );
  }

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      {buttons.map((button, index) => {
        // Buttons from DB have: text, url, linkTarget (not content, link, target)
        const buttonText = button.text || "";
        const buttonUrl = button.url || "";
        const buttonTarget = button.linkTarget || button.target;
        const hasLink =
          buttonUrl && buttonUrl !== "#" && buttonUrl.trim() !== "";
        // Use button id or text + index as key
        const buttonKey = button.id || `${buttonText}-${index}`;

        return (
          <div key={buttonKey} className="wp-block-button">
            {hasLink ? (
              <a
                href={buttonUrl}
                target={buttonTarget}
                rel={
                  buttonTarget === "_blank"
                    ? button.rel || "noopener noreferrer"
                    : button.rel
                }
                title={button.title}
                className={`wp-block-button__link ${
                  button.className || ""
                }`.trim()}
              >
                {buttonText}
              </a>
            ) : (
              <button
                type="button"
                title={button.title}
                className={`wp-block-button__link ${
                  button.className || ""
                }`.trim()}
              >
                {buttonText}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

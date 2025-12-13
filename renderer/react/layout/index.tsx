import * as React from "react";
import type { BlockData } from "../block-types";
import { BLOCK_COMPONENTS } from "../block-components";

/**
 * Columns Block Component
 * Renders a flexible column layout with nested children
 */
export function ColumnsBlock(props: BlockData) {
  const {
    gap,
    verticalAlignment,
    horizontalAlignment,
    direction,
    columnLayout,
    className,
    style,
    attributes,
    children,
  } = props as Extract<BlockData, { blockName: "core/columns" }>;

  const mergedClassName = [
    "wp-block-columns",
    verticalAlignment ? `is-vertically-aligned-${verticalAlignment}` : "",
    horizontalAlignment ? `is-horizontally-aligned-${horizontalAlignment}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const columnsStyle: React.CSSProperties = {
    ...style,
    display: "flex",
    flexDirection: direction || "row",
    ...(gap ? { gap } : {}),
    ...(verticalAlignment ? { alignItems: verticalAlignment } : {}),
    ...(horizontalAlignment ? { justifyContent: horizontalAlignment } : {}),
  };

  // Helper to render a single child block
  const renderChild = (child: BlockData): React.ReactNode => {
    const ChildComponent = BLOCK_COMPONENTS[child.blockName];
    if (!ChildComponent) {
      return null;
    }
    return <ChildComponent {...child} />;
  };

  // If columnLayout is provided, use it to structure columns
  if (columnLayout && columnLayout.length > 0) {
    return (
      <div
        className={mergedClassName || undefined}
        style={columnsStyle}
        {...attributes}
      >
        {columnLayout.map((column, index) => {
          const columnChildren =
            children?.filter((child) =>
              column.blockIds?.includes(
                (child as BlockData & { id?: string }).id || ""
              )
            ) || [];

          // Use columnId + index as key for stability
          const columnKey = column.columnId || `column-${index}`;
          return (
            <div
              key={columnKey}
              className="wp-block-column"
              style={{
                width: column.width || "auto",
                flex: column.width ? "none" : "1",
              }}
            >
              {columnChildren.map((child, childIndex) => {
                // Use blockName + childIndex as key for stability
                const childKey = `${child.blockName}-${childIndex}`;
                return (
                  <React.Fragment key={childKey}>
                    {renderChild(child)}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: render children directly if no columnLayout
  if (children && children.length > 0) {
    return (
      <div
        className={mergedClassName || undefined}
        style={columnsStyle}
        {...attributes}
      >
        {children.map((child, index) => {
          // Use blockName + index as key for stability
          const childKey = `${child.blockName}-${index}`;
          return (
            <div
              key={childKey}
              className="wp-block-column"
              style={{ flex: "1" }}
            >
              {renderChild(child)}
            </div>
          );
        })}
      </div>
    );
  }

  // Empty columns container
  return (
    <div
      className={mergedClassName || undefined}
      style={columnsStyle}
      {...attributes}
    >
      {/* Empty columns */}
    </div>
  );
}

/**
 * Group Block Component
 * Renders a container group with nested children
 */
export function GroupBlock(props: BlockData) {
  const { layout, tagName, className, style, attributes, children } =
    props as Extract<BlockData, { blockName: "core/group" }>;

  const Tag = (tagName || "div") as keyof JSX.IntrinsicElements;

  const mergedClassName = [
    "wp-block-group",
    layout ? `is-layout-${layout}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Helper to render a single child block
  const renderChild = (child: BlockData): React.ReactNode => {
    const ChildComponent = BLOCK_COMPONENTS[child.blockName];
    if (!ChildComponent) {
      return null;
    }
    return <ChildComponent {...child} />;
  };

  if (children && children.length > 0) {
    return (
      <Tag
        className={mergedClassName || undefined}
        style={style}
        {...attributes}
      >
        {children.map((child, index) => {
          // Use blockName + index as key for stability
          const childKey = `${child.blockName}-${index}`;
          return (
            <React.Fragment key={childKey}>{renderChild(child)}</React.Fragment>
          );
        })}
      </Tag>
    );
  }

  return (
    <Tag className={mergedClassName || undefined} style={style} {...attributes}>
      {/* Empty group */}
    </Tag>
  );
}

/**
 * Spacer Block Component
 * Renders a vertical spacer with configurable height
 */
export function SpacerBlock(props: BlockData) {
  const { height, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/spacer" }
  >;

  const mergedClassName = ["wp-block-spacer", className]
    .filter(Boolean)
    .join(" ");

  const spacerStyle: React.CSSProperties = {
    ...style,
    height: height || "40px",
  };

  return (
    <div
      className={mergedClassName || undefined}
      style={spacerStyle}
      {...attributes}
    />
  );
}

/**
 * Separator Block Component
 * Renders a horizontal separator line
 */
export function SeparatorBlock(props: BlockData) {
  const {
    style: separatorStyle,
    className,
    style,
    attributes,
  } = props as Extract<BlockData, { blockName: "core/separator" }>;

  const mergedClassName = [
    "wp-block-separator",
    separatorStyle ? `is-style-${separatorStyle}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <hr
      className={mergedClassName || undefined}
      style={style}
      {...attributes}
    />
  );
}

/**
 * Divider Block Component
 * Renders a divider line with optional styling
 */
export function DividerBlock(props: BlockData) {
  const {
    style: dividerStyle,
    className,
    style,
    attributes,
  } = props as Extract<BlockData, { blockName: "core/divider" }>;

  const mergedClassName = [
    "wp-block-divider",
    dividerStyle ? `is-style-${dividerStyle}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dividerElementStyle: React.CSSProperties = {
    ...style,
    borderStyle: dividerStyle || "solid",
  };

  return (
    <hr
      className={mergedClassName || undefined}
      style={dividerElementStyle}
      {...attributes}
    />
  );
}

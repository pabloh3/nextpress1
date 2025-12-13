import * as React from "react";
import type { BlockData } from "../block-types";

/**
 * Image Block Component
 * Renders an image with optional caption, width, height, and object-fit
 */
export function ImageBlock(props: BlockData) {
  const {
    url,
    alt,
    caption,
    width,
    height,
    objectFit,
    className,
    style,
    attributes,
    href,
    linkTarget,
    linkDestination,
    rel,
    title,
  } = props as Extract<BlockData, { blockName: "core/image" }> & {
    href?: string;
    linkTarget?: string;
    linkDestination?: string;
    rel?: string;
    title?: string;
  };

  if (!url) {
    return null;
  }

  const mergedClassName = ["wp-block-image", className]
    .filter(Boolean)
    .join(" ");

  const imageStyle: React.CSSProperties = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(objectFit ? { objectFit } : {}),
  };

  const image = <img src={url} alt={alt || ""} style={imageStyle} />;

  // Determine link href based on linkDestination
  const linkHref =
    linkDestination === "custom" && href
      ? href
      : linkDestination === "media"
      ? url
      : undefined;

  // Wrap image in <a> if there's a link
  const imageContent = linkHref ? (
    <a
      href={linkHref}
      target={linkTarget}
      rel={linkTarget === "_blank" ? rel || "noopener noreferrer" : rel}
      title={title}
    >
      {image}
    </a>
  ) : (
    image
  );

  if (caption) {
    return (
      <figure
        className={mergedClassName || undefined}
        style={style}
        {...attributes}
      >
        {imageContent}
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      {imageContent}
    </div>
  );
}

/**
 * Video Block Component
 * Renders a video element with optional controls, autoplay, loop, and poster
 */
export function VideoBlock(props: BlockData) {
  const {
    url,
    alt,
    caption,
    autoplay,
    loop,
    controls,
    poster,
    className,
    style,
    attributes,
  } = props as Extract<BlockData, { blockName: "core/video" }>;

  if (!url) {
    return null;
  }

  const mergedClassName = ["wp-block-video", className]
    .filter(Boolean)
    .join(" ");

  const video = (
    <video
      src={url}
      controls={controls !== false}
      autoPlay={autoplay}
      loop={loop}
      poster={poster}
      style={style}
      {...attributes}
    >
      {alt && <track kind="captions" label={alt} />}
    </video>
  );

  if (caption) {
    return (
      <figure className={mergedClassName || undefined}>
        {video}
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      {video}
    </div>
  );
}

/**
 * Audio Block Component
 * Renders an audio element with optional controls, autoplay, and loop
 */
export function AudioBlock(props: BlockData) {
  const {
    url,
    alt,
    caption,
    autoplay,
    loop,
    controls,
    className,
    style,
    attributes,
  } = props as Extract<BlockData, { blockName: "core/audio" }>;

  if (!url) {
    return null;
  }

  const mergedClassName = ["wp-block-audio", className]
    .filter(Boolean)
    .join(" ");

  const audio = (
    <audio
      src={url}
      controls={controls !== false}
      autoPlay={autoplay}
      loop={loop}
      style={style}
      {...attributes}
    >
      {alt && <track kind="captions" label={alt} />}
    </audio>
  );

  if (caption) {
    return (
      <figure className={mergedClassName || undefined}>
        {audio}
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      {audio}
    </div>
  );
}

/**
 * Gallery Block Component
 * Renders a grid of images
 */
export function GalleryBlock(props: BlockData) {
  const { images, columns, className, style, attributes } = props as Extract<
    BlockData,
    { blockName: "core/gallery" }
  >;

  if (!images || images.length === 0) {
    return null;
  }

  const mergedClassName = [
    "wp-block-gallery",
    columns ? `columns-${columns}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const galleryStyle: React.CSSProperties = {
    ...style,
    ...(columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}),
  };

  return (
    <figure
      className={mergedClassName || undefined}
      style={galleryStyle}
      {...attributes}
    >
      {images.map((image, index) => {
        // Use image URL + index as key for stability
        const imageKey = `${image.url || ""}-${index}`;
        return (
          <figure key={imageKey} className="wp-block-gallery-item">
            <img src={image.url} alt={image.alt || ""} />
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        );
      })}
    </figure>
  );
}

/**
 * Cover Block Component
 * Renders an image with overlay and optional text content
 */
export function CoverBlock(props: BlockData) {
  const {
    url,
    alt,
    caption,
    overlayColor,
    overlayOpacity,
    minHeight,
    className,
    style,
    attributes,
    children,
  } = props as Extract<BlockData, { blockName: "core/cover" }>;

  if (!url) {
    return null;
  }

  const mergedClassName = ["wp-block-cover", className]
    .filter(Boolean)
    .join(" ");

  const coverStyle: React.CSSProperties = {
    ...style,
    ...(minHeight ? { minHeight } : {}),
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: overlayColor || "rgba(0, 0, 0, 0.5)",
    opacity: overlayOpacity !== undefined ? overlayOpacity : 0.5,
  };

  return (
    <div
      className={mergedClassName || undefined}
      style={coverStyle}
      {...attributes}
    >
      <div style={overlayStyle} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children && children.length > 0 ? (
          // Render children blocks if present
          <div>{/* Children will be rendered by parent renderer */}</div>
        ) : (
          <div>{caption || alt || ""}</div>
        )}
      </div>
    </div>
  );
}

/**
 * File Block Component
 * Renders a file download link
 */
export function FileBlock(props: BlockData) {
  const { url, filename, fileSize, className, style, attributes } =
    props as Extract<BlockData, { blockName: "core/file" }>;

  if (!url) {
    return null;
  }

  const mergedClassName = ["wp-block-file", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      <a href={url} download={filename} className="wp-block-file__link">
        {filename || url.split("/").pop() || "Download"}
      </a>
      {fileSize && <span className="wp-block-file__size">({fileSize})</span>}
    </div>
  );
}

/**
 * Media Text Block Component
 * Renders media (image/video) alongside text content
 */
export function MediaTextBlock(props: BlockData) {
  const {
    url,
    alt,
    caption,
    mediaPosition,
    verticalAlignment,
    className,
    style,
    attributes,
    children,
    href,
    linkTarget,
    rel,
    title,
  } = props as Extract<BlockData, { blockName: "core/media-text" }> & {
    href?: string;
    linkTarget?: string;
    rel?: string;
    title?: string;
  };

  if (!url) {
    return null;
  }

  const mergedClassName = [
    "wp-block-media-text",
    mediaPosition === "right" ? "has-media-on-the-right" : "",
    verticalAlignment ? `is-vertically-aligned-${verticalAlignment}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mediaStyle: React.CSSProperties = {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const mediaContent = (
    <>
      <img src={url} alt={alt || ""} style={{ display: "none" }} />
      {caption && <figcaption>{caption}</figcaption>}
    </>
  );

  // Wrap media in <a> if there's a link, otherwise use <figure>
  const mediaElement = href ? (
    <a
      href={href}
      target={linkTarget}
      rel={linkTarget === "_blank" ? rel || "noopener noreferrer" : rel}
      title={title}
      className="wp-block-media-text__media"
      style={mediaStyle}
    >
      {mediaContent}
    </a>
  ) : (
    <figure className="wp-block-media-text__media" style={mediaStyle}>
      {mediaContent}
    </figure>
  );

  return (
    <div className={mergedClassName || undefined} style={style} {...attributes}>
      {mediaElement}
      <div className="wp-block-media-text__content">
        {children && children.length > 0 ? (
          // Render children blocks if present
          <div>{/* Children will be rendered by parent renderer */}</div>
        ) : (
          <div>{/* Text content */}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Template system types for variables and conditional display logic.
 */

/** A single template variable definition */
export interface VariableDefinition {
  key: string;           // e.g., "title", "url", "name"
  label: string;         // Human-readable label: "Post Title"
  description: string;   // Tooltip description
  example?: string;      // Example value for preview
}

/** A namespace groups related variables together */
export interface VariableNamespace {
  name: string;          // e.g., "site", "post", "author"
  label: string;         // Human-readable: "Site", "Post", "Author"
  description: string;   // Namespace description
  variables: VariableDefinition[];
  resolve: (context: RenderContext) => Record<string, string>;
}

/** Context passed during template rendering */
export interface RenderContext {
  site?: {
    title?: string;
    url?: string;
    description?: string;
    language?: string;
    [key: string]: string | undefined;
  };
  post?: {
    id?: string;
    title?: string;
    slug?: string;
    date?: string;
    modifiedDate?: string;
    excerpt?: string;
    content?: string;
    author?: string;
    categories?: string[];
    tags?: string[];
    featuredImage?: string;
    url?: string;
    [key: string]: unknown;
  };
  page?: {
    id?: string;
    title?: string;
    slug?: string;
    url?: string;
    [key: string]: string | undefined;
  };
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
    bio?: string;
    url?: string;
    [key: string]: string | undefined;
  };
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    isLoggedIn?: boolean;
  };
  request?: {
    url?: string;
    path?: string;
    device?: "mobile" | "desktop" | "tablet";
    [key: string]: unknown;
  };
}

/** A single display condition */
export interface DisplayCondition {
  id: string;            // Unique ID for the condition row
  type: string;          // e.g., "is_home", "is_single", "post_in_category"
  operator: "is" | "is_not";
  value?: string;        // e.g., category slug, page slug, role name
  logic?: "and" | "or";  // How this condition combines with the previous one
}

/** Condition type definition for the UI */
export interface ConditionTypeDefinition {
  type: string;          // Machine key: "is_home"
  label: string;         // Human-readable: "Is Homepage"
  description: string;   // Tooltip description
  hasValue: boolean;     // Does this condition need a value input?
  valueType?: "text" | "select";  // Input type for the value
  valueOptions?: { value: string; label: string }[];  // Options for select type
  evaluate: (context: RenderContext, operator: "is" | "is_not", value?: string) => boolean;
}

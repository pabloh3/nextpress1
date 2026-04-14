/**
 * Condition evaluator — evaluates display conditions against a render context.
 * Supports both template-level and block-level conditions with AND/OR logic.
 */

import type { DisplayCondition, ConditionTypeDefinition, RenderContext } from "./types";

/** All available condition types */
const conditionTypes: ConditionTypeDefinition[] = [
  {
    type: "is_home",
    label: "Is Homepage",
    description: "Show on the site homepage",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = ctx.request?.path === "/" || ctx.request?.path === "";
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_single",
    label: "Is Single Post",
    description: "Show on individual post pages",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = !!ctx.post?.id && !ctx.page?.id;
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_page",
    label: "Is Page",
    description: "Show on page type content",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = !!ctx.page?.id;
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_archive",
    label: "Is Archive",
    description: "Show on archive or listing pages",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const path = ctx.request?.path ?? "";
      const result = path.includes("/category") || path.includes("/tag") || path.includes("/archive");
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_404",
    label: "Is 404 Page",
    description: "Show on not-found pages",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = ctx.request?.path === "/404";
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_logged_in",
    label: "User Is Logged In",
    description: "Show for authenticated users",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = !!ctx.user?.isLoggedIn;
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "is_logged_out",
    label: "User Is Logged Out",
    description: "Show for guest visitors",
    hasValue: false,
    evaluate: (ctx, operator) => {
      const result = !ctx.user?.isLoggedIn;
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "post_in_category",
    label: "Post In Category",
    description: "Show if the current post belongs to a specific category",
    hasValue: true,
    valueType: "text",
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const categories = (ctx.post?.categories as string[]) ?? [];
      const result = categories.some((cat) => cat.toLowerCase() === value.toLowerCase());
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "post_has_tag",
    label: "Post Has Tag",
    description: "Show if the current post has a specific tag",
    hasValue: true,
    valueType: "text",
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const tags = (ctx.post?.tags as string[]) ?? [];
      const result = tags.some((tag) => tag.toLowerCase() === value.toLowerCase());
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "page_slug",
    label: "Page Slug Is",
    description: "Show on a specific page by slug",
    hasValue: true,
    valueType: "text",
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const slug = ctx.page?.slug ?? ctx.post?.slug ?? "";
      const result = slug.toLowerCase() === value.toLowerCase();
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "url_contains",
    label: "URL Contains",
    description: "Show if the current URL contains a specific path",
    hasValue: true,
    valueType: "text",
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const url = ctx.request?.url ?? ctx.request?.path ?? "";
      const result = url.toLowerCase().includes(value.toLowerCase());
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "user_role",
    label: "User Has Role",
    description: "Show for users with a specific role",
    hasValue: true,
    valueType: "text",
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const role = ctx.user?.role ?? "";
      const result = role.toLowerCase() === value.toLowerCase();
      return operator === "is" ? result : !result;
    },
  },
  {
    type: "device_type",
    label: "Device Type",
    description: "Show on a specific device type",
    hasValue: true,
    valueType: "select",
    valueOptions: [
      { value: "mobile", label: "Mobile" },
      { value: "desktop", label: "Desktop" },
      { value: "tablet", label: "Tablet" },
    ],
    evaluate: (ctx, operator, value) => {
      if (!value) return operator === "is_not";
      const device = ctx.request?.device ?? "desktop";
      const result = device === value;
      return operator === "is" ? result : !result;
    },
  },
];

/**
 * Get all available condition type definitions.
 * @returns Array of condition type definitions
 */
export function getConditionTypes(): ConditionTypeDefinition[] {
  return conditionTypes;
}

/**
 * Get a specific condition type by its key.
 * @param type - The condition type key (e.g., "is_home")
 * @returns The condition type definition or undefined
 */
export function getConditionType(type: string): ConditionTypeDefinition | undefined {
  return conditionTypes.find((ct) => ct.type === type);
}

/**
 * Evaluate a single display condition against a render context.
 * @param condition - The condition to evaluate
 * @param context - The render context
 * @returns True if the condition passes
 */
export function evaluateCondition(
  condition: DisplayCondition,
  context: RenderContext,
): boolean {
  const def = getConditionType(condition.type);
  if (!def) {
    // Unknown condition type — default to showing content
    return true;
  }
  return def.evaluate(context, condition.operator, condition.value);
}

/**
 * Evaluate a list of display conditions with AND/OR logic.
 * Conditions are evaluated in order, combining results using the logic field.
 * @param conditions - Array of display conditions
 * @param context - The render context
 * @returns True if all conditions pass (respecting AND/OR logic)
 */
export function evaluateConditions(
  conditions: DisplayCondition[],
  context: RenderContext,
): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateCondition(conditions[0], context);

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, context);

    if (condition.logic === "or") {
      result = result || conditionResult;
    } else {
      // Default to AND
      result = result && conditionResult;
    }
  }

  return result;
}

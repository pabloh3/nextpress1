/**
 * Template system — variables, conditions, and rendering.
 */

// Types
export type {
  VariableDefinition,
  VariableNamespace,
  RenderContext,
  DisplayCondition,
  ConditionTypeDefinition,
} from "./types";

export type { TemplateBlock, RenderResult } from "./template-renderer";

// Variable system
export {
  getVariableNamespaces,
  getNamespace,
  resolveAllVariables,
} from "./variable-registry";

export {
  extractVariables,
  resolveVariables,
  hasVariables,
  getReferencedVariables,
} from "./variable-parser";

// Condition system
export {
  getConditionTypes,
  getConditionType,
  evaluateCondition,
  evaluateConditions,
} from "./condition-evaluator";

// Render context
export { buildRenderContext } from "./render-context";

// Renderer
export {
  renderTemplateBlocks,
  shouldRenderTemplate,
} from "./template-renderer";

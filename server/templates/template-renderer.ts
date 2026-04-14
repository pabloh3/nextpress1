/**
 * Template renderer — resolves variables and evaluates conditions for template blocks.
 * Integrates the variable parser, registry, and condition evaluator into a single
 * rendering pipeline.
 */

import type { RenderContext, DisplayCondition } from "./types";
import { resolveAllVariables } from "./variable-registry";
import { resolveVariables, hasVariables } from "./variable-parser";
import { evaluateConditions } from "./condition-evaluator";

/** A template block with optional display conditions */
export interface TemplateBlock {
  id: string;
  name: string;
  type: string;
  content?: unknown;
  settings?: {
    displayConditions?: DisplayCondition[];
    [key: string]: unknown;
  };
  children?: TemplateBlock[];
  [key: string]: unknown;
}

/** Result of rendering a template */
export interface RenderResult {
  blocks: TemplateBlock[];
  variablesResolved: number;
  conditionsEvaluated: number;
  blocksFiltered: number;
}

/**
 * Render template blocks by resolving variables and filtering by conditions.
 * @param blocks - The template blocks to render
 * @param context - The render context with site, post, page, author data
 * @returns Rendered blocks with variables resolved and conditions applied
 */
export function renderTemplateBlocks(
  blocks: TemplateBlock[],
  context: RenderContext,
): RenderResult {
  const variables = resolveAllVariables(context);
  let variablesResolved = 0;
  let conditionsEvaluated = 0;
  let blocksFiltered = 0;

  const renderedBlocks = blocks
    .map((block) => renderBlock(block, variables, context, { track: true }))
    .filter((result): result is NonNullable<typeof result> => {
      if (result === null) {
        blocksFiltered++;
        return false;
      }
      return true;
    });

  return {
    blocks: renderedBlocks,
    variablesResolved,
    conditionsEvaluated,
    blocksFiltered,
  };

  /**
   * Render a single block — resolve variables and check conditions.
   */
  function renderBlock(
    block: TemplateBlock,
    vars: Record<string, string>,
    ctx: RenderContext,
    opts: { track: boolean },
  ): TemplateBlock | null {
    // Check block-level display conditions
    const conditions = block.settings?.displayConditions;
    if (conditions && conditions.length > 0) {
      conditionsEvaluated++;
      if (!evaluateConditions(conditions, ctx)) {
        return null; // Block is hidden by conditions
      }
    }

    // Resolve variables in block content
    const resolvedBlock = { ...block };

    if (resolvedBlock.content && typeof resolvedBlock.content === "object") {
      resolvedBlock.content = resolveContentVariables(
        resolvedBlock.content as Record<string, unknown>,
        vars,
      );
      if (opts.track) variablesResolved++;
    }

    // Recursively render children
    if (resolvedBlock.children && resolvedBlock.children.length > 0) {
      resolvedBlock.children = resolvedBlock.children
        .map((child) => renderBlock(child, vars, ctx, { track: false }))
        .filter((child): child is TemplateBlock => child !== null);
    }

    return resolvedBlock;
  }
}

/**
 * Resolve variables in a content object (recursively handles nested values).
 * @param content - The content object to process
 * @param variables - Map of variable keys to resolved values
 * @returns Content object with all string values having variables resolved
 */
function resolveContentVariables(
  content: Record<string, unknown>,
  variables: Record<string, string>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(content)) {
    if (typeof value === "string" && hasVariables(value)) {
      resolved[key] = resolveVariables(value, variables);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveContentVariables(
        value as Record<string, unknown>,
        variables,
      );
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Check if a template should be rendered based on its display conditions.
 * @param templateSettings - The template's settings object
 * @param context - The render context
 * @returns True if the template should be rendered
 */
export function shouldRenderTemplate(
  templateSettings: { displayConditions?: DisplayCondition[]; [key: string]: unknown } | undefined | null,
  context: RenderContext,
): boolean {
  const conditions = templateSettings?.displayConditions;
  if (!conditions || conditions.length === 0) return true;
  return evaluateConditions(conditions, context);
}

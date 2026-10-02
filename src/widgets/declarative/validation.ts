/**
 * src/widgets/declarative/validation.ts
 *
 * Validation helpers with useful, actionable error messages for declarative widgets.
 */

import { z } from 'zod';
import {
  WidgetElement,
  WidgetElementSchema,
} from './elements';
import {
  WidgetLayoutDefinition,
  WidgetLayoutDefinitionSchema,
} from './layout';
import {
  DeclarativeWidgetDefinition,
  ParsedDeclarativeWidgetDefinition,
  DeclarativeWidgetDefinitionSchema,
} from './definition';

// ---------------------------------------------------------------------------
// Formatted Validation Error
// ---------------------------------------------------------------------------

export interface FormattedValidationError {
  /** Dot/bracket path to the invalid field, e.g. "layouts.small.root.children[0].content" */
  path: string;
  /** Clear human-readable error description */
  message: string;
  /** Zod error code */
  code: string;
  /** Helpful hint on how to fix the error */
  suggestion?: string;
}

export type ValidationResult<T> =
  | { success: true; data: T; errors?: never; errorSummary?: never }
  | { success: false; data?: never; errors: FormattedValidationError[]; errorSummary: string };

export class WidgetValidationError extends Error {
  readonly errors: FormattedValidationError[];

  constructor(message: string, errors: FormattedValidationError[]) {
    super(message);
    this.name = 'WidgetValidationError';
    this.errors = errors;
  }
}

// ---------------------------------------------------------------------------
// Error Formatting Utilities
// ---------------------------------------------------------------------------

/**
 * Converts a Zod path array into a standard dot-notation property path.
 * E.g. ['layouts', 'small', 'root', 'children', 0, 'content'] -> 'layouts.small.root.children[0].content'
 */
export function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(root)';

  return path.reduce<string>((acc, segment, idx) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    const str = String(segment);
    return idx === 0 ? str : `${acc}.${str}`;
  }, '');
}

/**
 * Generates contextual advice based on the path and error issue.
 */
function getSuggestion(issue: z.ZodIssue, pathStr: string): string | undefined {
  const lowerMsg = issue.message.toLowerCase();

  if (pathStr.includes('url') || lowerMsg.includes('url')) {
    return 'Provide a valid URL starting with http:// or https://.';
  }
  if (pathStr.includes('version') || lowerMsg.includes('semver')) {
    return 'Use a valid semantic version string such as "1.0.0" or "0.2.1".';
  }
  if (pathStr.includes('id') && lowerMsg.includes('lowercase')) {
    return 'Widget ID must contain only lowercase letters, numbers, hyphens, or underscores.';
  }
  if (pathStr.includes('defaultSize')) {
    return 'Ensure the selected defaultSize has a corresponding layout object defined in "layouts".';
  }
  if (pathStr.includes('supportedSizes')) {
    return 'Ensure all sizes listed in "supportedSizes" have a corresponding layout object in "layouts".';
  }
  if (pathStr.includes('direction')) {
    return 'Valid container directions are "column", "row", or "stack".';
  }
  if (pathStr.includes('thickness') || pathStr.includes('gap')) {
    return 'Value must be a non-negative number.';
  }
  return undefined;
}

/**
 * Transforms raw Zod errors into friendly, actionable diagnostic structures.
 */
export function formatZodError(error: z.ZodError): FormattedValidationError[] {
  return error.issues.map((issue) => {
    const pathStr = formatPath(issue.path);
    const suggestion = getSuggestion(issue, pathStr);

    return {
      path: pathStr,
      message: issue.message,
      code: String(issue.code),
      ...(suggestion ? { suggestion } : {}),
    };
  });
}

/**
 * Formats a list of validation errors into a human-readable summary block.
 */
export function formatErrorSummary(
  targetName: string,
  errors: FormattedValidationError[]
): string {
  const lines = [`${targetName} validation failed with ${errors.length} error(s):`];
  for (const err of errors) {
    const suggestionLine = err.suggestion ? ` (Hint: ${err.suggestion})` : '';
    lines.push(`  • [${err.path}] ${err.message}${suggestionLine}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validates an entire DeclarativeWidgetDefinition against the Zod schema.
 */
export function validateWidgetDefinition(
  data: unknown
): ValidationResult<ParsedDeclarativeWidgetDefinition> {
  const result = DeclarativeWidgetDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const formattedErrors = formatZodError(result.error);
  return {
    success: false,
    errors: formattedErrors,
    errorSummary: formatErrorSummary('DeclarativeWidgetDefinition', formattedErrors),
  };
}

/**
 * Asserts that a value is a valid DeclarativeWidgetDefinition, throwing WidgetValidationError if not.
 */
export function assertValidWidgetDefinition(
  data: unknown
): ParsedDeclarativeWidgetDefinition {
  const res = validateWidgetDefinition(data);
  if (!res.success) {
    throw new WidgetValidationError(res.errorSummary, res.errors);
  }
  return res.data;
}

/**
 * Validates a single layout tree definition against WidgetLayoutDefinitionSchema.
 */
export function validateWidgetLayout(
  data: unknown
): ValidationResult<WidgetLayoutDefinition> {
  const result = WidgetLayoutDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as WidgetLayoutDefinition };
  }
  const formattedErrors = formatZodError(result.error);
  return {
    success: false,
    errors: formattedErrors,
    errorSummary: formatErrorSummary('WidgetLayoutDefinition', formattedErrors),
  };
}

/**
 * Validates a single UI element (or recursive container) against WidgetElementSchema.
 */
export function validateWidgetElement(
  data: unknown
): ValidationResult<WidgetElement> {
  const result = WidgetElementSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as WidgetElement };
  }
  const formattedErrors = formatZodError(result.error);
  return {
    success: false,
    errors: formattedErrors,
    errorSummary: formatErrorSummary('WidgetElement', formattedErrors),
  };
}

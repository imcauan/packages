export type ValidationPath = Array<string | number>;

/**
 * Describes a single validation failure at a field path.
 */
export type ValidationIssue = {
  path: ValidationPath;
  code: string;
  message: string;
};

/**
 * The non-throwing result returned by `safeValidate`.
 */
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
      issues?: never;
      error?: never;
    }
  | {
      success: false;
      data?: never;
      issues: ValidationIssue[];
      error: ValidationError;
    };

/**
 * Error thrown by schemas when `validate` receives invalid input.
 */
export class ValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(issues.map(issue => issue.message).join(', '));
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

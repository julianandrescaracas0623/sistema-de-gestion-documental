import type { ZodError } from "zod";

/**
 * Zod validation utilities
 */

/**
 * Extracts the first error message from a ZodError
 * Useful for displaying validation errors in forms
 */
export function firstZodIssueMessage(error: ZodError): string {
	const issue = error.issues[0];
	if (issue === undefined) {
		return "Validation error";
	}

	if (issue.message.length > 0) {
		return issue.message;
	}

	// Fallback for edge cases without message
	return `${issue.path.join(".")} is invalid`;
}

/**
 * Formats ZodError into a record of field -> message
 * Useful for showing per-field errors in forms
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const issue of error.issues) {
		const path = issue.path.join(".");
		if (path.length > 0) {
			errors[path] = issue.message;
		}
	}

	return errors;
}

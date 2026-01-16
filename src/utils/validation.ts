// src/utils/validation.ts

/**
 * Validates if the input is a non-empty string.
 * @param {string} input - The input string to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
export function validateNonEmptyString(input: string): boolean {
    return typeof input === 'string' && input.trim().length > 0;
}

/**
 * Sanitizes input by trimming whitespace and escaping special characters.
 * @param {string} input - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
export function sanitizeInput(input: string): string {
    return input.trim().replace(/[&<"'`=\/]/g, '\$&');
}
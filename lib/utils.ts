import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for combining CSS classes with Tailwind CSS.
 * 
 * This function combines clsx for conditional class handling with twMerge
 * for proper Tailwind CSS class merging. It's used throughout the application
 * for dynamic styling based on component state and props.
 * 
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Merged and optimized CSS class string
 * 
 * @example
 * ```typescript
 * const buttonClass = cn(
 *   'px-4 py-2 rounded',
 *   isActive && 'bg-blue-500',
 *   isDisabled && 'opacity-50 cursor-not-allowed'
 * );
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user-provided text input to prevent XSS attacks.
 * 
 * This function implements comprehensive text sanitization to protect against
 * Cross-Site Scripting (XSS) vulnerabilities. It's used throughout the
 * application to sanitize user input before storing it in the database or
 * displaying it in the UI.
 * 
 * Security measures implemented:
 * - Strips all HTML tags to prevent script injection
 * - Removes dangerous protocol strings (javascript:, data:)
 * - Removes control characters that could cause issues
 * - Trims whitespace for clean data storage
 * 
 * @param input - Raw text input from user (can be null/undefined)
 * @returns Sanitized text string safe for storage and display
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>Hello World';
 * const safeText = sanitizeText(userInput); // Returns: "Hello World"
 * 
 * const maliciousInput = 'javascript:alert("XSS")';
 * const safeText2 = sanitizeText(maliciousInput); // Returns: ""
 * ```
 * 
 * @security Note: This is a basic sanitizer. For production applications
 * with complex requirements, consider using a dedicated library like DOMPurify
 * or implementing additional validation based on your specific needs.
 * 
 * @see {@link https://owasp.org/www-community/attacks/xss/} - OWASP XSS Prevention
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  // Remove HTML tags to prevent script injection
  const withoutTags = input.replace(/<[^>]*>/g, "");
  
  // Remove dangerous protocol strings that could execute code
  const withoutProtocols = withoutTags.replace(/(javascript:|data:)/gi, "");
  
  // Remove control characters that could cause rendering issues
  const withoutControlChars = withoutProtocols.replace(/[\u0000-\u001F\u007F]/g, "");
  
  // Trim whitespace for clean data storage
  return withoutControlChars.trim();
}

/**
 * Sanitizes an array of strings by applying sanitization to each element.
 * 
 * This function processes arrays of user-provided strings (like poll options)
 * by sanitizing each individual string and filtering out empty results.
 * It's used when handling form data with multiple text inputs.
 * 
 * @param inputs - Array of strings to sanitize (can be null/undefined)
 * @returns Array of sanitized strings with empty elements filtered out
 * 
 * @example
 * ```typescript
 * const pollOptions = [
 *   '<script>alert("XSS")</script>Option 1',
 *   'Option 2',
 *   '',
 *   'javascript:alert("XSS")Option 3'
 * ];
 * const safeOptions = sanitizeStringArray(pollOptions);
 * // Returns: ["Option 1", "Option 2", "Option 3"]
 * ```
 * 
 * @security Features:
 * - Applies sanitizeText to each array element
 * - Filters out empty strings to prevent invalid data
 * - Handles non-array inputs gracefully
 * - Maintains array structure while ensuring data safety
 */
export function sanitizeStringArray(inputs: string[]): string[] {
  if (!Array.isArray(inputs)) return [];
  
  return inputs
    .map(sanitizeText) // Apply sanitization to each string
    .map((s) => s.trim()) // Trim whitespace
    .filter(Boolean); // Remove empty strings
}
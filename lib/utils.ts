import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Basic text sanitizer to mitigate XSS from user-provided strings
// - Strips HTML tags
// - Removes javascript:/data: protocol strings
// - Removes control characters
// - Trims surrounding whitespace
export function sanitizeText(input: string): string {
  if (!input) return "";
  const withoutTags = input.replace(/<[^>]*>/g, "");
  const withoutProtocols = withoutTags.replace(/(javascript:|data:)/gi, "");
  const withoutControlChars = withoutProtocols.replace(/[\u0000-\u001F\u007F]/g, "");
  return withoutControlChars.trim();
}

export function sanitizeStringArray(inputs: string[]): string[] {
  if (!Array.isArray(inputs)) return [];
  return inputs.map(sanitizeText).map((s) => s.trim()).filter(Boolean);
}
import type { WindowLike } from 'dompurify';

export type EditorialContentMode = 'text' | 'html';

export const EDITORIAL_ALLOWED_TAGS: readonly string[];
export const EDITORIAL_ALLOWED_ATTRIBUTES: readonly string[];
export function normalizeEditorialContent(
  content: string | null | undefined,
  contentMode: EditorialContentMode,
): { mode: EditorialContentMode; content: string };
export function sanitizeEditorialHtml(content: string, windowLike?: WindowLike): string;

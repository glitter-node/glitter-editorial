import createDOMPurify from 'dompurify';

export const EDITORIAL_ALLOWED_TAGS = Object.freeze([
  'p', 'br', 'h2', 'h3', 'h4', 'blockquote', 'strong', 'em', 'b', 'i',
  'ul', 'ol', 'li', 'a', 'code', 'pre', 'figure', 'figcaption', 'img',
]);

export const EDITORIAL_ALLOWED_ATTRIBUTES = Object.freeze(['href', 'src', 'alt', 'title']);

// Publication links are deliberately narrower than DOMPurify defaults:
// absolute HTTP(S), root/dot-relative paths, query strings, and fragments only.
const EDITORIAL_ALLOWED_URI = /^(?:(?:https?):|\/(?!\/)|\.{1,2}\/|#|\?)/i;

export const normalizeEditorialContent = (content, contentMode) => ({
  mode: contentMode === 'html' ? 'html' : 'text',
  content: typeof content === 'string' ? content : '',
});

export const sanitizeEditorialHtml = (
  content,
  windowLike = typeof window !== 'undefined' ? window : undefined,
) => {
  if (typeof content !== 'string' || content.trim() === '' || !windowLike) return '';

  const purifier = createDOMPurify(windowLike);
  if (!purifier.isSupported) return '';

  return purifier.sanitize(content, {
    ALLOWED_TAGS: [...EDITORIAL_ALLOWED_TAGS],
    ALLOWED_ATTR: [...EDITORIAL_ALLOWED_ATTRIBUTES],
    ALLOWED_URI_REGEXP: EDITORIAL_ALLOWED_URI,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true,
  });
};

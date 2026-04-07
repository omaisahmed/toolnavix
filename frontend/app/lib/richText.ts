function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function normalizeCodeBlockEntities(value: string): string {
  return value.replace(/<(pre|code)([^>]*)>([\s\S]*?)<\/\1>/gi, (_match, tag, attrs, content) => {
    // Keep one level of HTML entity encoding for code blocks so <tag> displays literally.
    const normalizedContent = content
      .replace(/&amp;lt;/gi, '&lt;')
      .replace(/&amp;gt;/gi, '&gt;')
      .replace(/&amp;quot;/gi, '&quot;')
      .replace(/&amp;#39;/gi, '&#39;')
      .replace(/&amp;amp;/gi, '&amp;');

    return `<${tag}${attrs}>${normalizedContent}</${tag}>`;
  });
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';

  const decoded = decodeBasicEntities(value);

  return decoded
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeRichHtml(value?: string | null): string {
  if (!value) return '';

  let output = value;

  // Remove dangerous block tags and their content.
  output = output.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1>/gi, '');

  // Remove inline event handlers.
  output = output.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  output = output.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  output = output.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // Block javascript: and dangerous data: URLs, but allow data:image/ for embedded images.
  output = output.replace(/\s(href|src)\s*=\s*"(\s*(javascript:|data:(?!image\/))[^"]*)"/gi, ' $1="#"');
  output = output.replace(/\s(href|src)\s*=\s*'(\s*(javascript:|data:(?!image\/))[^']*)'/gi, " $1='#'");

  return normalizeCodeBlockEntities(output.trim());
}

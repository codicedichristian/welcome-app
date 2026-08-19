const SAFE_PROTOCOLS = ['https:', 'http:']

/**
 * Returns the URL only if it has an allowed protocol; otherwise returns null.
 * Blocks javascript:, data:, vbscript:, and other dangerous schemes.
 */
export function safeUrl(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    return SAFE_PROTOCOLS.includes(url.protocol) ? trimmed : null
  } catch {
    return null
  }
}

/** Null-safe trim for string fields. */
export function trimField(value) {
  return typeof value === 'string' ? value.trim() : value
}

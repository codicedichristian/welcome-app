/**
 * td (translate-db) — reads the right language from a JSONB field.
 *
 * DB fields that used to be plain strings are now objects like:
 *   { es: "Servicio del Domingo", en: "Sunday Service" }
 *
 * Usage:  td(event.title)  →  "Sunday Service"  (when lang = 'en')
 */
import i18n from '../lib/i18n.js'

export function td(field) {
  if (!field) return ''
  // Backwards-compat: plain strings still work
  if (typeof field === 'string') return field
  const lang = i18n.language ?? 'es'
  return field[lang] ?? field['es'] ?? field['en'] ?? ''
}

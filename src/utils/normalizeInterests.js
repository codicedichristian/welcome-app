export function normalizeInterests(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((i) => String(i).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    // Handle PostgreSQL array format: {"Missions","Social action"}
    const cleaned = raw.replace(/^\{|\}$/g, '')
    if (!cleaned) return []
    const parts = cleaned.match(/("([^"]*)")|([^,]+)/g) || []
    return parts.map((i) => i.replace(/^"|"$/g, '').trim()).filter(Boolean)
  }
  return []
}

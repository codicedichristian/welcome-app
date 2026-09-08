/**
 * DeepL via Supabase Edge Function — API key stays on the server.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function deeplTranslate(text, targetLang = 'EN') {
  if (!text?.trim()) return ''

  const res = await fetch(`${SUPABASE_URL}/functions/v1/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ text, targetLang }),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }

  return data.result ?? ''
}

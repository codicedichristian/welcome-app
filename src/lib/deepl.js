/**
 * DeepL via Supabase Edge Function — la chiave API rimane sul server.
 * Nessuna variabile VITE_ esposta al browser.
 */
import { supabase } from './supabase.js'

/**
 * @param {string} text - Testo sorgente (spagnolo)
 * @param {string} targetLang - Lingua target, es. 'EN', 'IT', 'FR'
 * @returns {Promise<string>} Testo tradotto
 */
export async function deeplTranslate(text, targetLang = 'EN') {
  if (!text?.trim()) return ''

  const { data, error } = await supabase.functions.invoke('translate', {
    body: { text, targetLang },
  })

  if (error) throw new Error(`Translate error: ${error.message}`)
  if (data?.error) throw new Error(`DeepL error: ${data.error}`)

  return data?.result ?? ''
}

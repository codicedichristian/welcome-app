import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { text, targetLang = 'EN' } = await req.json()

    if (!text?.trim()) {
      return new Response(JSON.stringify({ result: '' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('DEEPL_API_KEY')
    if (!apiKey) throw new Error('DEEPL_API_KEY secret not set')

    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'ES',
        target_lang: targetLang.toUpperCase(),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`DeepL ${res.status}: ${err}`)
    }

    const data = await res.json()
    const result = data.translations?.[0]?.text ?? ''

    return new Response(JSON.stringify({ result }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

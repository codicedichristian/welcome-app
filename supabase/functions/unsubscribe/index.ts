import { createClient } from 'npm:@supabase/supabase-js@2'

const HTML_SUCCESS = `<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:60px 24px;background:#0a0a0a;color:#fff">
  <div style="max-width:400px;margin:0 auto">
    <p style="font-size:48px;margin:0">✓</p>
    <h2 style="font-size:22px;font-weight:700;margin:16px 0 8px">Unsubscribed successfully</h2>
    <p style="color:#8e8e93;font-size:15px">Your preferences have been updated. You can change them again at any time from your profile settings.</p>
  </div>
</body>
</html>`

const HTML_ERROR = (msg: string) => `<html>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:60px 24px;background:#0a0a0a;color:#fff">
  <h2>${msg}</h2>
</body>
</html>`

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const type = url.searchParams.get('type')

  if (!token) {
    return new Response(HTML_ERROR('Invalid unsubscribe link.'), { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const updates = type === 'all'
    ? { marketing_consent: false, profiling_consent: false }
    : { marketing_consent: false }

  const { error } = await supabase.from('users').update(updates).eq('id', token)

  if (error) {
    return new Response(HTML_ERROR('Something went wrong. Please try again.'), { status: 500, headers: { 'Content-Type': 'text/html' } })
  }

  await supabase.from('gdpr_consent_logs').insert({
    user_id: token,
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
    privacy_policy_version: 'v1.0',
    consents_state: { ...updates, action: 'unsubscribe_link' },
    action: 'revoke',
  })

  return new Response(HTML_SUCCESS, { status: 200, headers: { 'Content-Type': 'text/html' } })
})

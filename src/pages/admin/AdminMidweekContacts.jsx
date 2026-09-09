import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminMidweekContacts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('midweek_contacts')
      .select('*, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>Midweek contacts</h2>
      {loading ? (
        <p style={{ color: '#888' }}>Cargando...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#888' }}>Sin clicks aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map((r) => (
            <div key={r.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px' }}>
              <p style={{ color: '#ffffff', fontWeight: '600', margin: '0 0 4px' }}>
                {r.users ? `${r.users.first_name ?? ''} ${r.users.last_name ?? ''}`.trim() || r.users.email : 'Utente anonimo'}
              </p>
              <p style={{ color: '#888', fontSize: '13px', margin: '0 0 2px' }}>Gruppo: {r.group_host}</p>
              <p style={{ color: '#555', fontSize: '12px', margin: '4px 0 0' }}>
                {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

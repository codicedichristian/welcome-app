import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { exportToCSV } from '../../lib/exportCsv.js'

export default function AdminMidweekContacts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('midweek_info_click')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Midweek clicks</h2>
        <button
          type="button"
          onClick={() => exportToCSV(
            rows.map(r => ({
              'Nome':    [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Anonimo',
              'Telefono': r.phone ?? '',
              'Email':   r.email ?? '',
              'Gruppo':  r.group_host ?? '',
            })),
            'midweek-clicks.csv'
          )}
          style={{ background: '#f97316', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          Export CSV
        </button>
      </div>
      {loading ? (
        <p style={{ color: '#888' }}>Cargando...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#888' }}>Sin clicks aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map((r) => (
            <div key={r.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px' }}>
              <p style={{ color: '#ffffff', fontWeight: '600', margin: '0 0 4px' }}>
                {[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Anonimo'}
              </p>
              {r.email && <p style={{ color: '#888', fontSize: '13px', margin: '0 0 2px' }}>{r.email}</p>}
              {r.phone && <p style={{ color: '#888', fontSize: '13px', margin: '0 0 2px' }}>{r.phone}</p>}
              <p style={{ color: '#555', fontSize: '13px', margin: '4px 0 2px' }}>Gruppo: {r.group_host}</p>
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

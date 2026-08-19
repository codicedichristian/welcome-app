import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Camera } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'
import { getMidweekGroupDetail, rsvpMidweek } from '../lib/api.js'
import { getStoredUser } from '../lib/user.js'
import { isRsvped, addRsvp, getMidweekGroupId, setMidweekGroupId } from '../lib/rsvp.js'
import { getNextWednesday } from '../lib/events.js'

export default function MidweekDetailPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [going, setGoing] = useState(
    () => isRsvped('midweek') && String(getMidweekGroupId()) === String(groupId),
  )
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    getMidweekGroupDetail(groupId).then(({ data }) => {
      if (data) {
        setGroup(data.group)
        setLeaders(data.leaders)
      }
      setLoading(false)
    })
  }, [groupId])

  const handleGoing = async () => {
    if (!group) return
    const message = encodeURIComponent(
      `Hi ${group.host}, I'd like to come to the Midweek at your place this Wednesday!`,
    )
    window.open(`https://wa.me/${group.phone}?text=${message}`, '_blank', 'noopener')

    const user = getStoredUser()
    if (user.id) {
      const { error: apiError } = await rsvpMidweek(user.id, group.id, getNextWednesday())
      if (apiError) {
        addRsvp('midweek')
        setMidweekGroupId(group.id)
      }
    } else {
      addRsvp('midweek')
      setMidweekGroupId(group.id)
    }
    setGoing(true)
  }

  return (
    <div
      className="page-transition"
      style={{
        background: '#0a0b0a',
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingLeft: '22px',
        paddingRight: '22px',
        paddingBottom: '40px',
      }}
    >
      <BackRow label="Find Midweek" fallback="/midweek" />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>Loading…</p>
        </div>
      ) : !group ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>Group not found.</p>
        </div>
      ) : (
        <>
          {/* Hero image */}
          <div
            style={{
              marginTop: '20px',
              height: '220px',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#1a1a1a',
              position: 'relative',
            }}
          >
            {group.image_url && !imgError ? (
              <img
                src={group.image_url}
                alt=""
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }}
              >
                <span style={{ fontSize: '48px', fontWeight: '800', color: 'rgba(91,140,255,0.4)' }}>
                  {group.initials}
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
          </div>

          {/* Group info card */}
          <div
            style={{
              background: '#1a1a1a',
              border: '0.5px solid #2e2e2e',
              borderRadius: '20px',
              padding: '20px',
              marginTop: '16px',
            }}
          >
            <p style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '4px' }}>
              {group.host}
            </p>
            <p style={{ fontSize: '14px', color: '#9a9a97', marginBottom: '16px' }}>{group.zone}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.address && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#9a9a97', minWidth: '64px' }}>Address</span>
                  <span style={{ fontSize: '13px', color: '#ffffff' }}>{group.address}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#9a9a97', minWidth: '64px' }}>Day</span>
                <span style={{ fontSize: '13px', color: '#ffffff' }}>Every Wednesday</span>
              </div>
              {group.confirmed != null && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#9a9a97', minWidth: '64px' }}>Going</span>
                  <span style={{ fontSize: '13px', color: '#ffffff' }}>{group.confirmed} confirmed</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <p style={{ fontSize: '15px', color: '#c9c9c6', lineHeight: 1.7, marginTop: '20px' }}>
              {group.description}
            </p>
          )}

          {/* Photos link */}
          {group.photos_url && (
            <button
              type="button"
              onClick={() => window.open(group.photos_url, '_blank', 'noopener')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: '#1a1a1a',
                border: '0.5px solid #2e2e2e',
                borderRadius: '16px',
                padding: '14px 16px',
                marginTop: '16px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Camera size={18} color="#5b8cff" strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#ffffff' }}>View photos</span>
            </button>
          )}

          {/* Leaders section */}
          {leaders.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
                Leaders
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leaders.map((leader) => {
                  const name = leader.users
                    ? `${leader.users.first_name} ${leader.users.last_name}`
                    : 'Leader'
                  const initials = leader.users
                    ? `${leader.users.first_name?.[0] ?? ''}${leader.users.last_name?.[0] ?? ''}`.toUpperCase()
                    : '?'
                  return (
                    <div
                      key={leader.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        background: '#1a1a1a',
                        border: '0.5px solid #2e2e2e',
                        borderRadius: '16px',
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#2e2e2e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{name}</p>
                        {leader.role && (
                          <p style={{ fontSize: '12px', color: '#9a9a97', marginTop: '2px' }}>{leader.role}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* I'm going button */}
          <button
            type="button"
            onClick={handleGoing}
            disabled={going}
            style={{
              marginTop: '28px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: going ? 'default' : 'pointer',
              border: going ? 'none' : '0.5px solid #ffffff',
              background: going ? '#3ddc97' : 'transparent',
              color: going ? '#0a0b0a' : '#ffffff',
              transition: 'all 200ms ease',
            }}
          >
            {going && <Check size={18} />}
            {going ? "You're in!" : "I'm going"}
          </button>
        </>
      )}
    </div>
  )
}

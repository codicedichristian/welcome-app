import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Home } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getMidweekGroupDetail, rsvpMidweek } from '../lib/api.js'
import { getStoredUser } from '../lib/user.js'
import { isRsvped, addRsvp, getMidweekGroupId, setMidweekGroupId } from '../lib/rsvp.js'
import { getNextWednesday } from '../lib/events.js'

export default function MidweekDetailPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [going, setGoing] = useState(
    () => isRsvped('midweek') && String(getMidweekGroupId()) === String(groupId),
  )
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    getMidweekGroupDetail(groupId).then(({ data }) => {
      if (data) setGroup(data.group)
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
    <div className="page-transition" style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* Back row overlaid on hero */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Find Midweek" fallback="/midweek" />
      </div>

      {loading ? (
        <>
          <SkeletonCard height={260} radius={0} />
          <div style={{ padding: '0 22px', marginTop: '16px' }}>
            <SkeletonCard height={120} radius={20} />
          </div>
        </>
      ) : !group ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>Group not found.</p>
        </div>
      ) : (
        <>
          {/* Hero image */}
          <div style={{ position: 'relative', width: '100%', height: '260px', background: '#1a1a1a' }}>
            {group.image_url && !imgError ? (
              <img
                src={group.image_url}
                alt=""
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                <Home size={40} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0a0b0a 100%)' }} />
            <div style={{ position: 'absolute', left: '20px', bottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#9a9a97', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                {group.zone}
              </p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px', marginBottom: 0 }}>
                {group.host}
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '0 22px' }}>
            {/* Info card */}
            <div style={{ background: '#1a1a1a', border: '0.5px solid #2e2e2e', borderRadius: '20px', padding: '20px', marginTop: '16px' }}>
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
              <p style={{ fontSize: '15px', color: '#c9c9c6', lineHeight: 1.7, marginTop: '20px', marginBottom: 0 }}>
                {group.description}
              </p>
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
          </div>
        </>
      )}
    </div>
  )
}

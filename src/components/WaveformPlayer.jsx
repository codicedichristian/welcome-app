import { useAudioPlayer } from '../contexts/AudioPlayerContext.jsx'

// Generate consistent pseudo-random bar heights from a seed string
function generateBars(count = 40, seed = 'audio') {
  const bars = []
  let s = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const h = 20 + (Math.abs(s) % 60)
    bars.push(h)
  }
  return bars
}

export default function WaveformPlayer({ url, title }) {
  const { state, play, togglePlay, seek } = useAudioPlayer()
  const bars = generateBars(40, url || 'audio')
  const isThis = state.url === url
  const isPlaying = isThis && state.isPlaying
  const progress = isThis && state.duration ? state.currentTime / state.duration : 0

  function handleClick() {
    if (!isThis) {
      play(url, title)
    } else {
      togglePlay()
    }
  }

  function handleSeek(e) {
    if (!isThis || !state.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    seek(pct * state.duration)
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        background: '#1a1a1a',
        border: '0.5px solid #2e2e2e',
        borderRadius: '16px',
        padding: '14px 18px',
        cursor: 'pointer',
      }}
    >
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#34d399',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <rect x="2" y="1" width="4" height="12" rx="1"/>
            <rect x="8" y="1" width="4" height="12" rx="1"/>
          </svg>
        ) : (
          // Play icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <polygon points="3,1 13,7 3,13"/>
          </svg>
        )}
      </button>

      {/* Waveform bars */}
      <div
        onClick={handleSeek}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '40px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {bars.map((h, i) => {
          const barPct = i / bars.length
          const played = barPct < progress
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: '2px',
                background: played ? '#34d399' : '#3f3f3f',
                transition: 'background 0.1s',
              }}
            />
          )
        })}
      </div>

      {/* Time */}
      <span style={{ fontSize: '11px', color: '#888', flexShrink: 0, minWidth: '32px', textAlign: 'right' }}>
        {isThis ? fmt(state.currentTime) : fmt(state.duration)}
      </span>
    </div>
  )
}

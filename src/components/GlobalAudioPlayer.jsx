import { useAudioPlayer } from '../contexts/AudioPlayerContext.jsx'
import { Play, Pause, X } from 'lucide-react'

export default function GlobalAudioPlayer() {
  const { state, togglePlay, seek, close } = useAudioPlayer()
  if (!state.visible) return null

  const pct = state.duration ? (state.currentTime / state.duration) * 100 : 0

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div style={{ position: 'fixed', bottom: '72px', left: '12px', right: '12px', zIndex: 50 }}
      className="rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
          {state.isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className="flex-1 text-sm font-medium text-primary truncate">{state.title || 'Audio'}</span>
        <button onClick={close} className="text-zinc-400 hover:text-primary">
          <X size={18} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 w-8">{fmt(state.currentTime)}</span>
        <input type="range" min={0} max={state.duration || 100} value={state.currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="flex-1 h-1 accent-primary" />
        <span className="text-xs text-zinc-400 w-8 text-right">{fmt(state.duration)}</span>
      </div>
    </div>
  )
}

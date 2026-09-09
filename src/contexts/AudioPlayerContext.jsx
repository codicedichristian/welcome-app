import { createContext, useContext, useRef, useState, useCallback } from 'react'

const AudioPlayerContext = createContext(null)

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(new Audio())
  const [state, setState] = useState({
    url: null,
    title: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    visible: false,
  })

  const play = useCallback((url, title = '') => {
    const audio = audioRef.current
    if (audio.src !== url) {
      audio.src = url
      audio.load()
    }
    audio.play()
    setState(s => ({ ...s, url, title, isPlaying: true, visible: true }))
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (audio.paused) {
      audio.play()
      setState(s => ({ ...s, isPlaying: true }))
    } else {
      audio.pause()
      setState(s => ({ ...s, isPlaying: false }))
    }
  }, [])

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time
    setState(s => ({ ...s, currentTime: time }))
  }, [])

  const close = useCallback(() => {
    audioRef.current.pause()
    audioRef.current.src = ''
    setState({ url: null, title: '', isPlaying: false, currentTime: 0, duration: 0, visible: false })
  }, [])

  // Sync audio events to state
  const audioEl = audioRef.current
  audioEl.ontimeupdate = () => setState(s => ({ ...s, currentTime: audioEl.currentTime }))
  audioEl.ondurationchange = () => setState(s => ({ ...s, duration: audioEl.duration }))
  audioEl.onended = () => setState(s => ({ ...s, isPlaying: false }))

  return (
    <AudioPlayerContext.Provider value={{ state, play, togglePlay, seek, close }}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext)
}

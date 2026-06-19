import { ArrowLeft } from 'lucide-react'
import { useSmartBack } from '../hooks/useSmartBack.js'

export default function BackRow({ label, fallback = '/' }) {
  const goBack = useSmartBack(fallback)

  return (
    <button type="button" onClick={goBack} className="flex items-center gap-1.5">
      <ArrowLeft size={18} className="text-[#666666]" />
      <span className="text-[14px] text-[#444444]">{label}</span>
    </button>
  )
}

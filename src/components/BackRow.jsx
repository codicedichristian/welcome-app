import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackRow({ label }) {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1">
      <ArrowLeft size={16} className="text-[#666666]" />
      <span className="text-[10px] text-[#444444]">{label}</span>
    </button>
  )
}

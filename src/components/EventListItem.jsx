import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EVENT_COLOR_CLASSES } from '../lib/eventColors.js'

export default function EventListItem({ event, to }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(to ?? `/events/${event.id}`, { state: { event, selectedGroupId: event.selectedGroupId } })}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_COLOR_CLASSES[event.color].dot}`} />
      <div className="flex-1">
        <p className="text-[18px] font-semibold text-primary">{event.name}</p>
        <p className="mt-0.5 text-[14px]" style={{ color: '#666' }}>{event.subtitle}</p>
        {event.meta && <p className="mt-0.5 text-[13px] text-zinc-600">{event.meta}</p>}
      </div>
      <ChevronRight size={18} className="text-zinc-600" />
    </button>
  )
}

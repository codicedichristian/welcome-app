import { useLocation, useParams } from 'react-router-dom'
import BackRow from '../components/BackRow.jsx'
import { getNewsById } from '../data/news.js'
import { formatShortDate } from '../lib/format.js'

export default function NewsDetailPage() {
  const location = useLocation()
  const { id } = useParams()
  const item = location.state?.item ?? getNewsById(id)

  if (!item) {
    return (
      <div className="px-4 pt-3">
        <BackRow label="News" />
        <p className="mt-4 text-[14px] text-zinc-500">News item not found.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-3 pb-8">
      <BackRow label="News" />

      <div className="mt-4 flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-1 text-[13px] font-medium text-bg"
          style={{ backgroundColor: item.color }}
        >
          {item.category}
        </span>
        <span className="text-[13px] text-zinc-500">{formatShortDate(item.published_at)}</span>
      </div>

      <h1 className="mt-3 text-[26px] font-bold text-primary">{item.title}</h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-zinc-400">{item.body}</p>
    </div>
  )
}

import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import BackRow from '../components/BackRow.jsx'
import { getNewsById } from '../data/news.js'
import { formatShortDate } from '../lib/format.js'

export default function NewsDetailPage() {
  const location = useLocation()
  const { id } = useParams()
  const item = location.state?.item ?? getNewsById(id)
  const [imgError, setImgError] = useState(false)

  if (!item) {
    return (
      <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <BackRow label="News" />
        <p className="mt-4 text-[14px] text-zinc-500">News item not found.</p>
      </div>
    )
  }

  const hasHero = item.image_url && !imgError

  if (hasHero) {
    return (
      <div className="page-transition pb-8">
        {/* Hero image with back button overlaid */}
        <div style={{ position: 'relative', width: '100%', height: '280px', background: '#1a1a1a' }}>
          <img
            src={item.image_url}
            alt=""
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%)' }} />
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '16px' }}>
            <BackRow label="News" />
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between">
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
      </div>
    )
  }

  return (
    <div className="page-transition px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
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

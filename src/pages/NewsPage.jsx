import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSmartBack } from '../hooks/useSmartBack.js'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { getNews } from '../lib/api.js'
import { news as fallbackNews } from '../data/news.js'
import { formatShortDate } from '../lib/format.js'
import { SkeletonText } from '../components/SkeletonCard.jsx'
import ErrorState from '../components/ErrorState.jsx'

export default function NewsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromHome = location.state?.fromHome === true
  const goBack = useSmartBack('/')
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: apiError } = await getNews()
      if (cancelled) return

      if (apiError || !data || data.length === 0) {
        setNews(fallbackNews)
        setError(Boolean(apiError) && fallbackNews.length === 0)
      } else {
        setNews(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-transition px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
      {fromHome && (
        <button
          type="button"
          onClick={goBack}
          className="mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft size={18} className="text-[#666666]" />
          <span className="text-[14px] text-[#444444]">Home</span>
        </button>
      )}
      {loading ? (
        <div className="mt-2 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[14px] border border-border bg-surface p-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonText width="30%" height={24} radius={99} />
              <SkeletonText width="80%" height={18} />
              <SkeletonText height={14} />
              <SkeletonText width="65%" height={14} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState />
      ) : news.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Megaphone size={32} className="text-zinc-600" />
          <p className="mt-3 text-[16px] text-primary">No announcements yet</p>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {news.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
              className="rounded-[14px] border border-border bg-surface p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2.5 py-1 text-[13px] font-medium text-bg"
                  style={{ backgroundColor: item.color }}
                >
                  {item.category}
                </span>
                <span className="text-[13px] text-zinc-500">{formatShortDate(item.published_at)}</span>
              </div>
              <p className="mt-2 text-[18px] font-semibold text-primary">{item.title}</p>
              <p className="mt-1 line-clamp-3 text-[15px] leading-[1.5] text-zinc-500">{item.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

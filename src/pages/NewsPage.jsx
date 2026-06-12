import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { getNews } from '../lib/api.js'
import { news as fallbackNews } from '../data/news.js'
import { formatShortDate } from '../lib/format.js'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

export default function NewsPage() {
  const navigate = useNavigate()
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
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-[15px] font-medium text-primary">News</h1>
      <p className="mt-1 text-[10px] text-zinc-500">From the church</p>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : news.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Megaphone size={32} className="text-zinc-600" />
          <p className="mt-3 text-sm text-primary">No announcements yet</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {news.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/news/${item.id}`, { state: { item } })}
              className="rounded-[14px] border border-border bg-surface p-3.5 text-left"
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2.5 py-1 text-[9px] font-medium text-bg"
                  style={{ backgroundColor: item.color }}
                >
                  {item.category}
                </span>
                <span className="text-[10px] text-zinc-500">{formatShortDate(item.published_at)}</span>
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-primary">{item.title}</p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-[1.5] text-zinc-500">{item.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

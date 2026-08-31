import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BackRow from '../components/BackRow.jsx'
import { getNewsById } from '../data/news.js'
import { formatShortDate } from '../lib/format.js'
import { useSmartBack } from '../hooks/useSmartBack.js'

function HeroBackButton({ goBack }) {
  return (
    <button
      type="button"
      onClick={goBack}
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        left: '16px',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 2,
      }}
    >
      <ArrowLeft size={18} color="#ffffff" />
    </button>
  )
}

function LinkCard({ url }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank', 'noopener')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        background: '#1a1a1a',
        border: '0.5px solid #2e2e2e',
        borderRadius: '14px',
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        marginTop: '20px',
      }}
    >
      <ExternalLink size={20} color="#5b8cff" />
      <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{t('news.learn_more')}</span>
      <ChevronRight size={16} color="#444444" />
    </button>
  )
}

export default function NewsDetailPage() {
  const location = useLocation()
  const { id } = useParams()
  const { t } = useTranslation()
  const item = location.state?.item ?? getNewsById(id)
  const [imgError, setImgError] = useState(false)
  const goBack = useSmartBack('/news')

  if (!item) {
    return (
      <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <BackRow label={t('news.label')} />
        <p className="mt-4 text-[14px] text-zinc-500">{t('news.not_found')}</p>
      </div>
    )
  }

  const hasHero = Boolean(item.image_url) && !imgError

  if (hasHero) {
    return (
      <div className="page-transition pb-8">
        <div style={{ position: 'relative', width: '100%', height: '220px', background: '#1a1a1a' }}>
          <img
            src={item.image_url}
            alt=""
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0b0a 100%)' }} />
          <HeroBackButton goBack={goBack} />
        </div>

        <div className="px-4 pt-5 pb-8">
          <div className="flex items-center justify-between">
            <span className="rounded-full px-2.5 py-1 text-[13px] font-medium text-bg" style={{ backgroundColor: item.color }}>
              {item.category}
            </span>
            <span className="text-[13px] text-zinc-500">{formatShortDate(item.published_at)}</span>
          </div>
          <h1 className="mt-3 text-[26px] font-bold text-primary">{item.title}</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-zinc-400">{item.body}</p>
          {item.link_url && <LinkCard url={item.link_url} />}
        </div>
      </div>
    )
  }

  return (
    <div className="page-transition px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
      <BackRow label={t('news.label')} />

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full px-2.5 py-1 text-[13px] font-medium text-bg" style={{ backgroundColor: item.color }}>
          {item.category}
        </span>
        <span className="text-[13px] text-zinc-500">{formatShortDate(item.published_at)}</span>
      </div>

      <h1 className="mt-3 text-[26px] font-bold text-primary">{item.title}</h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-zinc-400">{item.body}</p>
      {item.link_url && <LinkCard url={item.link_url} />}
    </div>
  )
}

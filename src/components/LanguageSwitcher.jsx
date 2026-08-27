import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.language

  const change = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('i18n_lang', code)
  }

  return (
    <div className="mt-6">
      <h3 className="text-[13px] uppercase tracking-[0.5px] text-inactive">{t('profile.language')}</h3>
      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
        {LANGS.map((lang, index) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => change(lang.code)}
            className={`flex w-full items-center justify-between px-4 py-4 text-left ${
              index !== LANGS.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="text-[16px] text-primary">{lang.label}</span>
            {current === lang.code && (
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

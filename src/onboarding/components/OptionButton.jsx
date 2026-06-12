export default function OptionButton({ label, selected, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
        selected ? 'border-primary text-primary' : 'border-border text-zinc-400'
      } ${className}`}
    >
      {label}
    </button>
  )
}

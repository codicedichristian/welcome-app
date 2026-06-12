export default function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected ? 'border-primary text-primary' : 'border-border text-zinc-400'
      }`}
    >
      {label}
    </button>
  )
}

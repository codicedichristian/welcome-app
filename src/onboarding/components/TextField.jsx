export default function TextField({ value, onChange, ...props }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base text-primary placeholder-zinc-600 outline-none transition-colors focus:border-primary"
      {...props}
    />
  )
}

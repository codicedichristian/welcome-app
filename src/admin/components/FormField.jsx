import { Children, cloneElement } from 'react'

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[10px] uppercase tracking-[0.5px] text-inactive">
      {children}
    </label>
  )
}

export function Input({ ...props }) {
  return (
    <input
      className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-primary placeholder-zinc-600 outline-none transition-colors focus:border-primary"
      {...props}
    />
  )
}

export function Textarea({ ...props }) {
  return (
    <textarea
      className="w-full resize-none rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-primary placeholder-zinc-600 outline-none transition-colors focus:border-primary"
      {...props}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-primary"
      {...props}
    >
      {children}
    </select>
  )
}

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function Field({ label, children }) {
  const id = slugify(label)

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(Children.only(children), { id })}
    </div>
  )
}

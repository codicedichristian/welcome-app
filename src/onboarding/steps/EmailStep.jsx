import TextField from '../components/TextField.jsx'

export default function EmailStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-[22px] text-primary">What's your email?</h1>
      <TextField
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={formData.email}
        onChange={(value) => update({ email: value })}
      />
      <p className="mt-2 text-[12px] text-zinc-500">We'll never share it</p>
    </div>
  )
}

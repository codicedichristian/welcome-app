import TextField from '../components/TextField.jsx'

export default function PhoneStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-[20px] text-primary">What's your phone number?</h1>
      <TextField
        type="tel"
        placeholder="+34 000 000 000"
        autoComplete="tel"
        value={formData.phone}
        onChange={(value) => update({ phone: value })}
      />
    </div>
  )
}

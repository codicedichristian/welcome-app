import TextField from '../components/TextField.jsx'

export default function NameStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-[22px] text-primary">What's your name?</h1>
      <div className="flex flex-col gap-3">
        <TextField
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          value={formData.firstName}
          onChange={(value) => update({ firstName: value })}
        />
        <TextField
          type="text"
          placeholder="Last name"
          autoComplete="family-name"
          value={formData.lastName}
          onChange={(value) => update({ lastName: value })}
        />
      </div>
    </div>
  )
}

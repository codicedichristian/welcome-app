import PasswordField from '../components/PasswordField.jsx'

export default function PasswordStep({ formData, update }) {
  const tooShort = formData.password.length > 0 && formData.password.length < 8
  const mismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword

  return (
    <div>
      <h1 className="mb-6 text-[20px] text-primary">Create a password</h1>
      <div className="flex flex-col gap-3">
        <PasswordField
          placeholder="Password"
          autoComplete="new-password"
          value={formData.password}
          onChange={(value) => update({ password: value })}
        />
        <PasswordField
          placeholder="Confirm password"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={(value) => update({ confirmPassword: value })}
        />
      </div>
      {tooShort ? (
        <p className="mt-2 text-xs text-[#e55555]">Password must be at least 8 characters</p>
      ) : mismatch ? (
        <p className="mt-2 text-xs text-[#e55555]">Passwords don't match</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">At least 8 characters</p>
      )}
    </div>
  )
}

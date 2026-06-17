import OptionButton from '../components/OptionButton.jsx'

const OPTIONS = ['A friend', 'Social media', 'Internet search', 'Just walked in', 'Other']

export default function SourceStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-[22px] text-primary">How did you find us?</h1>
      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <OptionButton
            key={option}
            label={option}
            selected={formData.source === option}
            onClick={() => update({ source: option })}
          />
        ))}
      </div>
    </div>
  )
}

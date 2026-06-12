import OptionButton from '../components/OptionButton.jsx'
import { AGE_RANGE_OPTIONS } from '../options.js'

export default function AgeRangeStep({ formData, update }) {
  return (
    <div>
      <h1 className="mb-6 text-lg text-primary">What's your age range?</h1>
      <div className="grid grid-cols-2 gap-3">
        {AGE_RANGE_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            label={option}
            className="text-center"
            selected={formData.ageRange === option}
            onClick={() => update({ ageRange: option })}
          />
        ))}
      </div>
    </div>
  )
}

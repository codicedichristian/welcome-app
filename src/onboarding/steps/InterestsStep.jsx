import Chip from '../components/Chip.jsx'
import { INTERESTS_OPTIONS } from '../options.js'

export default function InterestsStep({ formData, update }) {
  const toggleInterest = (option) => {
    const isSelected = formData.interests.includes(option)
    update({
      interests: isSelected
        ? formData.interests.filter((item) => item !== option)
        : [...formData.interests, option],
    })
  }

  return (
    <div>
      <h1 className="mb-6 text-[20px] text-primary">What interests you?</h1>
      <div className="flex flex-wrap gap-2">
        {INTERESTS_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={formData.interests.includes(option)}
            onClick={() => toggleInterest(option)}
          />
        ))}
      </div>
    </div>
  )
}

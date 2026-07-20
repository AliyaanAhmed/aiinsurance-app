import { Monitor, Smartphone, Tablet } from 'lucide-react'

export type DeviceSize = 'mobile' | 'tablet' | 'desktop'

const deviceOptions: Array<{ value: DeviceSize; label: string; Icon: typeof Monitor }> = [
  { value: 'mobile', label: 'Mobile', Icon: Smartphone },
  { value: 'tablet', label: 'Tablet', Icon: Tablet },
  { value: 'desktop', label: 'Desktop', Icon: Monitor },
]

export function DeviceFrameToggle({
  value,
  onChange,
}: {
  value: DeviceSize
  onChange: (value: DeviceSize) => void
}) {
  return (
    <div className="device-toggle" role="group" aria-label="Preview size">
      {deviceOptions.map(({ value: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          className={value === option ? 'active' : ''}
          onClick={() => onChange(option)}
          aria-label={label}
          title={label}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

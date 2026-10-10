import { useState } from 'react'
import { Input } from './Input'
import { formatAmount } from '../../lib/formatters'

export function AmountInput({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={focused ? value : formatAmount(value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const nextValue = event.target.value.replace(/,/g, '')
        if (/^-?\d*(?:\.\d*)?$/.test(nextValue)) onValueChange(nextValue)
      }}
    />
  )
}

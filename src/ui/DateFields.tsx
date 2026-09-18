import { useRef, type KeyboardEvent } from 'react'
import type { DateParts } from './dateParts'

const FIELDS = [
  { key: 'day', label: 'Day', placeholder: 'DD', length: 2, suffix: 'day' },
  {
    key: 'month',
    label: 'Month',
    placeholder: 'MM',
    length: 2,
    suffix: 'month',
  },
  {
    key: 'year',
    label: 'Year',
    placeholder: 'YYYY',
    length: 4,
    suffix: 'year',
  },
] as const

interface Props {
  value: DateParts
  onChange: (value: DateParts) => void
  legend: string
  /** Prefix for the fields' autocomplete tokens, like `bday` for birthdays. */
  autoCompletePrefix?: string
  invalid?: boolean
  describedBy?: string
}

/**
 * Three labelled DD / MM / YYYY fields. Focus moves on once a field is full
 * and back on backspace in an empty field, so a date can be typed in one go.
 */
export function DateFields({
  value,
  onChange,
  legend,
  autoCompletePrefix,
  invalid = false,
  describedBy,
}: Props) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(index: number, raw: string) {
    const field = FIELDS[index]
    const digits = raw.replace(/\D/g, '').slice(0, field.length)
    onChange({ ...value, [field.key]: digits })
    if (digits.length === field.length) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Backspace' && event.currentTarget.value === '') {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex items-start gap-3">
        {FIELDS.map((field, index) => (
          <label
            key={field.key}
            className={field.key === 'year' ? 'flex-[2]' : 'flex-1'}
          >
            <input
              ref={(el) => {
                inputs.current[index] = el
              }}
              value={value[field.key]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              placeholder={field.placeholder}
              inputMode="numeric"
              autoComplete={
                autoCompletePrefix
                  ? `${autoCompletePrefix}-${field.suffix}`
                  : 'off'
              }
              maxLength={field.length}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="w-full rounded-none border-b border-line bg-transparent py-2 text-center text-3xl font-light outline-none placeholder:text-muted/50 focus:border-ink"
            />
            <span className="mt-2 block text-center text-xs tracking-[0.2em] text-muted uppercase">
              {field.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { validateBirthDate, type BirthDateError } from '../../domain/life'
import { Button } from '../../ui/Button'

const ERRORS: Record<BirthDateError, string> = {
  invalid: 'That date doesn’t exist.',
  future: 'That date hasn’t happened yet.',
  'too-old': 'Please check the year.',
}

const FIELDS = [
  {
    key: 'day',
    label: 'Day',
    placeholder: 'DD',
    length: 2,
    autoComplete: 'bday-day',
  },
  {
    key: 'month',
    label: 'Month',
    placeholder: 'MM',
    length: 2,
    autoComplete: 'bday-month',
  },
  {
    key: 'year',
    label: 'Year',
    placeholder: 'YYYY',
    length: 4,
    autoComplete: 'bday-year',
  },
] as const

type FieldKey = (typeof FIELDS)[number]['key']
type Values = Record<FieldKey, string>

function valuesFrom(isoDate: string | null): Values {
  if (!isoDate) return { day: '', month: '', year: '' }
  const [year, month, day] = isoDate.split('-')
  return { day, month, year }
}

interface Props {
  initial: string | null
  onSubmit: (birthDate: string) => void
}

export function BirthdayStep({ initial, onSubmit }: Props) {
  const [values, setValues] = useState(() => valuesFrom(initial))
  const [error, setError] = useState<BirthDateError | null>(null)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const complete =
    values.day.length > 0 && values.month.length > 0 && values.year.length === 4

  function handleChange(index: number, raw: string) {
    const field = FIELDS[index]
    const value = raw.replace(/\D/g, '').slice(0, field.length)
    setValues((current) => ({ ...current, [field.key]: value }))
    setError(null)
    // Move on once a field is full, so the date can be typed in one go.
    if (value.length === field.length) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Backspace' && event.currentTarget.value === '') {
      inputs.current[index - 1]?.focus()
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!complete) return
    const date = `${values.year}-${values.month.padStart(2, '0')}-${values.day.padStart(2, '0')}`
    const problem = validateBirthDate(date, new Date())
    if (problem) setError(problem)
    else onSubmit(date)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <h1
        className="text-[2rem] leading-tight font-light outline-none"
        tabIndex={-1}
      >
        When were you born?
      </h1>
      <p className="mt-3 text-muted">Everything stays on this device.</p>

      <fieldset className="mt-12">
        <legend className="sr-only">Date of birth</legend>
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
                value={values[field.key]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder={field.placeholder}
                inputMode="numeric"
                autoComplete={field.autoComplete}
                maxLength={field.length}
                aria-invalid={error !== null}
                aria-describedby={error ? 'birthday-error' : undefined}
                className="w-full rounded-none border-b border-line bg-transparent py-2 text-center text-3xl font-light outline-none placeholder:text-muted/50 focus:border-ink"
              />
              <span className="mt-2 block text-center text-xs tracking-[0.2em] text-muted uppercase">
                {field.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p id="birthday-error" role="alert" className="mt-6 min-h-7 text-ink">
        {error && ERRORS[error]}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <Button type="submit" disabled={!complete}>
          Continue
        </Button>
      </div>
    </form>
  )
}

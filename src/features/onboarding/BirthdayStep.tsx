import { useState, type FormEvent } from 'react'
import { validateBirthDate, type BirthDateError } from '../../domain/life'
import { Button } from '../../ui/Button'
import { DateFields } from '../../ui/DateFields'
import { datePartsFrom, isoFromParts } from '../../ui/dateParts'

const ERRORS: Record<BirthDateError, string> = {
  invalid: 'That date doesn’t exist.',
  future: 'That date hasn’t happened yet.',
  'too-old': 'Please check the year.',
}

interface Props {
  initial: string | null
  onSubmit: (birthDate: string) => void
}

export function BirthdayStep({ initial, onSubmit }: Props) {
  const [parts, setParts] = useState(() => datePartsFrom(initial))
  const [error, setError] = useState<BirthDateError | null>(null)
  const date = isoFromParts(parts)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!date) return
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

      <div className="mt-12">
        <DateFields
          value={parts}
          onChange={(next) => {
            setParts(next)
            setError(null)
          }}
          legend="Date of birth"
          autoCompletePrefix="bday"
          invalid={error !== null}
          describedBy={error ? 'birthday-error' : undefined}
        />
      </div>

      <p id="birthday-error" role="alert" className="mt-6 min-h-7 text-ink">
        {error && ERRORS[error]}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <Button type="submit" disabled={!date}>
          Continue
        </Button>
      </div>
    </form>
  )
}

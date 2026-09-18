import { useId, useState, type FormEvent } from 'react'
import {
  COUNTER_PERIODS,
  MAX_COUNTER_NAME_LENGTH,
  MAX_COUNTER_TIMES,
  validateCounter,
  type CounterError,
  type CounterInput,
  type CounterPeriod,
  type CustomCounter,
} from '../../domain/counters'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { DateFields } from '../../ui/DateFields'
import { datePartsFrom, isoFromParts } from '../../ui/dateParts'

const ERRORS: Record<CounterError, string> = {
  'name-empty': 'Give it a name.',
  'name-too-long': 'Keep the name under 40 characters.',
  times: `Choose how often, from 1 to ${MAX_COUNTER_TIMES}.`,
  'birth-year': 'Check their birth year.',
  age: 'Choose an age from 1 to 120.',
  'end-invalid': 'That date doesn’t exist.',
  'end-passed': 'That has already passed.',
}

type EndKind = 'none' | 'age' | 'date'

const digits = (value: string, length: number) =>
  value.replace(/\D/g, '').slice(0, length)

interface Props {
  /** The counter being edited, or undefined for a new one. */
  counter?: CustomCounter
  now: Date
  onSave: (input: CounterInput) => void
  onDelete?: () => void
  onCancel: () => void
}

export function CounterForm({
  counter,
  now,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const end = counter?.end ?? null
  const [name, setName] = useState(counter?.name ?? '')
  const [times, setTimes] = useState(String(counter?.times ?? 1))
  const [per, setPer] = useState<CounterPeriod>(counter?.per ?? 'year')
  const [endKind, setEndKind] = useState<EndKind>(end?.kind ?? 'none')
  const [birthYear, setBirthYear] = useState(
    end?.kind === 'age' ? String(end.birthYear) : '',
  )
  const [age, setAge] = useState(end?.kind === 'age' ? String(end.age) : '')
  const [dateParts, setDateParts] = useState(() =>
    datePartsFrom(end?.kind === 'date' ? end.date : null),
  )
  const [error, setError] = useState<CounterError | null>(null)
  const errorId = useId()

  function toInput(): CounterInput {
    const base = { name, times: Number(times), per }
    if (endKind === 'age') {
      return {
        ...base,
        end: { kind: 'age', birthYear: Number(birthYear), age: Number(age) },
      }
    }
    if (endKind === 'date') {
      return {
        ...base,
        end: { kind: 'date', date: isoFromParts(dateParts) ?? '' },
      }
    }
    return { ...base, end: null }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input = toInput()
    const problem = validateCounter(input, now)
    if (problem) setError(problem)
    else onSave(input)
  }

  const underline =
    'rounded-none border-b border-line bg-transparent py-1 outline-none placeholder:text-muted/50 focus:border-ink'

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <h2 className="mt-6 text-[2rem] leading-tight font-light">
        {counter ? 'Edit counter' : 'Count something'}
      </h2>

      <label className="mt-8 block">
        <span className="text-xs tracking-[0.2em] text-muted uppercase">
          What
        </span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          maxLength={MAX_COUNTER_NAME_LENGTH}
          placeholder="Visits to my parents"
          autoComplete="off"
          className={cn(underline, 'mt-1 w-full text-2xl font-light')}
        />
      </label>

      <fieldset className="mt-8">
        <legend className="text-xs tracking-[0.2em] text-muted uppercase">
          How often
        </legend>
        <div className="mt-2 flex items-baseline gap-3">
          <input
            value={times}
            onChange={(e) => {
              setTimes(digits(e.target.value, 2))
              setError(null)
            }}
            inputMode="numeric"
            aria-label="Times"
            className={cn(underline, 'w-12 text-center text-2xl font-light')}
          />
          <span className="text-lg">{times === '1' ? 'time' : 'times'}</span>
          <div className="flex gap-1" role="radiogroup" aria-label="Per">
            {COUNTER_PERIODS.map((period) => (
              <label key={period} className="cursor-pointer">
                <input
                  type="radio"
                  name="counter-period"
                  checked={per === period}
                  onChange={() => setPer(period)}
                  className="peer sr-only"
                />
                <span className="block rounded-full px-3 py-1 text-lg text-muted peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-1 peer-focus-visible:outline-muted">
                  a {period}
                </span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-xs tracking-[0.2em] text-muted uppercase">
          Until
        </legend>
        <div className="mt-2 flex flex-col">
          {(
            [
              ['none', 'My expected age'],
              ['age', 'Someone reaches an age'],
              ['date', 'A date'],
            ] as const
          ).map(([kind, label]) => (
            <label
              key={kind}
              className="flex cursor-pointer items-baseline gap-3 py-1.5"
            >
              <input
                type="radio"
                name="counter-end"
                checked={endKind === kind}
                onChange={() => {
                  setEndKind(kind)
                  setError(null)
                }}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="size-2.5 shrink-0 translate-y-[-0.1em] rounded-full border border-muted peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted"
              />
              <span className="text-lg">{label}</span>
            </label>
          ))}
        </div>

        {endKind === 'age' && (
          <div className="mt-3 flex items-baseline gap-2 text-lg">
            <span>Until they turn</span>
            <input
              value={age}
              onChange={(e) => {
                setAge(digits(e.target.value, 3))
                setError(null)
              }}
              inputMode="numeric"
              aria-label="Their age"
              placeholder="90"
              className={cn(underline, 'w-12 text-center text-xl font-light')}
            />
            <span>, born</span>
            <input
              value={birthYear}
              onChange={(e) => {
                setBirthYear(digits(e.target.value, 4))
                setError(null)
              }}
              inputMode="numeric"
              aria-label="Their birth year"
              placeholder="YYYY"
              className={cn(underline, 'w-20 text-center text-xl font-light')}
            />
          </div>
        )}

        {endKind === 'date' && (
          <div className="mt-4">
            <DateFields
              value={dateParts}
              onChange={(next) => {
                setDateParts(next)
                setError(null)
              }}
              legend="End date"
            />
          </div>
        )}
      </fieldset>

      <p id={errorId} role="alert" className="mt-6 min-h-7">
        {error && ERRORS[error]}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button type="submit" aria-describedby={error ? errorId : undefined}>
          Save
        </Button>
        {onDelete && (
          <Button variant="ghost" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

import { format, parseISO } from 'date-fns'
import { useId, useState, type FormEvent } from 'react'
import {
  deliveryFor,
  LETTER_PRESETS,
  MAX_LETTER_LENGTH,
  presetDate,
  validateLetterBody,
  type DeliveryError,
  type LetterPreset,
} from '../../domain/letters'
import type { Profile } from '../../domain/life'
import { Button } from '../../ui/Button'
import { DateFields } from '../../ui/DateFields'
import { EMPTY_DATE, isoFromParts } from '../../ui/dateParts'

const PRESET_LABELS: Record<LetterPreset, string> = {
  'next-birthday': 'Next birthday',
  'in-1-year': 'In a year',
  'in-5-years': 'In five years',
  'in-10-years': 'In ten years',
}

const DELIVERY_ERRORS: Record<DeliveryError, string> = {
  invalid: 'That date doesn’t exist.',
  'too-soon': 'Choose a week after this one.',
  'beyond-lifespan': 'That’s beyond the time you expect to have.',
}

type Target = LetterPreset | 'date'

interface Props {
  profile: Profile
  now: Date
  onSeal: (body: string, date: Date) => void
}

export function WriteLetter({ profile, now, onSeal }: Props) {
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<Target | null>(null)
  const [parts, setParts] = useState(EMPTY_DATE)
  const errorId = useId()

  const customIso = isoFromParts(parts)
  let date: Date | null = null
  if (target === 'date') date = customIso ? parseISO(customIso) : null
  else if (target) date = presetDate(target, profile, now)

  const delivery = date ? deliveryFor(date, profile, now) : null
  const deliveryError = delivery && 'error' in delivery ? delivery.error : null
  const canSeal =
    validateLetterBody(body) === null &&
    delivery !== null &&
    deliveryError === null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSeal && date) onSeal(body, date)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <h2 className="mt-6 text-[2rem] leading-tight font-light">
        Write to your future self.
      </h2>
      <p className="mt-3 text-muted">
        Once sealed, it can’t be read until its week arrives.
      </p>

      <label className="mt-8 block">
        <span className="sr-only">Your letter</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_LETTER_LENGTH}
          rows={5}
          placeholder="Dear me,"
          className="w-full resize-none rounded-none border-b border-line bg-transparent py-2 text-xl leading-relaxed font-light outline-none placeholder:text-muted/50 focus:border-ink"
        />
      </label>
      <p className="mt-1 text-right text-xs text-muted tabular-nums">
        {body.length.toLocaleString('en')} /{' '}
        {MAX_LETTER_LENGTH.toLocaleString('en')}
      </p>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs tracking-[0.2em] text-muted uppercase">
          Open it
        </legend>
        <div className="flex flex-col">
          {LETTER_PRESETS.map((preset) => {
            const presetDelivery = deliveryFor(
              presetDate(preset, profile, now),
              profile,
              now,
            )
            const unavailable = 'error' in presetDelivery
            return (
              <TargetOption
                key={preset}
                checked={target === preset}
                disabled={unavailable}
                onSelect={() => setTarget(preset)}
                label={PRESET_LABELS[preset]}
                detail={
                  unavailable
                    ? 'beyond your time'
                    : format(presetDate(preset, profile, now), 'd MMMM yyyy')
                }
              />
            )
          })}
          <TargetOption
            checked={target === 'date'}
            onSelect={() => setTarget('date')}
            label="On a date"
          />
        </div>
      </fieldset>

      {target === 'date' && (
        <div className="mt-4">
          <DateFields
            value={parts}
            onChange={setParts}
            legend="Date to open the letter"
            invalid={deliveryError !== null}
            describedBy={deliveryError ? errorId : undefined}
          />
          <p id={errorId} role="alert" className="mt-4 min-h-7">
            {deliveryError && DELIVERY_ERRORS[deliveryError]}
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-col pt-8">
        <Button type="submit" disabled={!canSeal}>
          Seal it
        </Button>
      </div>
    </form>
  )
}

interface TargetOptionProps {
  label: string
  detail?: string
  checked: boolean
  disabled?: boolean
  onSelect: () => void
}

function TargetOption({
  label,
  detail,
  checked,
  disabled = false,
  onSelect,
}: TargetOptionProps) {
  return (
    <label className="flex cursor-pointer items-baseline gap-3 py-2 has-disabled:cursor-not-allowed has-disabled:opacity-40">
      <input
        type="radio"
        name="letter-target"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="size-2.5 shrink-0 translate-y-[-0.1em] rounded-full border border-muted peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted"
      />
      <span className="text-lg">{label}</span>{' '}
      {detail && <span className="text-sm text-muted">{detail}</span>}
    </label>
  )
}

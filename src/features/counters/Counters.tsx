import { format, parseISO } from 'date-fns'
import { useState, type ReactNode } from 'react'
import {
  BUILT_IN_COUNTERS,
  remainingOfBuiltIn,
  remainingOfCustom,
  type BuiltInCounter,
  type CounterInput,
  type CustomCounter,
} from '../../domain/counters'
import type { Profile } from '../../domain/life'
import { Button } from '../../ui/Button'
import { CounterForm } from './CounterForm'

/** Above this, dots stop meaning anything and the number speaks alone. */
const MAX_DOTS = 200

const BUILT_IN_LABELS: Record<BuiltInCounter, string> = {
  summers: 'Summers',
  sundays: 'Sundays',
  birthdays: 'Birthdays',
  'full-moons': 'Full moons',
}

function describe(counter: CustomCounter): string {
  const often = `${counter.times} ${counter.times === 1 ? 'time' : 'times'} a ${counter.per}`
  const { end } = counter
  if (!end) return often
  if (end.kind === 'age') return `${often} · until they turn ${end.age}`
  return `${often} · until ${format(parseISO(end.date), 'd MMMM yyyy')}`
}

interface Props {
  profile: Profile
  now: Date
  counters: CustomCounter[]
  hiddenCounters: BuiltInCounter[]
  onAdd: (input: CounterInput) => void
  onUpdate: (id: string, input: CounterInput) => void
  onDelete: (id: string) => void
  onSetHidden: (counter: BuiltInCounter, hidden: boolean) => void
}

export function Counters({
  profile,
  now,
  counters,
  hiddenCounters,
  onAdd,
  onUpdate,
  onDelete,
  onSetHidden,
}: Props) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  if (editing !== null) {
    const counter = counters.find((c) => c.id === editing)
    return (
      <CounterForm
        counter={counter}
        now={now}
        onSave={(input) => {
          if (counter) onUpdate(counter.id, input)
          else onAdd(input)
          setEditing(null)
        }}
        onDelete={
          counter
            ? () => {
                onDelete(counter.id)
                setEditing(null)
              }
            : undefined
        }
        onCancel={() => setEditing(null)}
      />
    )
  }

  const visible = BUILT_IN_COUNTERS.filter((c) => !hiddenCounters.includes(c))
  const hidden = BUILT_IN_COUNTERS.filter((c) => hiddenCounters.includes(c))

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mt-6 text-[2rem] leading-tight font-light">What’s left</h2>
      <p className="mt-3 text-muted">
        Counted until your expected age, unless you say otherwise.
      </p>

      <ul className="mt-8 flex flex-col">
        {visible.map((kind) => (
          <CounterRow
            key={kind}
            label={BUILT_IN_LABELS[kind]}
            remaining={remainingOfBuiltIn(kind, profile, now)}
            action={
              <RowAction
                label={`Hide ${BUILT_IN_LABELS[kind]}`}
                onClick={() => onSetHidden(kind, true)}
              >
                Hide
              </RowAction>
            }
          />
        ))}
        {counters.map((counter) => (
          <CounterRow
            key={counter.id}
            label={counter.name}
            detail={describe(counter)}
            remaining={remainingOfCustom(counter, profile, now)}
            action={
              <RowAction
                label={`Edit ${counter.name}`}
                onClick={() => setEditing(counter.id)}
              >
                Edit
              </RowAction>
            }
          />
        ))}
      </ul>

      <div className="mt-8">
        <Button variant="ghost" onClick={() => setEditing('new')}>
          Count something else
        </Button>
      </div>

      {hidden.length > 0 && (
        <div className="mt-auto pt-10 text-sm text-muted">
          <p className="text-xs tracking-[0.2em] uppercase">Hidden</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {hidden.map((kind) => (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() => onSetHidden(kind, false)}
                  aria-label={`Show ${BUILT_IN_LABELS[kind]}`}
                  className="underline decoration-line underline-offset-4 outline-none focus-visible:text-ink"
                >
                  {BUILT_IN_LABELS[kind]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface CounterRowProps {
  label: string
  detail?: string
  remaining: number
  action: ReactNode
}

function CounterRow({ label, detail, remaining, action }: CounterRowProps) {
  return (
    <li className="border-b border-line py-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-lg">{label}</span>
        <span className="text-3xl font-light tabular-nums">
          {remaining.toLocaleString('en')}
        </span>
      </div>
      {remaining > 0 && remaining <= MAX_DOTS && (
        <div aria-hidden className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: remaining }, (_, i) => (
            <span key={i} className="size-1.5 rounded-full bg-ink" />
          ))}
        </div>
      )}
      <div className="mt-2 flex items-baseline justify-between gap-4 text-sm text-muted">
        <span>{detail}</span>
        {action}
      </div>
    </li>
  )
}

function RowAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 tracking-[0.14em] uppercase outline-none focus-visible:text-ink focus-visible:underline"
    >
      {children}
    </button>
  )
}

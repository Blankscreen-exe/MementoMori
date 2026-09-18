import {
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  MAX_EXPECTED_AGE,
  MIN_EXPECTED_AGE,
  validateExpectedAge,
} from '../../domain/life'
import { Button } from '../../ui/Button'

/** Horizontal drag distance that changes the age by one year. */
const PX_PER_YEAR = 10
/** Movement below this counts as a tap, which opens the keyboard instead. */
const TAP_TOLERANCE_PX = 6

const clamp = (age: number) =>
  Math.min(MAX_EXPECTED_AGE, Math.max(MIN_EXPECTED_AGE, age))

interface Props {
  initial: number
  onBack: (expectedAge: number) => void
  onSubmit: (expectedAge: number) => void
}

export function LifespanStep({ initial, onBack, onSubmit }: Props) {
  const [age, setAge] = useState(initial)
  const [draft, setDraft] = useState<string | null>(null)
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, start: age, moved: false }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current) return
    const dx = event.clientX - current.x
    if (Math.abs(dx) > TAP_TOLERANCE_PX) current.moved = true
    if (current.moved)
      setAge(clamp(current.start + Math.round(dx / PX_PER_YEAR)))
  }

  function handlePointerUp() {
    if (drag.current && !drag.current.moved) setDraft(String(age))
    drag.current = null
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 10,
      PageDown: -10,
    }
    if (event.key in steps) setAge((a) => clamp(a + steps[event.key]))
    else if (event.key === 'Home') setAge(MIN_EXPECTED_AGE)
    else if (event.key === 'End') setAge(MAX_EXPECTED_AGE)
    else if (event.key === 'Enter') setDraft(String(age))
    else return
    event.preventDefault()
  }

  function commitDraft() {
    const value = Number(draft)
    if (draft !== null && validateExpectedAge(value) === null) setAge(value)
    setDraft(null)
  }

  const numberClass =
    'w-40 bg-transparent text-center text-8xl leading-none font-light tabular-nums outline-none'

  return (
    <div className="flex flex-1 flex-col">
      <h1
        className="text-[2rem] leading-tight font-light outline-none"
        tabIndex={-1}
      >
        How long do you expect to live?
      </h1>
      <p className="mt-3 text-muted">In years. You can change this later.</p>

      <div className="mt-14 flex items-center justify-center gap-4">
        <StepButton
          label="One year less"
          onClick={() => setAge((a) => clamp(a - 1))}
          disabled={age <= MIN_EXPECTED_AGE}
        >
          −
        </StepButton>

        {draft === null ? (
          <div
            role="spinbutton"
            tabIndex={0}
            aria-label="Expected age"
            aria-valuemin={MIN_EXPECTED_AGE}
            aria-valuemax={MAX_EXPECTED_AGE}
            aria-valuenow={age}
            aria-valuetext={`${age} years`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={handleKeyDown}
            className={`${numberClass} cursor-ew-resize touch-none select-none focus-visible:underline focus-visible:decoration-1 focus-visible:underline-offset-8`}
          >
            {age}
          </div>
        ) : (
          <input
            autoFocus
            aria-label="Expected age in years"
            inputMode="numeric"
            value={draft}
            onChange={(e) =>
              setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))
            }
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft()
              if (e.key === 'Escape') setDraft(null)
            }}
            className={`${numberClass} border-b border-ink`}
          />
        )}

        <StepButton
          label="One year more"
          onClick={() => setAge((a) => clamp(a + 1))}
          disabled={age >= MAX_EXPECTED_AGE}
        >
          +
        </StepButton>
      </div>

      <p className="mt-4 text-center text-xs tracking-[0.2em] text-muted uppercase">
        years
      </p>
      <p className="mt-6 text-center text-sm text-muted italic">
        Drag the number, or tap it to type.
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={() => onSubmit(age)}>Continue</Button>
        <Button variant="ghost" onClick={() => onBack(age)}>
          Back
        </Button>
      </div>
    </div>
  )
}

function StepButton({
  label,
  ...props
}: { label: string } & Omit<ComponentProps<'button'>, 'aria-label'>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-line text-2xl font-light text-muted transition-opacity focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-30"
      {...props}
    />
  )
}

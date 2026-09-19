import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import {
  MAX_WEEK_NAME_LENGTH,
  normalizeWeekName,
  validateWeekName,
} from '../../domain/ritual'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'

interface Props {
  now: Date
  onKeep: (name: string) => void
  onRelease: () => void
}

/** The Sunday prompt. Blocks the app until the week is named or let go. */
export function Ritual({ now, onKeep, onRelease }: Props) {
  const [name, setName] = useState('')
  const { visible, fadeOutThen } = useFade()

  const canKeep = validateWeekName(name) === null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canKeep) return
    fadeOutThen(() => onKeep(normalizeWeekName(name)))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pt-[14vh] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={handleSubmit}
        inert={!visible}
        className={cn('flex flex-1 flex-col', fadeClass(visible))}
      >
        <p className="mb-6 text-xs tracking-[0.2em] text-muted uppercase">
          {format(now, 'EEEE · d MMMM')}
        </p>
        <h1 className="text-[2rem] leading-tight font-light">
          This week will not come again.
        </h1>
        <p className="mt-3 text-muted">Name it, or let it go.</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="a few words"
          aria-label="Name this week"
          maxLength={MAX_WEEK_NAME_LENGTH}
          autoComplete="off"
          enterKeyHint="done"
          className="mt-10 w-full rounded-none border-b border-line bg-transparent py-2 text-2xl font-light outline-none placeholder:text-muted/50 focus:border-ink"
        />

        <div className="mt-auto flex flex-col gap-2 pt-10">
          <Button type="submit" disabled={!canKeep}>
            Keep it
          </Button>
          <Button variant="ghost" onClick={() => fadeOutThen(onRelease)}>
            Let it go
          </Button>
        </div>
      </form>
    </main>
  )
}

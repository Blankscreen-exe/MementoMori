import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { Letter } from '../../domain/letters'
import { weekStartOfKey } from '../../domain/week'
import { Button } from '../../ui/Button'

interface Props {
  /** Arrived letters only. Sealed letters are never listed. */
  letters: Letter[]
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

const written = (letter: Letter) =>
  format(parseISO(letter.writtenAt), 'd MMMM yyyy')
const arrived = (letter: Letter) =>
  format(weekStartOfKey(letter.week), 'd MMMM yyyy')

export function LetterList({ letters, onOpen, onDelete }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = letters.find((letter) => letter.id === openId)

  if (open) {
    return (
      <ReadLetter
        letter={open}
        onBack={() => setOpenId(null)}
        onDelete={() => {
          onDelete(open.id)
          setOpenId(null)
        }}
      />
    )
  }

  // Newest arrivals first.
  const sorted = [...letters].sort((a, b) => b.week.localeCompare(a.week))

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mt-6 text-[2rem] leading-tight font-light">Letters</h2>
      {sorted.length === 0 ? (
        <p className="mt-3 text-muted">Nothing has arrived yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col">
          {sorted.map((letter) => (
            <li key={letter.id} className="border-b border-line">
              <button
                type="button"
                onClick={() => {
                  onOpen(letter.id)
                  setOpenId(letter.id)
                }}
                className="flex w-full items-baseline gap-3 py-4 text-left outline-none focus-visible:underline focus-visible:underline-offset-4"
              >
                <span
                  aria-hidden
                  className={
                    letter.openedAt
                      ? 'size-1.5 shrink-0'
                      : 'size-1.5 shrink-0 rounded-full bg-sand'
                  }
                />
                <span className="flex-1">
                  <span className="block text-lg">
                    From {written(letter)}
                    {!letter.openedAt && (
                      <span className="sr-only">, unread</span>
                    )}
                  </span>
                  <span className="block text-sm text-muted">
                    Arrived the week of {arrived(letter)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ReadLetterProps {
  letter: Letter
  onBack: () => void
  onDelete: () => void
}

function ReadLetter({ letter, onBack, onDelete }: ReadLetterProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <article className="flex flex-1 flex-col">
      <p className="mt-6 text-xs tracking-[0.2em] text-muted uppercase">
        Written {written(letter)}
      </p>
      <p className="mt-8 text-xl leading-relaxed font-light whitespace-pre-wrap">
        {letter.body}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-10">
        {confirming ? (
          <>
            <p role="alert" className="mb-2 text-center">
              Delete this letter forever?
            </p>
            <Button onClick={onDelete}>Delete forever</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onBack}>
              All letters
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_EXPECTED_AGE, type Profile } from '../../domain/life'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'
import { BirthdayStep } from './BirthdayStep'
import { LifespanStep } from './LifespanStep'

type Step = 'birthday' | 'lifespan'
const STEPS: Step[] = ['birthday', 'lifespan']

interface Props {
  onComplete: (profile: Profile) => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('birthday')
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const [expectedAge, setExpectedAge] = useState(DEFAULT_EXPECTED_AGE)
  const { visible, fadeOutThen } = useFade()
  const content = useRef<HTMLDivElement>(null)
  const previousStep = useRef(step)

  // Move focus to each new step's heading, so screen readers announce it.
  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    content.current?.querySelector('h1')?.focus()
  }, [step])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pt-[14vh] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div
        ref={content}
        inert={!visible}
        className={cn('flex flex-1 flex-col', fadeClass(visible))}
      >
        <StepIndicator current={STEPS.indexOf(step)} total={STEPS.length} />

        {step === 'lifespan' && birthDate !== null ? (
          <LifespanStep
            initial={expectedAge}
            onBack={(age) =>
              fadeOutThen(() => {
                setExpectedAge(age)
                setStep('birthday')
              })
            }
            onSubmit={(age) =>
              fadeOutThen(() => onComplete({ birthDate, expectedAge: age }))
            }
          />
        ) : (
          <BirthdayStep
            initial={birthDate}
            onSubmit={(date) =>
              fadeOutThen(() => {
                setBirthDate(date)
                setStep('lifespan')
              })
            }
          />
        )}
      </div>
    </main>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="mb-8 flex gap-1.5"
      role="img"
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {/* In a single color, the current step stands out by its length. */}
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn('h-px bg-ink', i === current ? 'w-8' : 'w-2')}
        />
      ))}
    </div>
  )
}

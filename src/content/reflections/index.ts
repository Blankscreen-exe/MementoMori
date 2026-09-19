import { body } from './body'
import { courage } from './courage'
import { forgiveness } from './forgiveness'
import { gratitude } from './gratitude'
import { meaning } from './meaning'
import { mortality } from './mortality'
import { people } from './people'
import { presence } from './presence'
import { time } from './time'
import { work } from './work'

/** The themes the reflections are written in, 100 prompts each. */
export const REFLECTION_THEMES = {
  people,
  time,
  work,
  body,
  presence,
  courage,
  gratitude,
  forgiveness,
  meaning,
  mortality,
} as const

/** Every reflection, one of which is shown each time the app opens. */
export const REFLECTIONS: readonly string[] =
  Object.values(REFLECTION_THEMES).flat()

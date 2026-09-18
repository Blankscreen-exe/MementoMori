export interface DateParts {
  day: string
  month: string
  year: string
}

export const EMPTY_DATE: DateParts = { day: '', month: '', year: '' }

export function datePartsFrom(isoDate: string | null): DateParts {
  if (!isoDate) return EMPTY_DATE
  const [year, month, day] = isoDate.split('-')
  return { day, month, year }
}

/** `yyyy-MM-dd`, or null until all three fields are filled in. */
export function isoFromParts({ day, month, year }: DateParts): string | null {
  if (!day || !month || year.length !== 4) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

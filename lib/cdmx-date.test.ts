import { describe, expect, it } from 'vitest'
import { diffCdmxCalendarDays, formatCdmxDate, parseCdmxDate } from './cdmx-date'

describe('cdmx-date', () => {
  it('parses datetime strings without timezone as Mexico City time', () => {
    expect(parseCdmxDate('2026-05-31T00:30:00').toISOString()).toBe('2026-05-31T06:30:00.000Z')
  })

  it('formats dates in the America/Mexico_City timezone', () => {
    expect(
      formatCdmxDate('2026-05-31T00:30:00Z', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    ).toBe('30 may 2026')
  })

  it('preserves negative day differences for future dates', () => {
    expect(
      diffCdmxCalendarDays('2026-05-31T18:00:00', new Date('2026-05-31T12:00:00.000Z'))
    ).toBe(-1)
  })
})

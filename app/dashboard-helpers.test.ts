import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatDashboardCurrency,
  formatTimeAgo,
  sumLifetimeValue,
} from './dashboard-helpers'

describe('dashboard helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sums numeric and string lifetime values while ignoring nulls', () => {
    expect(
      sumLifetimeValue([
        { lifetime_value: 1000 },
        { lifetime_value: '2500' },
        { lifetime_value: null },
      ])
    ).toBe(3500)
  })

  it('returns zero when no lifetime rows are present', () => {
    expect(sumLifetimeValue(undefined)).toBe(0)
  })

  it('formats million-scale dashboard currency values', () => {
    expect(formatDashboardCurrency(1_250_000)).toBe('$1.25M MXN')
  })

  it('formats thousand-scale dashboard currency values', () => {
    expect(formatDashboardCurrency(12_500)).toBe('$13K MXN')
  })

  it('formats minute and hour relative times', () => {
    const now = new Date('2026-05-31T12:00:00.000Z')
    expect(formatTimeAgo('2026-05-31T11:30:00.000Z', now)).toBe('hace 30m')
    expect(formatTimeAgo('2026-05-31T09:00:00.000Z', now)).toBe('hace 3h')
  })

  it('formats day and older dates correctly', () => {
    const now = new Date('2026-05-31T12:00:00.000Z')
    expect(formatTimeAgo('2026-05-29T12:00:00.000Z', now)).toBe('hace 2d')
    expect(formatTimeAgo('2026-05-01T12:00:00.000Z', now)).toContain('may')
  })
})

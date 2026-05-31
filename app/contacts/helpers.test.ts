import { describe, expect, it } from 'vitest'
import {
  formatContactCurrency,
  formatContactDate,
  getResultsRange,
  getTotalPages,
  normalizeContactTypeFilter,
  PAGE_SIZE,
} from './helpers'

describe('contact helpers', () => {
  it('exports the expected page size', () => {
    expect(PAGE_SIZE).toBe(50)
  })

  it('formats currency as MXN without cents', () => {
    expect(formatContactCurrency(98765)).toBe('$98,765')
  })

  it('formats a present date in es-MX', () => {
    expect(formatContactDate('2026-05-31T12:00:00.000Z')).toContain('31')
  })

  it('returns an em dash when the date is missing', () => {
    expect(formatContactDate()).toBe('—')
  })

  it('normalizes plural contact type labels to the backend value', () => {
    expect(normalizeContactTypeFilter('Guests')).toBe('Guest')
    expect(normalizeContactTypeFilter('Owners')).toBe('Owner')
  })

  it('preserves the All filter label', () => {
    expect(normalizeContactTypeFilter('All')).toBe('All')
  })

  it('builds the visible results range for a full page', () => {
    expect(getResultsRange(1, 140)).toBe('51–100')
  })

  it('caps the results range to the total count on the last page', () => {
    expect(getResultsRange(2, 123)).toBe('101–123')
  })

  it('calculates total pages from the page size', () => {
    expect(getTotalPages(0)).toBe(0)
    expect(getTotalPages(123)).toBe(3)
  })
})

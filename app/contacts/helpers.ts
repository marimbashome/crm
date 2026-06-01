import { formatCdmxDate } from '@/lib/cdmx-date'

export const PAGE_SIZE = 50

export function formatContactCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatContactDate(dateString?: string): string {
  if (!dateString) return '—'

  return formatCdmxDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function normalizeContactTypeFilter(typeLabel: string): string {
  return typeLabel === 'All' ? 'All' : typeLabel.slice(0, -1)
}

export function getResultsRange(page: number, totalCount: number): string {
  const start = page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)
  return `${start}–${end}`
}

export function getTotalPages(totalCount: number): number {
  return Math.ceil(totalCount / PAGE_SIZE)
}

const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City'
const MEXICO_CITY_UTC_OFFSET = '-06:00'

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_WITHOUT_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

function normalizeMexicoCityDateInput(value: string): string {
  if (DATE_ONLY_RE.test(value)) {
    return `${value}T00:00:00${MEXICO_CITY_UTC_OFFSET}`
  }

  if (DATETIME_WITHOUT_TZ_RE.test(value)) {
    return `${value}${MEXICO_CITY_UTC_OFFSET}`
  }

  return value
}

export function parseCdmxDate(value: string): Date {
  return new Date(normalizeMexicoCityDateInput(value))
}

export function formatCdmxDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
  locale = 'es-MX'
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: MEXICO_CITY_TIME_ZONE,
    ...options,
  }).format(parseCdmxDate(value))
}

export function diffCdmxCalendarDays(from: string, to: Date = new Date()): number {
  const fromDate = parseCdmxDate(from)
  const diffMs = to.getTime() - fromDate.getTime()

  if (diffMs === 0) {
    return 0
  }

  const dayMs = 1000 * 60 * 60 * 24
  return Math.sign(diffMs) * Math.ceil(Math.abs(diffMs) / dayMs)
}

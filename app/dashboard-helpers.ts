export interface LifetimeValueRow {
  lifetime_value: number | string | null
}

export interface RecentActivity {
  id: string
  type: string
  date: string
  contact_name: string | null
  contact_type: string | null
  subject: string | null
}

export function sumLifetimeValue(rows: LifetimeValueRow[] | null | undefined): number {
  return rows?.reduce((sum, row) => sum + (Number(row.lifetime_value) || 0), 0) || 0
}

export function formatDashboardCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M MXN`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K MXN`
  }
  return `$${value.toFixed(0)} MXN`
}

export function formatTimeAgo(dateStr: string, now = new Date()): string {
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHrs < 24) return `hace ${diffHrs}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

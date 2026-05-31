export interface PipelineStage {
  id: string
  pipeline_type: string
  stage_name: string
  stage_order: number
  color: string
}

export interface Deal {
  id: string
  name: string
  pipeline_type: string
  stage: string
  expected_value: number
  probability: number
  created_at: string
  contact_name: string
}

interface DealContactRow {
  first_name: string | null
  last_name: string | null
}

export interface PipelineDealRow {
  id: string
  name: string
  pipeline_type: string
  stage: string
  expected_value: number
  probability: number
  created_at: string
  crm_contacts?: DealContactRow | DealContactRow[] | null
}

export function mapPipelineDeal(row: PipelineDealRow): Deal {
  const contactRow = Array.isArray(row.crm_contacts) ? row.crm_contacts[0] : row.crm_contacts
  const firstName = contactRow?.first_name?.trim()
  const lastName = contactRow?.last_name?.trim()
  const contactName = firstName && lastName ? `${firstName} ${lastName}` : 'Unknown'

  return {
    id: row.id,
    name: row.name,
    pipeline_type: row.pipeline_type,
    stage: row.stage,
    expected_value: row.expected_value,
    probability: row.probability,
    created_at: row.created_at,
    contact_name: contactName,
  }
}

export function formatPipelineCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getDaysInStage(createdAt: string, now = new Date()): number {
  const created = new Date(createdAt)
  const diffTime = Math.abs(now.getTime() - created.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getStagesForPipeline(
  stages: PipelineStage[],
  activePipeline: string
): PipelineStage[] {
  return stages.filter((stage) => stage.pipeline_type === activePipeline)
}

export function getDealsForPipeline(deals: Deal[], activePipeline: string): Deal[] {
  return deals.filter((deal) => deal.pipeline_type === activePipeline)
}

export function getDealsForStage(deals: Deal[], stageName: string): Deal[] {
  return deals.filter((deal) => deal.stage === stageName)
}

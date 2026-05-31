import { describe, expect, it } from 'vitest'
import {
  formatPipelineCurrency,
  getDaysInStage,
  getDealsForPipeline,
  getDealsForStage,
  getStagesForPipeline,
  mapPipelineDeal,
  type Deal,
  type PipelineStage,
} from './helpers'

describe('pipeline helpers', () => {
  const deals: Deal[] = [
    {
      id: 'd1',
      name: 'Deal 1',
      pipeline_type: 'Owner Acquisition',
      stage: 'Qualified',
      expected_value: 10000,
      probability: 80,
      created_at: '2026-05-28T12:00:00.000Z',
      contact_name: 'Ana Perez',
    },
    {
      id: 'd2',
      name: 'Deal 2',
      pipeline_type: 'Direct Booking',
      stage: 'Closed',
      expected_value: 5000,
      probability: 100,
      created_at: '2026-05-20T12:00:00.000Z',
      contact_name: 'Unknown',
    },
  ]

  const stages: PipelineStage[] = [
    {
      id: 's1',
      pipeline_type: 'Owner Acquisition',
      stage_name: 'Qualified',
      stage_order: 1,
      color: '#fff',
    },
    {
      id: 's2',
      pipeline_type: 'Direct Booking',
      stage_name: 'Closed',
      stage_order: 2,
      color: '#000',
    },
  ]

  it('maps a deal row and composes the contact full name', () => {
    expect(
      mapPipelineDeal({
        id: 'd1',
        name: 'Deal 1',
        pipeline_type: 'Owner Acquisition',
        stage: 'Qualified',
        expected_value: 10000,
        probability: 80,
        created_at: '2026-05-28T12:00:00.000Z',
        crm_contacts: { first_name: ' Ana ', last_name: ' Perez ' },
      })
    ).toMatchObject({
      id: 'd1',
      contact_name: 'Ana Perez',
    })
  })

  it('maps missing contact data to Unknown', () => {
    expect(
      mapPipelineDeal({
        id: 'd2',
        name: 'Deal 2',
        pipeline_type: 'Direct Booking',
        stage: 'Closed',
        expected_value: 5000,
        probability: 100,
        created_at: '2026-05-20T12:00:00.000Z',
        crm_contacts: { first_name: 'Ana', last_name: null },
      }).contact_name
    ).toBe('Unknown')
  })

  it('formats pipeline values as MXN currency without cents', () => {
    expect(formatPipelineCurrency(123456)).toBe('$123,456')
  })

  it('calculates whole days in stage rounding partial days up', () => {
    const now = new Date('2026-05-31T12:00:00.000Z')
    expect(getDaysInStage('2026-05-30T18:00:00.000Z', now)).toBe(1)
  })

  it('filters stages by active pipeline', () => {
    expect(getStagesForPipeline(stages, 'Owner Acquisition')).toEqual([stages[0]])
  })

  it('filters deals by active pipeline', () => {
    expect(getDealsForPipeline(deals, 'Direct Booking')).toEqual([deals[1]])
  })

  it('filters deals by stage name', () => {
    expect(getDealsForStage(deals, 'Qualified')).toEqual([deals[0]])
  })
})

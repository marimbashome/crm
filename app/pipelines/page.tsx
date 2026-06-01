'use client'

import { useEffect, useState } from 'react'
import { Building2, Briefcase, ShoppingBag } from 'lucide-react'
import { createBrowserClientInstance } from '@/lib/supabase'
import {
  formatPipelineCurrency,
  getDaysInStage,
  getDealsForPipeline,
  getDealsForStage,
  getStagesForPipeline,
  mapPipelineDeal,
  type Deal,
  type PipelineDealRow,
  type PipelineStage,
} from './helpers'

const supabase = createBrowserClientInstance()

const pipelineIcons: Record<string, React.ReactNode> = {
  'Owner Acquisition': <Building2 className="w-4 h-4" />,
  'Rumae SaaS': <Briefcase className="w-4 h-4" />,
  'Direct Booking': <ShoppingBag className="w-4 h-4" />,
}

export default function PipelinesPage() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePipeline, setActivePipeline] = useState('Owner Acquisition')

  const pipelineTypes = ['Owner Acquisition', 'Rumae SaaS', 'Direct Booking']

  // Fetch pipeline stages
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('crm_pipeline_stages')
          .select('*')
          .order('pipeline_type', { ascending: true })
          .order('stage_order', { ascending: true })

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          setError(`Failed to load pipeline stages: ${fetchError.message}`)
          setStages([])
        } else {
          setStages(data || [])
        }
      } catch (err) {
        console.error('Error fetching stages:', err)
        setError('An unexpected error occurred while loading stages')
        setStages([])
      }
    }

    fetchStages()
  }, [])

  // Fetch deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('crm_pipelines')
          .select(
            `
            id,
            name,
            pipeline_type,
            stage,
            expected_value,
            probability,
            created_at,
            contact:crm_contacts!contact_id(first_name, last_name)
          `
          )
          .eq('outcome', 'open')

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          setError(`Failed to load deals: ${fetchError.message}`)
          setDeals([])
        } else {
          const formattedDeals = ((data || []) as PipelineDealRow[]).map(mapPipelineDeal)
          setDeals(formattedDeals)
        }
      } catch (err) {
        console.error('Error fetching deals:', err)
        setError('An unexpected error occurred while loading deals')
        setDeals([])
      } finally {
        setLoading(false)
      }
    }

    if (stages.length > 0) {
      fetchDeals()
    }
  }, [stages])

  const currentStages = getStagesForPipeline(stages, activePipeline)
  const currentDeals = getDealsForPipeline(deals, activePipeline)

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="border-b border-[#2a2a3a] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Sales Pipelines</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Manage deals across multiple sales pipelines
          </p>
        </div>
      </div>

      {/* Pipeline Tabs */}
      <div className="border-b border-[#2a2a3a] sticky top-0 bg-[#0f0f1a] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 py-3 sm:py-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {pipelineTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActivePipeline(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activePipeline === type
                    ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                    : 'bg-[#1a1a2e] text-slate-300 border border-[#2a2a3a] hover:border-[#3a3a4a]'
                }`}
              >
                {pipelineIcons[type]}
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-slate-400">Loading pipelines...</div>
            </div>
          )}

          {/* Kanban Board */}
          {!loading && !error && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-6 min-w-max">
                {currentStages.map((stage) => {
                  const stageDeals = getDealsForStage(currentDeals, stage.stage_name)
                  return (
                    <div
                      key={stage.id}
                      className="flex-shrink-0 w-[260px] sm:w-[280px] flex flex-col"
                    >
                      {/* Column Header */}
                      <div
                        className="relative p-4 rounded-t-lg bg-[#12121a] border border-[#2a2a3a] border-b-0"
                        style={{
                          borderTopColor: stage.color,
                          borderTopWidth: '3px',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">
                            {stage.stage_name}
                          </h3>
                          <span className="px-2 py-1 rounded bg-[#1a1a2e] text-xs text-slate-400">
                            {stageDeals.length}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Column Content */}
                      <div className="flex-1 bg-[#12121a] border border-t-0 border-[#2a2a3a] rounded-b-lg p-3 space-y-3 min-h-[300px]">
                        {stageDeals.length === 0 ? (
                          <div className="text-center py-12 text-slate-500 text-sm">
                            No deals
                          </div>
                        ) : (
                          stageDeals.map((deal) => (
                            <div
                              key={deal.id}
                              className="p-3 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] hover:border-[#3a3a4a] transition-colors cursor-pointer group"
                            >
                              <div className="font-medium text-sm mb-1 truncate">
                                {deal.name}
                              </div>
                              <div className="text-xs text-slate-400 mb-2 truncate">
                                {deal.contact_name}
                              </div>

                              <div className="space-y-1 mb-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500">Value</span>
                                  <span className="font-semibold text-yellow-400">
                                    {formatPipelineCurrency(deal.expected_value)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500">Probability</span>
                                  <span className="font-semibold">
                                    {deal.probability}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500">Days</span>
                                  <span className="font-semibold">
                                    {getDaysInStage(deal.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Building2, Briefcase, ShoppingBag, X } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PipelineStage {
  id: string
  pipeline_type: string
  stage_name: string
  stage_order: number
  color: string
}

interface Deal {
  id: string
  name: string
  pipeline_type: string
  stage: string
  expected_value: number
  probability: number
  created_at: string
  contact_name: string
}

interface NewDeal {
  contact_name: string
  pipeline_type: string
  stage: string
  name: string
  expected_value: string
}

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
  const [showNewDealForm, setShowNewDealForm] = useState(false)
  const [newDeal, setNewDeal] = useState<NewDeal>({
    contact_name: '',
    pipeline_type: 'Owner Acquisition',
    stage: '',
    name: '',
    expected_value: '',
  })

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
            crm_contacts(first_name, last_name)
          `
          )
          .eq('outcome', 'open')

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          setError(`Failed to load deals: ${fetchError.message}`)
          setDeals([])
        } else {
          const formattedDeals = (data || []).map((deal: any) => ({
            id: deal.id,
            name: deal.name,
            pipeline_type: deal.pipeline_type,
            stage: deal.stage,
            expected_value: deal.expected_value,
            probability: deal.probability,
            created_at: deal.created_at,
            contact_name:
              deal.crm_contacts?.first_name && deal.crm_contacts?.last_name
                ? `${deal.crm_contacts.first_name} ${deal.crm_contacts.last_name}`
                : 'Unknown',
          }))
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getDaysInStage = (createdAt: string): number => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSaveNewDeal = () => {
    console.log('Save new deal:', {
      contact_name: newDeal.contact_name,
      pipeline_type: newDeal.pipeline_type,
      stage: newDeal.stage,
      name: newDeal.name,
      expected_value: parseFloat(newDeal.expected_value),
    })
    // TODO: Add Supabase insert here
    setNewDeal({
      contact_name: '',
      pipeline_type: activePipeline,
      stage: '',
      name: '',
      expected_value: '',
    })
    setShowNewDealForm(false)
  }

  const currentStages = stages.filter((s) => s.pipeline_type === activePipeline)
  const currentDeals = deals.filter((d) => d.pipeline_type === activePipeline)

  const getDealsForStage = (stageName: string) => {
    return currentDeals.filter((d) => d.stage === stageName)
  }

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
                  const stageDeals = getDealsForStage(stage.stage_name)
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
                                    {formatCurrency(deal.expected_value)}
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

      {/* New Deal FAB */}
      <button
        onClick={() => {
          setNewDeal({
            ...newDeal,
            pipeline_type: activePipeline,
            stage: currentStages.length > 0 ? currentStages[0].stage_name : '',
          })
          setShowNewDealForm(true)
        }}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-yellow-500/30 text-yellow-200 border border-yellow-500/50 hover:bg-yellow-500/40 transition-colors shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* New Deal Modal */}
      {showNewDealForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Deal</h2>
              <button
                onClick={() => setShowNewDealForm(false)}
                className="p-1 hover:bg-[#2a2a3a] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={newDeal.contact_name}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, contact_name: e.target.value })
                  }
                  placeholder="Enter contact name"
                  className="w-full px-3 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Pipeline Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Pipeline Type
                </label>
                <select
                  value={newDeal.pipeline_type}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, pipeline_type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  {pipelineTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Stage
                </label>
                <select
                  value={newDeal.stage}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, stage: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="">Select a stage</option>
                  {stages
                    .filter((s) => s.pipeline_type === newDeal.pipeline_type)
                    .map((stage) => (
                      <option key={stage.id} value={stage.stage_name}>
                        {stage.stage_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Deal Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Deal Name
                </label>
                <input
                  type="text"
                  value={newDeal.name}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, name: e.target.value })
                  }
                  placeholder="Enter deal name"
                  className="w-full px-3 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Expected Value */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Expected Value (MXN)
                </label>
                <input
                  type="number"
                  value={newDeal.expected_value}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, expected_value: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewDealForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-slate-300 font-medium hover:border-[#3a3a4a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewDeal}
                  className="flex-1 px-4 py-2 rounded-lg bg-yellow-500/30 text-yellow-200 border border-yellow-500/50 font-medium hover:bg-yellow-500/40 transition-colors"
                >
                  Create Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

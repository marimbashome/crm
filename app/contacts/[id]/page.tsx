'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Calendar,
  ShoppingCart,
  LogIn,
  MessageSquare,
  Mail,
  Phone,
  Star,
  CheckCircle,
  Circle,
  StickyNote,
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CrmContact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  contact_type: 'Guest' | 'Lead' | 'Owner' | 'B2B'
  guest_tier?: 'VIP' | 'Frequent' | 'Standard' | 'At-Risk'
  source?: string
  channel_acquired?: string
  created_at: string
  tags?: string[]
  lifetime_value: number
  stays_count: number
  avg_nightly_rate?: number
  last_stay_date?: string
  minibar_spend?: number
  review_score_given?: number
  properties_count?: number
  contract_start?: string
  contract_end?: string
  monthly_rent_paid?: number
  owner_satisfaction?: number
}

interface CrmInteraction {
  id: string
  contact_id: string
  interaction_type: 'reservation' | 'check_in' | 'minibar' | 'review' | 'inquiry' | 'other'
  subject: string
  created_at: string
}

interface CrmContactNote {
  id: string
  contact_id: string
  text: string
  created_by?: string
  created_at: string
}

interface CrmTask {
  id: string
  contact_id: string
  text: string
  due_date?: string
  done_date?: string
  created_at: string
}

const tierColors: Record<string, string> = {
  VIP: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
  Frequent: 'bg-green-500/20 text-green-200 border border-green-500/30',
  Standard: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  'At-Risk': 'bg-red-500/20 text-red-200 border border-red-500/30',
}

const typeColors: Record<string, string> = {
  Guest: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  Lead: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
  Owner: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
  B2B: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
}

const interactionIcons: Record<string, any> = {
  reservation: Calendar,
  check_in: LogIn,
  minibar: ShoppingCart,
  review: Star,
  inquiry: MessageSquare,
  other: MessageSquare,
}

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string

  const [contact, setContact] = useState<CrmContact | null>(null)
  const [interactions, setInteractions] = useState<CrmInteraction[]>([])
  const [notes, setNotes] = useState<CrmContactNote[]>([])
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMoreInteractions, setShowMoreInteractions] = useState(false)

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch contact
        const { data: contactData, error: contactError } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('id', contactId)
          .single()

        if (contactError) {
          setError(`Failed to load contact: ${contactError.message}`)
          return
        }

        setContact(contactData)

        // Fetch interactions
        const { data: interactionsData } = await supabase
          .from('crm_interactions')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })

        setInteractions(interactionsData || [])

        // Fetch notes
        const { data: notesData } = await supabase
          .from('crm_contact_notes')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })

        setNotes(notesData || [])

        // Fetch tasks
        const { data: tasksData } = await supabase
          .from('crm_tasks')
          .select('*')
          .eq('contact_id', contactId)
          .order('due_date', { ascending: true })

        setTasks(tasksData || [])
      } catch (err) {
        console.error('Error fetching contact details:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (contactId) {
      fetchContactDetails()
    }
  }, [contactId])

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-400">Loading contact details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/contacts')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Contacts
          </button>
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200">
            {error || 'Contact not found'}
          </div>
        </div>
      </div>
    )
  }

  const displayedInteractions = showMoreInteractions ? interactions : interactions.slice(0, 20)
  const hasMoreInteractions = interactions.length > 20 && !showMoreInteractions

  const guestFields = contact.contact_type === 'Guest'
  const ownerFields = contact.contact_type === 'Owner'

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Navigation */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2a2a3a]">
        <button
          onClick={() => router.push('/contacts')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Contacts
        </button>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column (60%) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Contact Header */}
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                <div className="mb-3 sm:mb-4">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 break-words">
                    {contact.first_name} {contact.last_name}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    {contact.guest_tier && (
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          tierColors[contact.guest_tier] || tierColors['Standard']
                        }`}
                      >
                        {contact.guest_tier}
                      </span>
                    )}
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                        typeColors[contact.contact_type]
                      }`}
                    >
                      {contact.contact_type}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs border border-slate-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="text-[#C9A96E] mt-1" size={20} />
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white font-medium">{contact.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="text-[#C9A96E] mt-1" size={20} />
                      <div>
                        <p className="text-slate-400 text-sm">Phone</p>
                        <p className="text-white font-medium">{contact.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  {contact.source && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Source</p>
                      <p className="text-white">{contact.source}</p>
                    </div>
                  )}

                  {/* Channel Acquired */}
                  {contact.channel_acquired && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Channel Acquired</p>
                      <p className="text-white">{contact.channel_acquired}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Created</p>
                    <p className="text-white">{formatDate(contact.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Guest-Specific Fields */}
              {guestFields && (
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Guest Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Lifetime Value</p>
                      <p className="text-xl font-semibold text-[#C9A96E]">
                        {formatCurrency(contact.lifetime_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Total Stays</p>
                      <p className="text-xl font-semibold text-white">
                        {contact.stays_count}
                      </p>
                    </div>
                    {contact.avg_nightly_rate !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Avg Nightly Rate</p>
                        <p className="text-xl font-semibold text-white">
                          {formatCurrency(contact.avg_nightly_rate)}
                        </p>
                      </div>
                    )}
                    {contact.last_stay_date && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Last Stay</p>
                        <p className="text-xl font-semibold text-white">
                          {formatDate(contact.last_stay_date)}
                        </p>
                      </div>
                    )}
                    {contact.minibar_spend !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Minibar Spend</p>
                        <p className="text-xl font-semibold text-white">
                          {formatCurrency(contact.minibar_spend)}
                        </p>
                      </div>
                    )}
                    {contact.review_score_given !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Review Score</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={
                                i < contact.review_score_given!
                                  ? 'text-[#C9A96E] fill-[#C9A96E]'
                                  : 'text-slate-600'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Owner-Specific Fields */}
              {ownerFields && (
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Owner Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contact.properties_count !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Properties</p>
                        <p className="text-xl font-semibold text-white">
                          {contact.properties_count}
                        </p>
                      </div>
                    )}
                    {contact.contract_start && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Contract Start</p>
                        <p className="text-xl font-semibold text-white">
                          {formatDate(contact.contract_start)}
                        </p>
                      </div>
                    )}
                    {contact.contract_end && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Contract End</p>
                        <p className="text-xl font-semibold text-white">
                          {formatDate(contact.contract_end)}
                        </p>
                      </div>
                    )}
                    {contact.monthly_rent_paid !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Monthly Rent Paid</p>
                        <p className="text-xl font-semibold text-[#C9A96E]">
                          {formatCurrency(contact.monthly_rent_paid)}
                        </p>
                      </div>
                    )}
                    {contact.owner_satisfaction !== undefined && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Satisfaction Score</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={
                                i < contact.owner_satisfaction!
                                  ? 'text-[#C9A96E] fill-[#C9A96E]'
                                  : 'text-slate-600'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (40%) */}
            <div className="space-y-4 sm:space-y-6">
              {/* Activity Timeline */}
              {interactions.length > 0 && (
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {displayedInteractions.map((interaction) => {
                      const IconComponent = interactionIcons[interaction.interaction_type]
                      return (
                        <div key={interaction.id} className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <IconComponent
                              size={18}
                              className="text-[#C9A96E]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {interaction.subject}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {formatTime(interaction.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {hasMoreInteractions && (
                    <button
                      onClick={() => setShowMoreInteractions(true)}
                      className="mt-4 w-full px-3 py-2 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-sm font-medium"
                    >
                      Show More ({interactions.length - 20})
                    </button>
                  )}
                </div>
              )}

              {/* Notes Section */}
              {notes.length > 0 && (
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <StickyNote size={20} className="text-[#C9A96E]" />
                    Notes
                  </h2>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-500/10 rounded-lg p-3 border border-slate-500/20"
                      >
                        <p className="text-white text-sm">{note.text}</p>
                        <div className="flex justify-between items-center mt-2">
                          {note.created_by && (
                            <p className="text-slate-500 text-xs">by {note.created_by}</p>
                          )}
                          <p className="text-slate-500 text-xs">
                            {formatTime(note.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Section */}
              {tasks.length > 0 && (
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4">Tasks</h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-2">
                        <div className="flex-shrink-0 mt-1">
                          {task.done_date ? (
                            <CheckCircle size={18} className="text-green-500" />
                          ) : (
                            <Circle size={18} className="text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              task.done_date
                                ? 'text-slate-500 line-through'
                                : 'text-white'
                            }`}
                          >
                            {task.text}
                          </p>
                          {task.due_date && (
                            <p className="text-slate-500 text-xs">
                              {formatTime(task.due_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
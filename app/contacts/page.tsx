'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CrmContact {
  id: string
  first_name: string
  last_name: string
  email: string
  contact_type: 'Guest' | 'Lead' | 'Owner' | 'B2B'
  guest_tier?: 'VIP' | 'Frequent' | 'Standard' | 'At-Risk'
  lifetime_value: number
  stays_count: number
  source?: string
  last_seen?: string
}

const tierColors: Record<string, string> = {
  VIP: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
  Frequent: 'bg-green-500/20 text-green-200 border border-green-500/30',
  Standard: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  'At-Risk': 'bg-red-500/20 text-red-200 border border-red-500/30',
}

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<CrmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedTier, setSelectedTier] = useState<string>('All')
  const [displayCount, setDisplayCount] = useState(50)

  // Fetch contacts on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        setError(null)

        // NOTE: RLS is enabled on crm_contacts table. Using anon key with NEXT_PUBLIC_SUPABASE_ANON_KEY
        // will only return data if RLS policies allow public access. For production, either:
        // 1. Replace with service_role key (server-side only)
        // 2. Implement proper auth flow with authenticated user
        // 3. Create RLS policy that allows anon access to specific columns/rows
        
        const { data, error: fetchError } = await supabase
          .from('crm_contacts')
          .select('*')
          .order('lifetime_value', { ascending: false })

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          setError(`Failed to load contacts: ${fetchError.message}`)
          setContacts([])
        } else {
          setContacts(data || [])
        }
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError('An unexpected error occurred')
        setContacts([])
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let result = contacts

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter((c) => c.contact_type === selectedType)
    }

    // Tier filter
    if (selectedTier !== 'All') {
      result = result.filter((c) => c.guest_tier === selectedTier)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.first_name.toLowerCase().includes(query) ||
          c.last_name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      )
    }

    setFilteredContacts(result)
  }, [contacts, selectedType, selectedTier, searchQuery])

  const displayedContacts = filteredContacts.slice(0, displayCount)
  const hasMore = displayCount < filteredContacts.length

  const formatCurrency = (value: number) => {
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

  const getTierBadge = (tier?: string) => {
    if (!tier || tier === 'At-Risk') {
      return (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${tierColors[tier || 'Standard']}`}
        >
          {tier || 'Standard'}
        </span>
      )
    }
    return (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-medium ${tierColors[tier]}`}
      >
        {tier}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contacts</h1>
          <p className="text-slate-400">
            Manage and track all your contacts
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 space-y-4">
          {/* Contact Type Filters */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Guests', 'Leads', 'Owners', 'B2B'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type === 'All' ? 'All' : type.slice(0, -1))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedType === (type === 'All' ? 'All' : type.slice(0, -1))
                    ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                    : 'bg-[#1a1a2e] text-slate-300 border border-[#2a2a3a] hover:border-[#3a3a4a]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Guest Tier Filters */}
          <div className="flex flex-wrap gap-2">
            {['All', 'VIP', 'Frequent', 'Standard', 'At-Risk'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTier === tier
                    ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                    : 'bg-[#1a1a2e] text-slate-300 border border-[#2a2a3a] hover:border-[#3a3a4a]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-400">Loading contacts...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">
              {searchQuery || selectedType !== 'All' || selectedTier !== 'All'
                ? 'No contacts match your filters'
                : 'No contacts found'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredContacts.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Tier
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      LTV
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Stays
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                      className="border-b border-[#2a2a3a] hover:bg-[#1f1f2d] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {contact.contact_type}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 truncate">
                        {contact.email}
                      </td>
                      <td className="py-4 px-4">
                        {getTierBadge(contact.guest_tier)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-yellow-400">
                        {formatCurrency(contact.lifetime_value)}
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {contact.stays_count}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {contact.source || '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {formatDate(contact.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 50)}
                  className="px-6 py-2 rounded-lg bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors font-medium"
                >
                  Load More ({filteredContacts.length - displayCount} remaining)
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-6 text-slate-400 text-sm">
              Showing {displayedContacts.length} of {filteredContacts.length} contacts
            </div>
          </>
        )}
      </div>
    </div>
  )
}
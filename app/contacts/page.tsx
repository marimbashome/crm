'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 50

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedTier, setSelectedTier] = useState<string>('All')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input — reset page on new search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 350)
  }

  // Reset page when filters change
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setPage(0)
  }

  const handleTierChange = (tier: string) => {
    setSelectedTier(tier)
    setPage(0)
  }

  // Fetch one page of contacts from Supabase with server-side filtering
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        setError(null)

        const from = page * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('crm_contacts')
          .select(
            'id,first_name,last_name,email,contact_type,guest_tier,lifetime_value,stays_count,source,last_seen',
            { count: 'exact' }
          )
          .order('lifetime_value', { ascending: false })
          .range(from, to)

        // Server-side type filter
        if (selectedType !== 'All') {
          query = query.eq('contact_type', selectedType)
        }

        // Server-side tier filter
        if (selectedTier !== 'All') {
          query = query.eq('guest_tier', selectedTier)
        }

        // Server-side search (ilike on name / email)
        if (debouncedSearch.trim()) {
          const term = `%${debouncedSearch.trim()}%`
          query = query.or(
            `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`
          )
        }

        const { data, error: fetchError, count } = await query

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          setError(`Failed to load contacts: ${fetchError.message}`)
          setContacts([])
          setTotalCount(0)
        } else {
          setContacts(data || [])
          setTotalCount(count ?? 0)
        }
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError('An unexpected error occurred')
        setContacts([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [page, selectedType, selectedTier, debouncedSearch])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const displayedContacts = contacts

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
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Contacts</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Manage and track all your contacts
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
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
                onClick={() => handleTypeChange(type === 'All' ? 'All' : type.slice(0, -1))}
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
                onClick={() => handleTierChange(tier)}
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
        {!loading && !error && totalCount === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">
              {debouncedSearch || selectedType !== 'All' || selectedTier !== 'All'
                ? 'No contacts match your filters'
                : 'No contacts found'}
            </p>
          </div>
        )}

        {/* Contact List */}
        {!loading && !error && totalCount > 0 && (
          <>
            {/* Mobile: Card layout */}
            <div className="space-y-3 md:hidden">
              {displayedContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="p-4 rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] hover:border-[#3a3a4a] cursor-pointer transition-colors active:bg-[#1f1f2d]"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{contact.email}</p>
                    </div>
                    {getTierBadge(contact.guest_tier)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="font-semibold text-yellow-400">{formatCurrency(contact.lifetime_value)}</span>
                    <span>{contact.stays_count} stays</span>
                    <span>{contact.source || '—'}</span>
                    <span className="ml-auto">{formatDate(contact.last_seen)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="overflow-x-auto hidden md:block">
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
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm hidden lg:table-cell">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm hidden lg:table-cell">
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
                      <td className="py-4 px-4 text-slate-300 truncate max-w-[200px]">
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
                      <td className="py-4 px-4 text-slate-400 text-sm hidden lg:table-cell">
                        {contact.source || '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm hidden lg:table-cell">
                        {formatDate(contact.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-slate-300 border border-[#2a2a3a] hover:border-[#3a3a4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  ← Previous
                </button>
                <span className="text-slate-400 text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-slate-300 border border-[#2a2a3a] hover:border-[#3a3a4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-4 text-slate-400 text-sm">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} contacts
            </div>
          </>
        )}
      </div>
    </div>
  )
}
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTokenMock = vi.fn()
const createClientMock = vi.fn()

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

type QueryResult = {
  data?: unknown
  error?: unknown
}

function createSupabaseMock(results: Record<string, QueryResult>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return results[table] ?? { data: null, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('GET /api/airbnb-history', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.NEXTAUTH_SECRET = 'nextauth-secret'
  })

  afterEach(() => {
    consoleErrorSpy.mockClear()
  })

  it('returns 401 when the request is unauthenticated', async () => {
    getTokenMock.mockResolvedValue(null)

    const { GET } = await import('@/app/api/airbnb-history/route')
    const response = await GET(new NextRequest('https://crm.test/api/airbnb-history?contact_id=1'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns an empty payload when contact_id is missing', async () => {
    getTokenMock.mockResolvedValue({ sub: 'user-1' })

    const { GET } = await import('@/app/api/airbnb-history/route')
    const response = await GET(new NextRequest('https://crm.test/api/airbnb-history'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      risk_signal: null,
      prior_stays: null,
      is_blocked_on_airbnb: false,
    })
  })

  it('returns an empty payload when the contact has no guest_id', async () => {
    getTokenMock.mockResolvedValue({ sub: 'user-1' })
    createClientMock.mockReturnValue(
      createSupabaseMock({
        crm_contacts: { data: { guest_id: null }, error: null },
      })
    )

    const { GET } = await import('@/app/api/airbnb-history/route')
    const response = await GET(new NextRequest('https://crm.test/api/airbnb-history?contact_id=1'))

    await expect(response.json()).resolves.toEqual({
      risk_signal: null,
      prior_stays: null,
      is_blocked_on_airbnb: false,
    })
  })

  it('returns the Airbnb history when all lookups succeed', async () => {
    getTokenMock.mockResolvedValue({ sub: 'user-1' })
    createClientMock.mockReturnValue(
      createSupabaseMock({
        crm_contacts: { data: { guest_id: 'guest-1' }, error: null },
        guests: { data: { airbnb_user_id: 'airbnb-1' }, error: null },
        guest_airbnb_history: {
          data: { risk_signal: 'high', prior_stays: 4, is_blocked_on_airbnb: true },
          error: null,
        },
      })
    )

    const { GET } = await import('@/app/api/airbnb-history/route')
    const response = await GET(new NextRequest('https://crm.test/api/airbnb-history?contact_id=1'))

    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      })
    )
    await expect(response.json()).resolves.toEqual({
      risk_signal: 'high',
      prior_stays: 4,
      is_blocked_on_airbnb: true,
    })
  })

  it('falls back to an empty payload when the service-role client throws', async () => {
    getTokenMock.mockResolvedValue({ sub: 'user-1' })
    createClientMock.mockImplementation(() => {
      throw new Error('boom')
    })

    const { GET } = await import('@/app/api/airbnb-history/route')
    const response = await GET(new NextRequest('https://crm.test/api/airbnb-history?contact_id=1'))

    await expect(response.json()).resolves.toEqual({
      risk_signal: null,
      prior_stays: null,
      is_blocked_on_airbnb: false,
    })
  })
})

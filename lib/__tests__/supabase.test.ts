import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()
const createBrowserClientMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock,
}))

const ORIGINAL_ENV = process.env

describe('supabase helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('creates the server client with cookie shims and validated env vars', async () => {
    const serverClient = { kind: 'server' }
    createServerClientMock.mockReturnValue(serverClient)

    const { createClient } = await import('@/lib/supabase')

    expect(createClient()).toBe(serverClient)
    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )
  })

  it('creates the browser client with validated public env vars', async () => {
    const browserClient = { kind: 'browser' }
    createBrowserClientMock.mockReturnValue(browserClient)

    const { createBrowserClientInstance } = await import('@/lib/supabase')

    expect(createBrowserClientInstance()).toBe(browserClient)
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    )
  })

  it('throws loudly when a public env var is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const { createBrowserClientInstance } = await import('@/lib/supabase')

    expect(() => createBrowserClientInstance()).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
    )
  })
})

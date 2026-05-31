import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

describe('authOptions', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      NEXTAUTH_SECRET: 'nextauth-secret',
    }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('allows only explicitly listed emails, case-insensitively', async () => {
    const { authOptions } = await import('@/lib/auth')

    await expect(
      authOptions.callbacks?.signIn?.({ user: { email: 'ENRIQUE@marimbashome.com' } } as never)
    ).resolves.toBe(true)

    await expect(
      authOptions.callbacks?.signIn?.({ user: { email: 'other@example.com' } } as never)
    ).resolves.toBe(false)
  })

  it('copies the user email into the jwt token when the user is present', async () => {
    const { authOptions } = await import('@/lib/auth')

    await expect(
      authOptions.callbacks?.jwt?.({
        token: { sub: '123' },
        user: { email: 'enrique@marimbashome.com' },
      } as never)
    ).resolves.toMatchObject({ email: 'enrique@marimbashome.com', sub: '123' })
  })

  it('copies the jwt email onto the session user', async () => {
    const { authOptions } = await import('@/lib/auth')

    await expect(
      authOptions.callbacks?.session?.({
        session: { user: { name: 'Enrique' } },
        token: { email: 'enrique@marimbashome.com' },
      } as never)
    ).resolves.toMatchObject({
      user: { email: 'enrique@marimbashome.com', name: 'Enrique' },
    })
  })
})

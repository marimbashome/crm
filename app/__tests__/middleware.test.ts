import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTokenMock = vi.fn()

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}))

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips auth checks for next-auth routes', async () => {
    const { middleware } = await import('@/middleware')

    const response = await middleware(new NextRequest('https://crm.test/api/auth/session'))

    expect(getTokenMock).not.toHaveBeenCalled()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('redirects authenticated users away from the login page', async () => {
    getTokenMock.mockResolvedValue({ email: 'enrique@marimbashome.com' })

    const { middleware } = await import('@/middleware')

    const response = await middleware(new NextRequest('https://crm.test/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://crm.test/')
  })

  it('redirects unauthenticated protected requests to login with callbackUrl', async () => {
    getTokenMock.mockResolvedValue(null)

    const { middleware } = await import('@/middleware')

    const response = await middleware(new NextRequest('https://crm.test/contacts?page=2'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://crm.test/login?callbackUrl=https%3A%2F%2Fcrm.test%2Fcontacts%3Fpage%3D2'
    )
  })

  it('allows authenticated protected requests through', async () => {
    getTokenMock.mockResolvedValue({ email: 'enrique@marimbashome.com' })

    const { middleware } = await import('@/middleware')

    const response = await middleware(new NextRequest('https://crm.test/contacts'))

    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})

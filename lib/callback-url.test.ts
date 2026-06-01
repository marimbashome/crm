import { describe, expect, it } from 'vitest'
import { getSafeCallbackUrl } from './callback-url'

describe('getSafeCallbackUrl', () => {
  it('keeps same-origin absolute callback URLs as internal paths', () => {
    expect(
      getSafeCallbackUrl(
        'https://crm.test/contacts/123?tab=notes',
        'https://crm.test'
      )
    ).toBe('/contacts/123?tab=notes')
  })

  it('keeps relative callback URLs', () => {
    expect(getSafeCallbackUrl('/pipelines?stage=open', 'https://crm.test')).toBe('/pipelines?stage=open')
  })

  it('rejects external callback URLs', () => {
    expect(getSafeCallbackUrl('https://evil.test/phish', 'https://crm.test')).toBe('/')
  })
})

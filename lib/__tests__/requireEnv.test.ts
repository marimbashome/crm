import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { requireEnv, requireEnvValue } from '@/lib/requireEnv'

const ORIGINAL_ENV = process.env

describe('requireEnv', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('returns the value when the variable is set', () => {
    process.env.TEST_REQUIRED_ENV = 'value'

    expect(requireEnv('TEST_REQUIRED_ENV')).toBe('value')
  })

  it('throws when the variable is unset', () => {
    delete process.env.TEST_REQUIRED_ENV

    expect(() => requireEnv('TEST_REQUIRED_ENV')).toThrow(
      'Missing required environment variable: TEST_REQUIRED_ENV'
    )
  })

  it('throws when the variable is empty', () => {
    process.env.TEST_REQUIRED_ENV = ''

    expect(() => requireEnv('TEST_REQUIRED_ENV')).toThrow(
      'Missing required environment variable: TEST_REQUIRED_ENV'
    )
  })

  it('returns an explicit env value when present', () => {
    expect(requireEnvValue('value', 'TEST_REQUIRED_ENV')).toBe('value')
  })

  it('throws for an explicit empty env value', () => {
    expect(() => requireEnvValue('', 'TEST_REQUIRED_ENV')).toThrow(
      'Missing required environment variable: TEST_REQUIRED_ENV'
    )
  })
})

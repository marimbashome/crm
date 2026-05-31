import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('skips falsey values and object keys that are false', () => {
    expect(cn('base', false && 'hidden', null, undefined, { active: true, disabled: false })).toBe(
      'base active'
    )
  })

  it('merges conflicting tailwind classes keeping the last winner', () => {
    expect(cn('px-2', 'px-4', 'text-sm', 'text-lg')).toBe('px-4 text-lg')
  })
})

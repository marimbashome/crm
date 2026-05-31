import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

type Violation = {
  file: string
  reasons: string[]
}

const repoRoot = path.resolve(__dirname, '../..')

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function findViolations(): Violation[] {
  const candidates = ['app/api/airbnb-history/route.ts']

  return candidates.flatMap((file) => {
    const source = read(file)
    const reasons: string[] = []

    if (source.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      reasons.push('uses service role credentials')
    }

    if (source.includes(".from('crm_contacts')") && !source.includes(".eq('org_id'")) {
      reasons.push('crm_contacts lookup has no explicit org_id filter')
    }

    if (source.includes(".from('guests')") && !source.includes(".eq('org_id'")) {
      reasons.push('guests lookup has no explicit org_id filter')
    }

    return reasons.length > 0 ? [{ file, reasons }] : []
  })
}

describe('multi-tenant structural guardrails', () => {
  it('does not expose service-role credentials in client code', () => {
    const clientFiles = [
      'app/contacts/page.tsx',
      'app/contacts/[id]/page.tsx',
      'app/pipelines/page.tsx',
      'app/segments/page.tsx',
      'app/tags/page.tsx',
      'components/AuthProvider.tsx',
    ]

    for (const file of clientFiles) {
      expect(read(file)).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    }
  })

  it('captures current server-side tenancy violations for manual review', () => {
    expect(findViolations()).toEqual([
      {
        file: 'app/api/airbnb-history/route.ts',
        reasons: [
          'uses service role credentials',
          'crm_contacts lookup has no explicit org_id filter',
          'guests lookup has no explicit org_id filter',
        ],
      },
    ])
  })
})

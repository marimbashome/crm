// app/api/airbnb-history/route.ts
// GET /api/airbnb-history?contact_id=<uuid>
//
// Lookup path: crm_contacts.guest_id -> guests.airbnb_user_id -> guest_airbnb_history
// Uses service role to read the materialized view (not exposed via anon key by default).
//
// Returns: { risk_signal, prior_stays, is_blocked_on_airbnb } or { risk_signal: null }
// when the contact has no guest_id, no airbnb_user_id, or no row in the view.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken } from 'next-auth/jwt'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isNoRowsError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'PGRST116'
  )
}

function emptyHistoryPayload() {
  return {
    risk_signal: null,
    prior_stays: null,
    is_blocked_on_airbnb: false,
  }
}

function upstreamError(stage: string, error: unknown) {
  console.error(`[airbnb-history] ${stage} failed`, error)
  return NextResponse.json({ error: 'Failed to load Airbnb history' }, { status: 502 })
}

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // P0-16 fix (2026-05-16): explicit auth guard. The crm middleware already
  // redirects unauthenticated requests to /login, but API callers see a 307
  // redirect to /login HTML instead of a clean 401. This guard short-circuits
  // and returns 401 JSON before any data lookup. Defense in depth.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contactId = req.nextUrl.searchParams.get('contact_id')
  if (!contactId || !UUID_RE.test(contactId)) {
    return NextResponse.json({ error: 'Invalid contact_id' }, { status: 400 })
  }

  // Tenancy note: this route reads via the service-role client without an org_id
  // filter by design. CRM sign-in is gated to a 2-email allowlist (lib/auth.ts
  // ALLOWED_EMAILS) — both Marimbas staff with full access to all data, so there
  // is no second tenant whose contact_id could be probed (no cross-org exposure).
  // If CRM ever onboards external/multi-org users, scope this lookup to the
  // caller's org_id.

  try {
    const sv = createServiceRoleClient()

    // Step 1: get guest_id from crm_contacts
    const { data: contact, error: contactErr } = await sv
      .from('crm_contacts')
      .select('guest_id')
      .eq('id', contactId)
      .single()

    if (contactErr) {
      return isNoRowsError(contactErr)
        ? NextResponse.json(emptyHistoryPayload())
        : upstreamError('contact lookup', contactErr)
    }

    if (!contact?.guest_id) {
      return NextResponse.json(emptyHistoryPayload())
    }

    // Step 2: get airbnb_user_id from guests
    const { data: guest, error: guestErr } = await sv
      .from('guests')
      .select('airbnb_user_id')
      .eq('id', contact.guest_id)
      .single()

    if (guestErr) {
      return isNoRowsError(guestErr)
        ? NextResponse.json(emptyHistoryPayload())
        : upstreamError('guest lookup', guestErr)
    }

    if (!guest?.airbnb_user_id) {
      return NextResponse.json(emptyHistoryPayload())
    }

    // Step 3: lookup guest_airbnb_history
    const { data: history, error: histErr } = await sv
      .from('guest_airbnb_history')
      .select('risk_signal, prior_stays, is_blocked_on_airbnb')
      .eq('airbnb_user_id', guest.airbnb_user_id)
      .single()

    if (histErr) {
      return isNoRowsError(histErr)
        ? NextResponse.json(emptyHistoryPayload())
        : upstreamError('history lookup', histErr)
    }

    if (!history) {
      return NextResponse.json(emptyHistoryPayload())
    }

    return NextResponse.json({
      risk_signal: history.risk_signal ?? null,
      prior_stays: history.prior_stays ?? null,
      is_blocked_on_airbnb: history.is_blocked_on_airbnb ?? false,
    })
  } catch (err) {
    console.error('[airbnb-history] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

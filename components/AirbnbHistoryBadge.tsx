// components/AirbnbHistoryBadge.tsx
// Small semantic chip showing a guest's Airbnb risk signal from guest_airbnb_history.
// Pure presentational — no data fetching. Works in both mobile and desktop contexts.

import React from 'react'

export type AirbnbRiskSignal =
  | 'HARD_BLOCK'
  | 'HIGH_REVIEW_HOSTILITY'
  | 'HIGH_REPEAT_FLAGS'
  | 'MEDIUM_FLAGGED'
  | 'MEDIUM_REVIEW_HOSTILITY'
  | 'LOYAL_GUEST'
  | 'RETURNING_GUEST'
  | 'NORMAL'
  | string

export interface AirbnbHistoryData {
  risk_signal: AirbnbRiskSignal | null
  prior_stays: number | null
  is_blocked_on_airbnb: boolean
}

// Semantic color map — matches Marimbas brand palette
const SIGNAL_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  HARD_BLOCK: {
    bg: 'rgba(194,106,79,0.15)',
    border: '#c26a4f',
    text: '#c26a4f',
    dot: '#c26a4f',
  },
  HIGH_REVIEW_HOSTILITY: {
    bg: 'rgba(194,106,79,0.15)',
    border: '#c26a4f',
    text: '#c26a4f',
    dot: '#c26a4f',
  },
  HIGH_REPEAT_FLAGS: {
    bg: 'rgba(212,160,74,0.15)',
    border: '#d4a04a',
    text: '#d4a04a',
    dot: '#d4a04a',
  },
  MEDIUM_FLAGGED: {
    bg: 'rgba(212,160,74,0.15)',
    border: '#d4a04a',
    text: '#d4a04a',
    dot: '#d4a04a',
  },
  MEDIUM_REVIEW_HOSTILITY: {
    bg: 'rgba(212,160,74,0.15)',
    border: '#d4a04a',
    text: '#d4a04a',
    dot: '#d4a04a',
  },
  LOYAL_GUEST: {
    bg: 'rgba(74,124,89,0.15)',
    border: '#4a7c59',
    text: '#4a7c59',
    dot: '#4a7c59',
  },
  RETURNING_GUEST: {
    bg: 'rgba(74,124,89,0.15)',
    border: '#4a7c59',
    text: '#4a7c59',
    dot: '#4a7c59',
  },
  NORMAL: {
    bg: 'rgba(122,112,106,0.12)',
    border: '#7a706a',
    text: '#7a706a',
    dot: '#7a706a',
  },
}

function getStyle(signal: string) {
  return (
    SIGNAL_STYLES[signal] ?? SIGNAL_STYLES['NORMAL']
  )
}

function humanizeSignal(signal: string): string {
  const map: Record<string, string> = {
    HARD_BLOCK: 'Bloqueado',
    HIGH_REVIEW_HOSTILITY: 'Hostilidad alta en reviews',
    HIGH_REPEAT_FLAGS: 'Flags repetidos',
    MEDIUM_FLAGGED: 'Marcado',
    MEDIUM_REVIEW_HOSTILITY: 'Hostilidad media',
    LOYAL_GUEST: 'Huesped leal',
    RETURNING_GUEST: 'Huesped recurrente',
    NORMAL: 'Sin senales',
  }
  return map[signal] ?? signal
}

interface Props {
  data: AirbnbHistoryData | null
}

export function AirbnbHistoryBadge({ data }: Props) {
  if (!data || !data.risk_signal) return null

  const signal = data.risk_signal
  const style = getStyle(signal)
  const label = humanizeSignal(signal)
  const staysText =
    data.prior_stays != null && data.prior_stays > 0
      ? `${data.prior_stays} estancia${data.prior_stays !== 1 ? 's' : ''} previas`
      : null

  return (
    <span
      title={`Airbnb: ${signal}${staysText ? ` · ${staysText}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        paddingTop: '3px',
        paddingBottom: '3px',
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRadius: '9999px',
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.text,
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.dot,
          flexShrink: 0,
        }}
      />
      Airbnb: {label}
      {staysText && (
        <span style={{ opacity: 0.75, fontSize: '11px' }}>· {staysText}</span>
      )}
    </span>
  )
}

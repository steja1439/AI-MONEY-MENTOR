import React, { useState, useEffect, useRef } from 'react'

// ─── AI Response Box with streaming animation ─────────────────────────────────
export function AIResponse({ text, loading }) {
  return (
    <div className="ai-response fade-in">
      <span className="ai-label">ArthSathi Analysis</span>
      {loading ? (
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-line', color: 'var(--ink)' }}>{text}</div>
      )}
    </div>
  )
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────
export function Disclaimer({ text }) {
  return (
    <div className="disclaimer-box">
      <strong>⚠ Important Disclaimer: </strong>
      {text || 'This is AI-generated educational guidance only. It is NOT investment advice under SEBI regulations. Past returns are not indicative of future performance. Please consult a SEBI-registered investment advisor before making any financial decisions.'}
    </div>
  )
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
export function MetricRow({ label, value, color }) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${color || ''}`}>{value}</span>
    </div>
  )
}

// ─── Allocation Bar ───────────────────────────────────────────────────────────
export function AllocBar({ segments }) {
  // segments: [{ pct, color, label }]
  return (
    <div>
      <div className="alloc-bar">
        {segments.map((s, i) => (
          <div key={i} className="alloc-seg" style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {segments.map((s, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mute)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── XRay Bar ─────────────────────────────────────────────────────────────────
export function XrayBar({ label, value, pct, color }) {
  return (
    <div className="xray-bar-wrap">
      <div className="xray-label">
        <span>{label}</span>
        <span style={{ fontWeight: 500 }}>{value}</span>
      </div>
      <div className="xray-bar">
        <div className="xray-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Score Cell ───────────────────────────────────────────────────────────────
export function ScoreCell({ score, label }) {
  const color = score >= 70 ? 'var(--g1)' : score >= 50 ? 'var(--a1)' : 'var(--r1)'
  return (
    <div style={{
      background: 'var(--card)',
      border: '0.5px solid var(--border)',
      borderRadius: 10,
      padding: 12,
      textAlign: 'center'
    }}>
      <span style={{ fontSize: 26, fontWeight: 500, color, display: 'block' }}>{score}</span>
      <span style={{ fontSize: 11, color: 'var(--mute)', display: 'block', marginTop: 3 }}>{label}</span>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

// ─── Chip selector ────────────────────────────────────────────────────────────
export function ChipGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            border: value === opt.value ? '1.5px solid var(--g1)' : '0.5px solid var(--border-md)',
            background: value === opt.value ? 'var(--g5)' : 'var(--bg)',
            color: value === opt.value ? 'var(--g1)' : 'var(--mute)',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Roadmap item ─────────────────────────────────────────────────────────────
export function RoadmapItem({ step, title, body, color }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: color || 'var(--g1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 500, color: 'white', flexShrink: 0, marginTop: 2
      }}>
        {step}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 3, lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  )
}

// ─── Winner badge ─────────────────────────────────────────────────────────────
export function WinnerBadge() {
  return (
    <span style={{
      fontSize: 11, background: 'var(--g1)', color: 'white',
      padding: '2px 10px', borderRadius: 10, display: 'inline-block', marginTop: 4
    }}>
      Recommended ✓
    </span>
  )
}

import React, { useState } from 'react'
import { Field, AIResponse, Disclaimer, ScoreCell } from './Shared.jsx'
import { callClaudeStream } from '../utils/claude.js'
import { fmt, fmtL, calcMoneyScore } from '../utils/finance.js'

export default function MoneyScore() {
  const [form, setForm] = useState({
    income: 75000, savings: 15000, emergencyMonths: 2,
    emi: 12000, insurance: 1000000, equityPct: 30,
    hasNPS: false, uses80C: false,
  })
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked :
          ['hasNPS','uses80C'].includes(k) ? e.target.value === 'yes' :
          +e.target.value
  }))

  const calculate = async () => {
    const r = calcMoneyScore(form)
    setResult(r)

    setAiLoading(true)
    setAiText('')
    const dims = r.dimensions
    const weak = Object.values(dims).filter(d => d.score < 60).map(d => d.label).join(', ')
    try {
      await callClaudeStream(
        `Indian user money health check. Overall score: ${r.overall}/100 (${r.grade}). ` +
        `Dimension scores: ${Object.values(dims).map(d => `${d.label}: ${d.score}/100`).join(', ')}. ` +
        `Monthly income: ${fmt(form.income)}, savings: ${fmt(form.savings)} (rate: ${Math.round(form.savings/form.income*100)}%). ` +
        `Emergency fund: ${form.emergencyMonths} months (target: 6). ` +
        `Insurance cover: ${fmtL(form.insurance)} (recommended: ${fmtL(form.income*12*10)}). ` +
        `EMI burden: ${fmt(form.emi)}/month (${Math.round(form.emi/form.income*100)}% of income). ` +
        `Weak areas: ${weak || 'none'}. ` +
        `Provide specific, prioritised action steps for the 3 weakest dimensions. Give concrete numbers.`,
        (chunk) => setAiText(t => t + chunk)
      )
    } catch (e) {
      setAiText('Unable to generate analysis. Please check your API key.')
    }
    setAiLoading(false)
  }

  const gradeColor = result ? (result.overall >= 80 ? 'var(--g1)' : result.overall >= 65 ? 'var(--a1)' : 'var(--r1)') : 'var(--ink)'

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>Money Health Score</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>5-minute check-up across 6 financial dimensions</p>
      </div>

      <div className="form-grid-2">
        <Field label="Monthly Income (₹)"><input type="number" value={form.income} onChange={set('income')} /></Field>
        <Field label="Monthly Savings (₹)"><input type="number" value={form.savings} onChange={set('savings')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Emergency Fund (months of expenses)"><input type="number" value={form.emergencyMonths} onChange={set('emergencyMonths')} min={0} max={24} /></Field>
        <Field label="Total EMI per month (₹)"><input type="number" value={form.emi} onChange={set('emi')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Life Insurance Cover (₹)"><input type="number" value={form.insurance} onChange={set('insurance')} /></Field>
        <Field label="Equity % of total investments"><input type="number" value={form.equityPct} onChange={set('equityPct')} min={0} max={100} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Contributing to NPS / PPF?">
          <select value={form.hasNPS ? 'yes' : 'no'} onChange={set('hasNPS')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Fully utilising 80C (₹1.5L)?">
          <select value={form.uses80C ? 'yes' : 'no'} onChange={set('uses80C')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
      </div>

      <button className="btn-primary" onClick={calculate}>Get My Money Score →</button>

      {result && (
        <div className="fade-in">
          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 72, color: gradeColor, lineHeight: 1 }}>
              {result.overall}
            </span>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--mute)' }}>/100</span>
            <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 8 }}>{result.grade}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {Object.values(result.dimensions).map(d => (
              <ScoreCell key={d.label} score={d.score} label={d.label} />
            ))}
          </div>

          <AIResponse text={aiText} loading={aiLoading} />
          <Disclaimer />
        </div>
      )}
    </div>
  )
}

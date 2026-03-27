import React, { useState } from 'react'
import { Field, AIResponse, Disclaimer, AllocBar, RoadmapItem } from './Shared.jsx'
import { callClaudeStream } from '../utils/claude.js'
import {
  fmt, fmtL, fmtPct,
  requiredSIP, fireCorpus,
  ALLOCATIONS, EXPECTED_RETURNS,
} from '../utils/finance.js'

export default function FIREPlanner() {
  const [form, setForm] = useState({
    age: 28, income: 80000, expenses: 45000,
    investments: 200000, retireAge: 50, risk: 'moderate',
    goals: ''
  })
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const calculate = async () => {
    setLoading(true)
    const years = form.retireAge - form.age
    if (years <= 0) { alert('Retirement age must be greater than current age'); setLoading(false); return }

    const annualExpenses = form.expenses * 12
    const corpus = fireCorpus(annualExpenses)
    const rate = EXPECTED_RETURNS[form.risk]
    const sip = requiredSIP(corpus, +form.investments, rate, years)
    const alloc = ALLOCATIONS[form.risk]

    const res = { years, corpus, sip: Math.max(0, sip), rate, alloc }
    setResult(res)
    setLoading(false)

    // AI Analysis
    setAiLoading(true)
    setAiText('')
    try {
      await callClaudeStream(
        `Indian user: age ${form.age}, monthly income ${fmt(form.income)}, monthly expenses ${fmt(form.expenses)}, ` +
        `existing investments ${fmtL(form.investments)}, wants to retire at ${form.retireAge} (${years} years), ` +
        `risk profile: ${form.risk}. Monthly savings capacity: ${fmt(form.income - form.expenses)}. ` +
        `Target FIRE corpus: ${fmtL(corpus)} (25x rule). Required monthly SIP: ${fmtL(res.sip)}. ` +
        `Asset allocation: ${alloc.equity}% equity, ${alloc.debt}% debt, ${alloc.gold}% gold. ` +
        `Goals mentioned: ${form.goals || 'none'}. ` +
        `Provide: specific fund categories to invest in, tax-saving strategy under 80C/80CCD, ` +
        `insurance gaps, emergency fund target, and 3 key milestones. Be concise and specific.`,
        (chunk) => setAiText(t => t + chunk)
      )
    } catch (e) {
      setAiText('Unable to generate AI analysis. Please check your API key configuration.')
    }
    setAiLoading(false)
  }

  const roadmap = result ? [
    { step: 1, color: '#1D9E75', title: 'Months 1–3: Build your foundation', body: `Emergency fund target: ${fmtL((+form.expenses) * 6)} (6 months expenses). Start SIP of ${fmtL(result.sip * 0.3)} in liquid/overnight funds.` },
    { step: 2, color: '#378ADD', title: 'Months 4–12: SIP acceleration', body: `Increase equity SIP to ${fmtL(result.sip * result.alloc.equity / 100)} in ELSS + index funds. Max out 80C deductions (₹1.5L limit).` },
    { step: 3, color: '#EF9F27', title: 'Year 2–3: NPS + Insurance', body: `Add ₹50,000/year to NPS Tier I (80CCD extra deduction). Ensure term cover of ${fmtL((+form.income) * 12 * 10)}.` },
    { step: 4, color: '#534AB7', title: 'Year 5+: Annual rebalancing', body: `Review and rebalance to target allocation every January. Gradually shift to ${result.alloc.debt}% debt as retirement nears.` },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>FIRE Path Planner</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>Complete month-by-month roadmap to financial independence</p>
      </div>

      <div className="form-grid-3">
        <Field label="Your Age"><input type="number" value={form.age} onChange={set('age')} min={18} max={60} /></Field>
        <Field label="Monthly Income (₹)"><input type="number" value={form.income} onChange={set('income')} /></Field>
        <Field label="Monthly Expenses (₹)"><input type="number" value={form.expenses} onChange={set('expenses')} /></Field>
      </div>
      <div className="form-grid-3">
        <Field label="Existing Investments (₹)"><input type="number" value={form.investments} onChange={set('investments')} /></Field>
        <Field label="Target Retirement Age"><input type="number" value={form.retireAge} onChange={set('retireAge')} min={30} max={75} /></Field>
        <Field label="Risk Profile">
          <select value={form.risk} onChange={set('risk')}>
            <option value="aggressive">Aggressive</option>
            <option value="moderate">Moderate</option>
            <option value="conservative">Conservative</option>
          </select>
        </Field>
      </div>
      <div className="form-grid-2" style={{ marginBottom: 4 }}>
        <Field label="Life Goals (optional)">
          <input type="text" value={form.goals} onChange={set('goals')} placeholder="e.g. ₹50L for child education in 15 years" />
        </Field>
      </div>

      <button className="btn-primary" onClick={calculate} disabled={loading}>
        {loading ? 'Calculating…' : 'Calculate My FIRE Roadmap →'}
      </button>

      {result && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: '1rem' }}>
            {[
              { label: 'Target Corpus', value: fmtL(result.corpus) },
              { label: 'Monthly SIP Needed', value: fmtL(result.sip) },
              { label: 'Years to FIRE', value: `${result.years} yrs` },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)' }}>{m.value}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="result-section-title">Asset Allocation — {form.risk}</div>
            <AllocBar segments={[
              { pct: result.alloc.equity, color: '#1D9E75', label: 'Equity' },
              { pct: result.alloc.debt, color: '#378ADD', label: 'Debt' },
              { pct: result.alloc.gold, color: '#EF9F27', label: 'Gold' },
            ]} />
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="result-section-title">Action Roadmap</div>
            {roadmap.map(r => <RoadmapItem key={r.step} {...r} />)}
          </div>

          <AIResponse text={aiText} loading={aiLoading} />
          <Disclaimer />
        </div>
      )}
    </div>
  )
}

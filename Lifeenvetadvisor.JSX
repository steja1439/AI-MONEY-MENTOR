import React, { useState } from 'react'
import { Field, AIResponse, Disclaimer, ChipGroup, XrayBar } from './Shared.jsx'
import { callClaudeStream } from '../utils/claude.js'
import { fmtL, LIFE_EVENT_ALLOCATIONS, ALLOC_COLORS } from '../utils/finance.js'

const EVENTS = [
  { value: 'bonus', label: '💰 Received a Bonus' },
  { value: 'inheritance', label: '🏛 Got Inheritance' },
  { value: 'marriage', label: '💍 Getting Married' },
  { value: 'baby', label: '👶 New Baby' },
  { value: 'job', label: '🚀 New Job / Hike' },
]

const EVENT_CONTEXT = {
  bonus: 'Annual performance bonus — need to deploy smartly within 30 days to optimise tax',
  inheritance: 'Inheritance received — long-term wealth creation with tax planning needed',
  marriage: 'Getting married — joint financial planning, insurance review, goal alignment',
  baby: 'New baby — education planning, insurance increase, will creation needed',
  job: 'New job or salary hike — salary restructuring, NPS optimisation, lifestyle inflation guard',
}

export default function LifeEventAdvisor() {
  const [event, setEvent] = useState('bonus')
  const [form, setForm] = useState({
    amount: 500000, income: 100000, taxBracket: 30, risk: 'moderate'
  })
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: +e.target.value }))

  const calculate = async () => {
    const alloc = LIFE_EVENT_ALLOCATIONS[event]?.[form.risk]
    if (!alloc) return
    setResult({ alloc })

    setAiLoading(true)
    setAiText('')
    try {
      await callClaudeStream(
        `Indian user life event: "${event}" — ${EVENT_CONTEXT[event]}. ` +
        `Amount to deploy: ${fmtL(form.amount)}. Monthly income: ${fmtL(form.income)}. ` +
        `Tax bracket: ${form.taxBracket}%. Risk profile: ${form.risk}. ` +
        `Recommended allocation: ${Object.entries(alloc).map(([k,v]) => `${k}: ${fmtL(form.amount * v)} (${Math.round(v*100)}%)`).join(', ')}. ` +
        `Provide: 90-day specific action plan with timelines, tax implications of this windfall, ` +
        `insurance review checklist for this life event, and 2 common mistakes Indians make in this situation.`,
        (chunk) => setAiText(t => t + chunk)
      )
    } catch (e) {
      setAiText('Unable to generate analysis.')
    }
    setAiLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>Life Event Advisor</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>Customised financial plan for major life moments</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Select your life event</div>
        <ChipGroup options={EVENTS} value={event} onChange={setEvent} />
      </div>

      {event && (
        <div style={{ fontSize: 13, color: 'var(--mute)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, marginBottom: 12, borderLeft: '3px solid var(--g3)' }}>
          {EVENT_CONTEXT[event]}
        </div>
      )}

      <div className="form-grid-2">
        <Field label="Amount to Deploy (₹)"><input type="number" value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Monthly Income (₹)"><input type="number" value={form.income} onChange={set('income')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Tax Bracket">
          <select value={form.taxBracket} onChange={set('taxBracket')}>
            <option value={30}>30% slab (income &gt; ₹10L)</option>
            <option value={20}>20% slab (₹5L–₹10L)</option>
            <option value={10}>10% slab (₹2.5L–₹5L)</option>
          </select>
        </Field>
        <Field label="Risk Profile">
          <select value={form.risk} onChange={(e) => setForm(f => ({ ...f, risk: e.target.value }))}>
            <option value="aggressive">Aggressive</option>
            <option value="moderate">Moderate</option>
            <option value="conservative">Conservative</option>
          </select>
        </Field>
      </div>

      <button className="btn-primary" onClick={calculate}>Get My Action Plan →</button>

      {result && (
        <div className="fade-in">
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="result-section-title">Recommended Allocation for {fmtL(form.amount)}</div>
            {Object.entries(result.alloc).map(([label, pct]) => (
              <XrayBar
                key={label}
                label={label}
                value={`${fmtL(form.amount * pct)} (${Math.round(pct * 100)}%)`}
                pct={pct * 100}
                color={ALLOC_COLORS[label] || '#888'}
              />
            ))}
          </div>

          <AIResponse text={aiText} loading={aiLoading} />
          <Disclaimer text="Life event recommendations are general guidance only. Tax implications vary by individual circumstances. Consult a CA for tax planning and a SEBI-registered advisor for investment decisions." />
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { Field, AIResponse, Disclaimer, MetricRow, XrayBar } from './Shared.jsx'
import { callClaudeStream } from '../utils/claude.js'
import { fmtL, fmtPct, calcXIRR } from '../utils/finance.js'

const SAMPLE_PORTFOLIO = `Axis Bluechip Fund: 150000
Mirae Asset Large Cap: 120000
SBI Small Cap Fund: 80000
HDFC Mid Cap Opportunities: 90000
Axis Flexi Cap Fund: 60000
SBI Bluechip Fund: 70000`

const CATEGORY_RULES = [
  { keywords: ['bluechip', 'large cap', 'large-cap', 'largecap', 'nifty 50', 'top 100'], cat: 'Large Cap' },
  { keywords: ['mid cap', 'midcap', 'mid-cap'], cat: 'Mid Cap' },
  { keywords: ['small cap', 'smallcap', 'small-cap'], cat: 'Small Cap' },
  { keywords: ['flexi', 'multi cap', 'multicap', 'multi-cap'], cat: 'Flexi / Multi Cap' },
  { keywords: ['elss', 'tax saver', 'tax saving'], cat: 'ELSS (Tax Saving)' },
  { keywords: ['hybrid', 'balanced', 'aggressive hybrid'], cat: 'Hybrid' },
  { keywords: ['debt', 'liquid', 'overnight', 'money market', 'short duration'], cat: 'Debt' },
  { keywords: ['index', 'nifty', 'sensex', 'etf'], cat: 'Index / ETF' },
]

const CAT_COLORS = {
  'Large Cap': '#1D9E75',
  'Mid Cap': '#378ADD',
  'Small Cap': '#EF9F27',
  'Flexi / Multi Cap': '#534AB7',
  'ELSS (Tax Saving)': '#0F6E56',
  'Hybrid': '#D4537E',
  'Debt': '#888',
  'Index / ETF': '#B4B2A9',
  'Other': '#CCC',
}

const BENCH_RETURNS = { nifty50: 14.2, sensex: 13.8, nifty500: 15.1 }

function categorise(name) {
  const lower = name.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.cat
  }
  return 'Other'
}

export default function MFXRay() {
  const [portfolioText, setPortfolioText] = useState(SAMPLE_PORTFOLIO)
  const [form, setForm] = useState({ invested: 570000, current: 680000, years: 3, bench: 'nifty50' })
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: k === 'bench' ? e.target.value : +e.target.value }))

  const analyse = async () => {
    // Parse holdings
    const lines = portfolioText.split('\n').filter(l => l.includes(':'))
    const holdings = lines.map(l => {
      const [name, val] = l.split(':')
      return { name: name.trim(), value: parseFloat(val?.replace(/,/g, '')) || 0 }
    }).filter(h => h.value > 0)

    if (holdings.length === 0) { alert('Please enter at least one fund in "Fund Name: Amount" format'); return }

    const total = holdings.reduce((s, h) => s + h.value, 0)
    const xirr = calcXIRR(form.invested, form.current, form.years)
    const benchReturn = BENCH_RETURNS[form.bench]
    const alpha = (xirr - benchReturn).toFixed(1)

    // Categorise
    const catMap = {}
    holdings.forEach(h => {
      const cat = categorise(h.name)
      catMap[cat] = (catMap[cat] || 0) + h.value
    })

    // Overlap detection (simplified: check for large-cap heavy concentration)
    const largeCapVal = (catMap['Large Cap'] || 0) + (catMap['Flexi / Multi Cap'] || 0) + (catMap['Index / ETF'] || 0)
    const largeCapPct = Math.round(largeCapVal / total * 100)
    const overlapRisk = largeCapPct > 65 ? 'High' : largeCapPct > 45 ? 'Moderate' : 'Low'

    // Duplicate name detection (simple)
    const names = holdings.map(h => h.name.toLowerCase().split(' ').slice(0, 2).join(' '))
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)

    setResult({ holdings, total, xirr, benchReturn, alpha, catMap, largeCapPct, overlapRisk, dupes })

    setAiLoading(true)
    setAiText('')
    try {
      await callClaudeStream(
        `MF Portfolio X-Ray for Indian investor. ` +
        `${holdings.length} funds, total: ${fmtL(total)}. ` +
        `XIRR: ${xirr.toFixed(1)}% vs ${form.bench} ${benchReturn}% (alpha: ${alpha}%). ` +
        `Category breakdown: ${Object.entries(catMap).map(([k,v]) => `${k}: ${Math.round(v/total*100)}%`).join(', ')}. ` +
        `Large-cap concentration: ${largeCapPct}% (overlap risk: ${overlapRisk}). ` +
        `Number of funds: ${holdings.length}. ` +
        `Funds: ${holdings.map(h => h.name).join(', ')}. ` +
        `Analyse: portfolio overlap risk (especially between ${holdings.map(h=>h.name).slice(0,3).join(', ')}), ` +
        `which funds to consolidate if over-diversified, ` +
        `ideal number of funds for this corpus size, ` +
        `rebalancing recommendation to optimise risk-adjusted returns. ` +
        `Be specific about which category to reduce and which to increase.`,
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
        <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>MF Portfolio X-Ray</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>XIRR · Overlap · Category analysis · Rebalancing in under 10 seconds</p>
      </div>

      <div className="form-field">
        <label>Paste your holdings (Fund Name: Amount)</label>
        <textarea
          value={portfolioText}
          onChange={e => setPortfolioText(e.target.value)}
          rows={6}
          style={{ width: '100%', border: '0.5px solid var(--border-md)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'var(--dm)', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical' }}
          placeholder="Axis Bluechip Fund: 150000&#10;SBI Small Cap Fund: 80000"
        />
      </div>

      <div className="form-grid-2">
        <Field label="Total Amount Invested (₹)"><input type="number" value={form.invested} onChange={set('invested')} /></Field>
        <Field label="Current Portfolio Value (₹)"><input type="number" value={form.current} onChange={set('current')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Investment Duration (years)"><input type="number" value={form.years} onChange={set('years')} min={1} max={30} /></Field>
        <Field label="Benchmark">
          <select value={form.bench} onChange={set('bench')}>
            <option value="nifty50">Nifty 50 (14.2% 10yr CAGR)</option>
            <option value="sensex">Sensex (13.8%)</option>
            <option value="nifty500">Nifty 500 (15.1%)</option>
          </select>
        </Field>
      </div>

      <button className="btn-primary" onClick={analyse}>Run X-Ray Analysis →</button>

      {result && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: '1rem' }}>
            {[
              { label: 'Portfolio XIRR', value: fmtPct(result.xirr), color: result.xirr > result.benchReturn ? 'var(--g1)' : 'var(--r1)' },
              { label: `vs ${form.bench.toUpperCase()}`, value: fmtPct(result.benchReturn), color: 'var(--mute)' },
              { label: 'Alpha', value: (result.alpha > 0 ? '+' : '') + fmtPct(+result.alpha), color: result.alpha > 0 ? 'var(--g1)' : 'var(--r1)' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 26, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="result-section-title">Category Allocation</div>
            {Object.entries(result.catMap)
              .sort(([,a],[,b]) => b - a)
              .map(([cat, val]) => (
                <XrayBar
                  key={cat}
                  label={cat}
                  value={`${fmtL(val)} (${Math.round(val / result.total * 100)}%)`}
                  pct={val / result.total * 100}
                  color={CAT_COLORS[cat] || '#ccc'}
                />
              ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="result-section-title">Overlap & Concentration</div>
            <MetricRow label="Large-cap concentration" value={`${result.largeCapPct}%`} color={result.largeCapPct > 65 ? 'amber' : 'green'} />
            <MetricRow label="Overlap risk" value={result.overlapRisk} color={result.overlapRisk === 'High' ? 'amber' : result.overlapRisk === 'Low' ? 'green' : ''} />
            <MetricRow label="Number of funds" value={`${result.holdings.length} ${result.holdings.length > 6 ? '(consider consolidating)' : '(optimal)'}`} color={result.holdings.length > 6 ? 'amber' : 'green'} />
          </div>

          <AIResponse text={aiText} loading={aiLoading} />
          <Disclaimer text="Portfolio analysis is based on manually entered data and simplified category rules. Actual overlap, XIRR, and expense ratios require official CAMS/KFintech statements. Past performance is not indicative of future returns. This is not a buy/sell recommendation." />
        </div>
      )}
    </div>
  )
}

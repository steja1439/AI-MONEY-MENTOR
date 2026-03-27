import React, { useState } from 'react'
import { Field, AIResponse, Disclaimer, MetricRow, WinnerBadge } from './Shared.jsx'
import { callClaudeStream } from '../utils/claude.js'
import { fmt, fmtL, calcOldRegimeTax, calcNewRegimeTax, findMissedDeductions } from '../utils/finance.js'

export default function TaxWizard() {
  const [form, setForm] = useState({
    income: 1200000, hraReceived: 180000, rentPaid: 150000,
    deductions80C: 50000, deductionsNPS: 0, deductions80D: 15000,
    homeLoanInterest: 0, isMetro: true,
  })
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({
    ...f,
    [k]: k === 'isMetro' ? e.target.value === 'metro' : +e.target.value
  }))

  const analyse = async () => {
    const oldResult = calcOldRegimeTax(form)
    const newResult = calcNewRegimeTax(form.income)
    const missed = findMissedDeductions(form)
    const oldWins = oldResult.tax <= newResult.tax
    const saving = Math.abs(oldResult.tax - newResult.tax)

    setResult({ oldResult, newResult, oldWins, saving, missed })

    setAiLoading(true)
    setAiText('')
    try {
      await callClaudeStream(
        `Indian taxpayer FY 2024-25. Annual CTC: ${fmtL(form.income)}. ` +
        `Old regime tax: ${fmtL(oldResult.tax)}, New regime tax: ${fmtL(newResult.tax)}. ` +
        `${oldWins ? 'Old regime saves' : 'New regime saves'} ${fmtL(saving)}. ` +
        `Deductions used: 80C ${fmtL(form.deductions80C)}/1.5L, NPS ${fmtL(form.deductionsNPS)}/50k, ` +
        `80D ${fmtL(form.deductions80D)}, HRA ${fmtL(oldResult.deductionBreakdown.hraExempt)} exempted, ` +
        `Home loan interest ${fmtL(form.homeLoanInterest)}. ` +
        `Missed deductions: ${missed.map(m => m.section + ': ' + fmtL(m.canInvest)).join(', ') || 'none'}. ` +
        `Explain which regime to choose and why with specific numbers. ` +
        `Recommend top 3 tax-saving investments ranked by liquidity. ` +
        `Mention ELSS lock-in, NPS withdrawal rules, PPF vs FD comparison.`,
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
        <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>Tax Wizard</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>Old vs New regime · Every deduction you're missing · FY 2024-25</p>
      </div>

      <div className="form-grid-2">
        <Field label="Annual CTC / Gross Income (₹)"><input type="number" value={form.income} onChange={set('income')} /></Field>
        <Field label="HRA Received per year (₹)"><input type="number" value={form.hraReceived} onChange={set('hraReceived')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Rent Paid per year (₹)"><input type="number" value={form.rentPaid} onChange={set('rentPaid')} /></Field>
        <Field label="80C Investments (₹, max 1.5L)"><input type="number" value={form.deductions80C} onChange={set('deductions80C')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="NPS 80CCD(1B) (₹, max 50k)"><input type="number" value={form.deductionsNPS} onChange={set('deductionsNPS')} /></Field>
        <Field label="Health Insurance 80D (₹)"><input type="number" value={form.deductions80D} onChange={set('deductions80D')} /></Field>
      </div>
      <div className="form-grid-2">
        <Field label="Home Loan Interest 24(b) (₹)"><input type="number" value={form.homeLoanInterest} onChange={set('homeLoanInterest')} /></Field>
        <Field label="City Type (for HRA)">
          <select value={form.isMetro ? 'metro' : 'nonmetro'} onChange={set('isMetro')}>
            <option value="metro">Metro (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad)</option>
            <option value="nonmetro">Non-Metro</option>
          </select>
        </Field>
      </div>

      <button className="btn-primary" onClick={analyse}>Analyse My Tax →</button>

      {result && (
        <div className="fade-in">
          {/* Regime comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '1rem' }}>
            {[
              { name: 'Old Regime', tax: result.oldResult.tax, wins: result.oldWins },
              { name: 'New Regime', tax: result.newResult.tax, wins: !result.oldWins },
            ].map(r => (
              <div key={r.name} style={{
                border: r.wins ? '1.5px solid var(--g1)' : '0.5px solid var(--border)',
                borderRadius: 12,
                padding: '1rem',
                background: r.wins ? 'var(--g5)' : 'var(--bg)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.name}</div>
                <div style={{ fontSize: 30, fontWeight: 500, color: r.wins ? 'var(--g1)' : 'var(--ink)', margin: '6px 0' }}>{fmtL(r.tax)}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)' }}>Annual tax liability</div>
                {r.wins && <WinnerBadge />}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="result-section-title">
              {result.oldWins ? 'Old Regime' : 'New Regime'} saves you {fmtL(result.saving)}/year
            </div>
            <MetricRow label="Old Regime — Taxable Income" value={fmtL(result.oldResult.taxableIncome)} />
            <MetricRow label="HRA Exemption claimed" value={fmtL(result.oldResult.deductionBreakdown.hraExempt)} color="green" />
            <MetricRow label="Total deductions (Old)" value={fmtL(result.oldResult.totalDeductions)} color="green" />
          </div>

          {result.missed.length > 0 && (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="result-section-title">Deductions You're Missing</div>
              {result.missed.map((m, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500 }}>Save {fmtL(m.taxSaving)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{m.tip}</div>
                </div>
              ))}
            </div>
          )}

          <AIResponse text={aiText} loading={aiLoading} />
          <Disclaimer text="Tax calculations are estimates based on FY 2024-25 slabs. Consult a Chartered Accountant for precise filing. This tool does not constitute tax advice under the Income Tax Act." />
        </div>
      )}
    </div>
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export const fmt = (n) =>
  '₹' + Math.round(n).toLocaleString('en-IN')

export const fmtL = (n) => {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr'
  if (n >= 100_000)    return '₹' + (n / 100_000).toFixed(1) + 'L'
  return fmt(n)
}

export const fmtPct = (n, decimals = 1) => n.toFixed(decimals) + '%'


// ─── SIP / FIRE Calculations ──────────────────────────────────────────────────

/**
 * Future Value of SIP
 * FV = P × [(1+r)^n - 1] / r × (1+r)
 */
export const sipFutureValue = (monthlyAmount, annualRate, years) => {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0) return monthlyAmount * n
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/**
 * Required SIP to reach a target corpus
 * PMT = FV × r / [(1+r)^n - 1] / (1+r)
 */
export const requiredSIP = (targetCorpus, existingInvestments, annualRate, years) => {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0 || n === 0) return 0
  const fvOfExisting = existingInvestments * Math.pow(1 + r, n)
  const remaining = Math.max(0, targetCorpus - fvOfExisting)
  return (remaining * r) / ((Math.pow(1 + r, n) - 1) * (1 + r))
}

/**
 * FIRE corpus using 25x rule (4% withdrawal rate)
 */
export const fireCorpus = (annualExpenses) => annualExpenses * 25

/**
 * XIRR approximation (simplified for equal-interval cashflows)
 */
export const calcXIRR = (invested, currentValue, years) => {
  if (years <= 0 || invested <= 0) return 0
  return (Math.pow(currentValue / invested, 1 / years) - 1) * 100
}


// ─── Tax Calculations ─────────────────────────────────────────────────────────

/**
 * HRA Exemption — minimum of 3 conditions
 */
export const hraExemption = (actualHRA, annualSalary, rentPaid, isMetro) => {
  const condition1 = actualHRA
  const condition2 = rentPaid - 0.1 * annualSalary
  const condition3 = (isMetro ? 0.5 : 0.4) * annualSalary
  return Math.max(0, Math.min(condition1, condition2, condition3))
}

/**
 * Old Tax Regime — FY 2024-25
 */
export const calcOldRegimeTax = ({
  income,
  hraReceived = 0,
  rentPaid = 0,
  isMetro = true,
  deductions80C = 0,
  deductionsNPS = 0,
  deductions80D = 0,
  homeLoanInterest = 0,
}) => {
  const standardDeduction = 50_000
  const hraExempt = hraExemption(hraReceived, income, rentPaid, isMetro)
  const total80C = Math.min(150_000, deductions80C)
  const totalNPS = Math.min(50_000, deductionsNPS)
  const total80D = Math.min(25_000, deductions80D)
  const totalHL = Math.min(200_000, homeLoanInterest)

  const totalDeductions = standardDeduction + hraExempt + total80C + totalNPS + total80D + totalHL
  const taxableIncome = Math.max(0, income - totalDeductions)

  // Tax slabs
  const slabs = [
    [250_000, 0],
    [250_000, 0.05],
    [500_000, 0.20],
    [Infinity, 0.30],
  ]
  let tax = 0
  let remaining = taxableIncome
  for (const [limit, rate] of slabs) {
    if (remaining <= 0) break
    const chunk = Math.min(remaining, limit)
    tax += chunk * rate
    remaining -= chunk
  }

  const cess = tax * 0.04
  return {
    tax: Math.round(tax + cess),
    taxableIncome,
    totalDeductions,
    deductionBreakdown: { standardDeduction, hraExempt, total80C, totalNPS, total80D, totalHL },
  }
}

/**
 * New Tax Regime — FY 2024-25
 */
export const calcNewRegimeTax = (income) => {
  const standardDeduction = 75_000
  const taxableIncome = Math.max(0, income - standardDeduction)

  const slabs = [
    [400_000, 0],
    [400_000, 0.05],
    [400_000, 0.10],
    [400_000, 0.15],
    [400_000, 0.20],
    [Infinity, 0.30],
  ]
  let tax = 0
  let remaining = taxableIncome
  for (const [limit, rate] of slabs) {
    if (remaining <= 0) break
    const chunk = Math.min(remaining, limit)
    tax += chunk * rate
    remaining -= chunk
  }

  // Section 87A rebate — if taxable income ≤ 7L, tax = 0
  if (taxableIncome <= 700_000) tax = 0

  const cess = tax * 0.04
  return {
    tax: Math.round(tax + cess),
    taxableIncome,
    standardDeduction,
  }
}

/**
 * Find missed deduction opportunities
 */
export const findMissedDeductions = ({ deductions80C, deductionsNPS, deductions80D, homeLoanInterest, income }) => {
  const missed = []
  const taxRate = income > 1_000_000 ? 0.30 : income > 500_000 ? 0.20 : 0.05

  const gap80C = Math.max(0, 150_000 - deductions80C)
  if (gap80C > 0) missed.push({
    section: '80C',
    label: `80C gap — ELSS / PPF / NSC`,
    canInvest: gap80C,
    taxSaving: Math.round(gap80C * taxRate * 1.04),
    tip: `Invest ${fmtL(gap80C)} more in ELSS mutual funds (tax-saving with equity returns)`
  })

  const gapNPS = Math.max(0, 50_000 - deductionsNPS)
  if (gapNPS > 0) missed.push({
    section: '80CCD(1B)',
    label: `NPS extra deduction`,
    canInvest: gapNPS,
    taxSaving: Math.round(gapNPS * taxRate * 1.04),
    tip: `${fmtL(gapNPS)} more in NPS Tier I qualifies for additional deduction over 80C`
  })

  const gap80D = Math.max(0, 25_000 - deductions80D)
  if (gap80D > 5_000) missed.push({
    section: '80D',
    label: `Health insurance premium`,
    canInvest: gap80D,
    taxSaving: Math.round(gap80D * taxRate * 1.04),
    tip: `Buy/upgrade health insurance — deduction up to ₹25,000 (₹50,000 for senior citizens)`
  })

  if (homeLoanInterest === 0 && income > 800_000) missed.push({
    section: '24(b)',
    label: `Home loan interest`,
    canInvest: 200_000,
    taxSaving: Math.round(200_000 * taxRate * 1.04),
    tip: `Home loan interest up to ₹2L qualifies for deduction under Section 24(b)`
  })

  return missed
}


// ─── Money Health Score ───────────────────────────────────────────────────────

export const calcMoneyScore = ({
  income,
  savings,
  emergencyMonths,
  emiAmount,
  insuranceCover,
  equityPct,
  hasNPS,
  uses80C,
}) => {
  const savingsRate = savings / income

  const emergencyScore = Math.min(100, Math.round((emergencyMonths / 6) * 100))
  const insuranceScore = Math.min(100, Math.round((insuranceCover / (income * 12 * 10)) * 100))
  const diversifyScore = equityPct > 20 && equityPct < 80
    ? Math.min(100, 60 + (Math.abs(equityPct - 55) < 20 ? 40 : 10))
    : 30
  const debtScore = Math.min(100, Math.round(Math.max(0, 1 - emiAmount / (income * 0.5)) * 100))
  const taxScore = Math.min(100, (uses80C ? 50 : 0) + (hasNPS ? 50 : 0))
  const retireScore = Math.min(100, Math.round(savingsRate * 200))

  const overall = Math.round(
    (emergencyScore + insuranceScore + diversifyScore + debtScore + taxScore + retireScore) / 6
  )

  const grade =
    overall >= 80 ? 'Excellent' :
    overall >= 65 ? 'Good' :
    overall >= 50 ? 'Fair' :
    'Needs Attention'

  return {
    overall,
    grade,
    dimensions: {
      emergency: { score: emergencyScore, label: 'Emergency Fund' },
      insurance: { score: insuranceScore, label: 'Insurance Cover' },
      diversify: { score: diversifyScore, label: 'Diversification' },
      debt: { score: debtScore, label: 'Debt Health' },
      tax: { score: taxScore, label: 'Tax Efficiency' },
      retire: { score: retireScore, label: 'Retirement Ready' },
    }
  }
}


// ─── Asset Allocation ─────────────────────────────────────────────────────────

export const ALLOCATIONS = {
  aggressive: { equity: 75, debt: 15, gold: 10 },
  moderate: { equity: 60, debt: 30, gold: 10 },
  conservative: { equity: 40, debt: 50, gold: 10 },
}

export const EXPECTED_RETURNS = {
  aggressive: 0.13,
  moderate: 0.11,
  conservative: 0.09,
}


// ─── Life Event Allocations ───────────────────────────────────────────────────

export const LIFE_EVENT_ALLOCATIONS = {
  bonus: {
    aggressive: { 'Emergency Fund': 0.10, 'Equity SIPs': 0.60, 'Debt Funds': 0.20, 'Tax Saving 80C': 0.10 },
    moderate:   { 'Emergency Fund': 0.20, 'Equity SIPs': 0.40, 'Debt Funds': 0.30, 'Tax Saving 80C': 0.10 },
    conservative: { 'Emergency Fund': 0.30, 'Equity SIPs': 0.20, 'FD / Debt':  0.40, 'Tax Saving 80C': 0.10 },
  },
  inheritance: {
    aggressive: { 'Emergency Fund': 0.05, 'Equity SIPs': 0.55, 'Debt Funds': 0.25, 'Tax Planning': 0.15 },
    moderate:   { 'Emergency Fund': 0.10, 'Equity SIPs': 0.40, 'Debt Funds': 0.35, 'Tax Planning': 0.15 },
    conservative: { 'Emergency Fund': 0.15, 'Equity / ELSS': 0.20, 'FD / Bonds': 0.50, 'Tax Planning': 0.15 },
  },
  marriage: {
    aggressive: { 'Emergency Fund': 0.15, 'Joint Equity SIPs': 0.40, 'Joint Debt': 0.25, 'Joint Insurance': 0.20 },
    moderate:   { 'Emergency Fund': 0.20, 'Joint Equity SIPs': 0.30, 'Joint Debt': 0.30, 'Joint Insurance': 0.20 },
    conservative: { 'Emergency Fund': 0.25, 'Joint Equity': 0.20, 'FD / Debt': 0.35, 'Joint Insurance': 0.20 },
  },
  baby: {
    aggressive: { 'Emergency Fund': 0.20, 'Child Education SIP': 0.40, 'Debt Funds': 0.20, 'Term + Child Insurance': 0.20 },
    moderate:   { 'Emergency Fund': 0.25, 'Child Education SIP': 0.30, 'Debt Funds': 0.25, 'Term + Child Insurance': 0.20 },
    conservative: { 'Emergency Fund': 0.30, 'Child Education SIP': 0.20, 'FD / SSY': 0.30, 'Insurance': 0.20 },
  },
  job: {
    aggressive: { 'Emergency Top-up': 0.10, 'Equity SIPs': 0.65, 'Debt Funds': 0.15, 'NPS 80CCD': 0.10 },
    moderate:   { 'Emergency Top-up': 0.15, 'Equity SIPs': 0.50, 'Debt Funds': 0.25, 'NPS 80CCD': 0.10 },
    conservative: { 'Emergency Top-up': 0.20, 'Equity SIPs': 0.30, 'FD / Debt': 0.40, 'NPS 80CCD': 0.10 },
  },
}

export const ALLOC_COLORS = {
  'Emergency Fund': '#378ADD',
  'Emergency Top-up': '#378ADD',
  'Equity SIPs': '#1D9E75',
  'Child Education SIP': '#1D9E75',
  'Joint Equity SIPs': '#1D9E75',
  'Equity / ELSS': '#1D9E75',
  'Equity SIPs': '#1D9E75',
  'Debt Funds': '#EF9F27',
  'FD / Debt': '#EF9F27',
  'FD / Bonds': '#EF9F27',
  'FD / SSY': '#EF9F27',
  'Joint Debt': '#EF9F27',
  'Tax Saving 80C': '#534AB7',
  'Tax Planning': '#534AB7',
  'NPS 80CCD': '#0F6E56',
  'Joint Insurance': '#D4537E',
  'Term + Child Insurance': '#D4537E',
  'Insurance': '#D4537E',
}

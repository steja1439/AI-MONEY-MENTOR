import React, { useState } from 'react'
import FIREPlanner from './components/FIREPlanner.jsx'
import MoneyScore from './components/MoneyScore.jsx'
import TaxWizard from './components/TaxWizard.jsx'
import LifeEventAdvisor from './components/LifeEventAdvisor.jsx'
import CouplePlanner from './components/CouplePlanner.jsx'
import MFXRay from './components/MFXRay.jsx'

const MODULES = [
  { id: 'fire',    icon: '🔥', name: 'FIRE Planner',    desc: 'Retire early roadmap',       component: FIREPlanner },
  { id: 'score',   icon: '💯', name: 'Money Score',     desc: '6-dimension wellness',        component: MoneyScore },
  { id: 'tax',     icon: '📋', name: 'Tax Wizard',      desc: 'Old vs new regime',           component: TaxWizard },
  { id: 'life',    icon: '🎯', name: 'Life Events',     desc: 'Bonus, baby, marriage',       component: LifeEventAdvisor },
  { id: 'couple',  icon: '💑', name: 'Couple Planner',  desc: 'Joint optimisation',          component: CouplePlanner },
  { id: 'xray',    icon: '🔬', name: 'MF X-Ray',        desc: 'Portfolio analysis',          component: MFXRay },
]

export default function App() {
  const [active, setActive] = useState('fire')
  const ActiveComponent = MODULES.find(m => m.id === active)?.component || FIREPlanner

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--card)',
        borderBottom: '0.5px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'var(--g1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🪙
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1 }}>ArthSathi</div>
              <div style={{ fontSize: 11, color: 'var(--mute)' }}>AI Money Mentor</div>
            </div>
          </div>
          <span style={{
            fontSize: 11, background: 'var(--a4)', color: 'var(--a1)',
            padding: '4px 10px', borderRadius: 20, border: '0.5px solid var(--a3)',
            fontWeight: 500,
          }}>
            ⚠ Guidance only · Not SEBI-licensed advice
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        {/* Module Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: '1.5rem',
        }}>
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              style={{
                padding: '12px 10px',
                border: active === m.id ? '1.5px solid var(--g1)' : '0.5px solid var(--border)',
                borderRadius: 12,
                background: active === m.id ? 'var(--g5)' : 'var(--card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 5 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: active === m.id ? 'var(--g1)' : 'var(--ink)' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Active Panel */}
        <div className="card slide-up" key={active}>
          <ActiveComponent />
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: 12, color: 'var(--hint)', lineHeight: 1.8 }}>
          <p>ArthSathi is powered by Claude AI · Built for ET Money Mentor Hackathon</p>
          <p>Not a SEBI-registered investment advisor · For educational purposes only</p>
          <p style={{ marginTop: 4 }}>
            <a href="https://github.com/YOUR_USERNAME/arthsathi" target="_blank" rel="noreferrer" style={{ color: 'var(--g2)' }}>
              GitHub
            </a>
            {' · '}
            <a href="https://www.sebi.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--g2)' }}>
              SEBI Guidelines
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

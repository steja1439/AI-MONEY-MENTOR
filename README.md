# AI-MONEY-MENTOR
ArthSathi 🪙 — AI Money Mentor for India

AI-powered personal finance platform that makes financial planning as accessible as checking WhatsApp.

✨ Features
ModuleDescription🔥 FIRE PlannerMonth-by-month roadmap to financial independence💯 Money Score6-dimension financial wellness assessment📋 Tax WizardOld vs New regime comparison with missed deductions🎯 Life Event AdvisorBonus, inheritance, marriage, baby — custom plans💑 Couple PlannerJoint income optimisation across both partners🔬 MF X-RayPortfolio overlap, XIRR, and rebalancing engine
🚀 Quick Deploy
Option 1: GitHub Pages (Frontend only — recommended)
bashgit clone https://github.com/steja1439
cd arthsathi
npm install
# Add your Anthropic API key to frontend/.env
echo "VITE_ANTHROPIC_API_KEY=sk-ant-..." > frontend/.env
npm run build
npm run deploy
Option 2: Full Stack (Vercel / Railway / Render)
bash# Backend
cd backend
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npm start

# Frontend
cd ../frontend
npm install
echo "VITE_API_URL=https://your-backend.railway.app" > .env
npm run build
📁 Project Structure
arthsathi/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # All 6 modules + shared UI
│   │   ├── utils/            # Finance calculations engine
│   │   └── styles/           # Global CSS
│   ├── index.html
│   └── vite.config.js
├── backend/                  # Express.js API proxy
│   ├── src/
│   │   ├── server.js         # Main Express server
│   │   └── routes/           # API routes
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml        # Auto-deploy to GitHub Pages
└── README.md
🔑 Environment Variables
Frontend (frontend/.env)
VITE_ANTHROPIC_API_KEY=your_key_here        # Direct API (GitHub Pages)
VITE_USE_BACKEND=false                      # Set true to use backend proxy
Backend (backend/.env)
ANTHROPIC_API_KEY=your_key_here
PORT=3001
FRONTEND_URL=https://github.com/steja1439
⚖️ Compliance & Disclaimer
ArthSathi provides AI-generated educational guidance only. It is not a SEBI-registered investment advisor. All recommendations must be verified with a qualified financial professional before acting on them.

No user financial data is stored or logged
All calculations run client-side
Claude API calls are for narrative generation only

🛠️ Tech Stack

Frontend: React 18, Vite, CSS Variables (dark mode ready)
Backend: Node.js, Express, Anthropic SDK
Deploy: GitHub Pages (frontend), Railway/Render (backend)
AI: Claude claude-sonnet-4-20250514 via Anthropic API

📄 License
MIT License — free to use, modify, and deploy.

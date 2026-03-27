const SYSTEM_PROMPT = `You are ArthSathi, an AI personal finance mentor specialising in Indian personal finance. 
Your role is to provide clear, specific, actionable guidance tailored to Indian users.

Guidelines:
- Use Indian financial context: SEBI, AMFI, IT Act, NPS, PPF, ELSS, SIPs, FDs
- Mention specific fund categories (not specific fund names to avoid SEBI issues)
- Reference actual tax sections (80C, 80CCD, 80D, Section 24b, HRA)
- Use Indian currency and number system (Lakh, Crore)
- Be specific with numbers, percentages, and timelines
- Keep responses to 3-4 focused paragraphs
- Always end with a brief reminder that this is educational guidance

CRITICAL DISCLAIMER: Always clarify this is AI-generated educational guidance, NOT licensed investment advice under SEBI regulations. Users must consult a SEBI-registered investment advisor before making financial decisions.`

/**
 * Call Claude API — supports both direct (frontend key) and backend proxy
 */
export const callClaude = async (userPrompt) => {
  const useBackend = import.meta.env.VITE_USE_BACKEND === 'true'

  if (useBackend) {
    // Route through backend proxy (hides API key, adds rate limiting)
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt })
    })
    if (!response.ok) throw new Error(`Backend error: ${response.status}`)
    const data = await response.json()
    return data.text
  } else {
    // Direct API call (GitHub Pages — key in .env)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      return 'API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file. See README for setup instructions.'
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `API error ${response.status}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || 'Analysis complete.'
  }
}

/**
 * Streaming version — calls onChunk as text arrives
 */
export const callClaudeStream = async (userPrompt, onChunk) => {
  const useBackend = import.meta.env.VITE_USE_BACKEND === 'true'

  if (useBackend) {
    // Backend streaming
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt })
    })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const d = JSON.parse(line.slice(6))
            if (d.chunk) onChunk(d.chunk)
          } catch {}
        }
      }
    }
  } else {
    // Fallback: non-streaming direct call, simulate stream
    const text = await callClaude(userPrompt)
    const words = text.split(' ')
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 30))
      onChunk((i === 0 ? '' : ' ') + words[i])
    }
  }
}

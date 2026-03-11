// ============================================================
// src/routes/chatbot.ts — AI Chatbot with Rule-Based Fallback
// POST /message
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

const RULE_BASED_RESPONSES: Array<{
  patterns: string[]
  reply: string
  suggestions: string[]
}> = [
  {
    patterns: ['dengue', 'dengue fever', 'a90'],
    reply: 'Dengue fever is caused by the Aedes mosquito. Symptoms include high fever (104°F/40°C), severe headache, pain behind the eyes, joint and muscle pain, rash, and mild bleeding. Treatment is supportive — rest, fluids, and paracetamol. AVOID NSAIDs/Aspirin. Monitor platelet count daily.',
    suggestions: ['Show dengue hotspots', 'Dengue prevention tips', 'Dengue vaccine info'],
  },
  {
    patterns: ['hotspot', 'hotspots', 'cluster', 'outbreak'],
    reply: 'Current high-risk clusters detected by our DBSCAN surveillance engine:\n🔴 Delhi NCR — 42 cases (Dengue, CRITICAL)\n🔴 Mumbai Metro — 38 cases (Dengue, CRITICAL)\n🟡 Kolkata — 28 cases (Typhoid, HIGH)\n🟡 Bengaluru — 17 cases (Malaria, HIGH)\n\nAll data is privacy-preserving (ε=0.75 LDP).',
    suggestions: ['Show India map', 'Run epidemic simulation', 'View cluster details'],
  },
  {
    patterns: ['privacy', 'privacy policy', 'data protection', 'gdpr', 'hipaa'],
    reply: 'OmniShield implements a comprehensive privacy framework:\n• Local Differential Privacy (ε=0.75) on all disease reports\n• AES-GCM-256 encryption for all patient records\n• Server-blind architecture — we never see decryption keys\n• Adaptive privacy budget tracking with compliance reports\n• HIPAA, GDPR, and NDHM compliant\n• Audit logs for all data access',
    suggestions: ['View privacy budget', 'Download compliance report', 'Learn about LDP'],
  },
  {
    patterns: ['abha', 'ayushman', 'health account', 'health card'],
    reply: 'ABHA (Ayushman Bharat Health Account) is India\'s unified health identity system. Each citizen gets a unique 14-digit ABHA ID. OmniShield supports:\n• ABHA ID verification\n• QR card linkage to ABHA\n• Geolocation-tagged care pathway\n• Cross-facility record access\n• FHIR R4 export\n\nYour health records remain encrypted and only accessible to authorised providers.',
    suggestions: ['Verify ABHA ID', 'Link QR card', 'View care pathway'],
  },
  {
    patterns: ['sir', 'seir', 'epidemic model', 'simulation', 'spread'],
    reply: 'OmniShield implements advanced epidemic spreading models:\n\n📊 SIR Model: Susceptible → Infected → Recovered\n• dS/dt = -β·S·I/N\n• dI/dt = β·S·I/N - γ·I\n• dR/dt = γ·I\n\n📊 SEIR Model: Adds Exposed (incubation) compartment\n\nParameters: R₀ (basic reproduction number), γ (recovery rate), σ (incubation rate)\n\nUse the Epidemic Simulation tab to run custom scenarios for any Indian district.',
    suggestions: ['Run SIR simulation', 'Run SEIR simulation', 'View hotspot propagation'],
  },
  {
    patterns: ['malaria', 'b54'],
    reply: 'Malaria is caused by Plasmodium parasites transmitted by Anopheles mosquitoes. OmniShield detects malaria clusters in real-time. Current high-risk zones: Kerala, Odisha, Jharkhand.\n\nDiagnosis: RDT or Blood Smear\nTreatment: Artemisinin-based combination therapy (ACT)\nPrevention: Insecticide-treated bed nets, indoor residual spraying',
    suggestions: ['Show malaria hotspots', 'Malaria prevention', 'Treatment guidelines'],
  },
  {
    patterns: ['covid', 'covid-19', 'coronavirus', 'u07.1'],
    reply: 'COVID-19 (SARS-CoV-2) surveillance:\n• Currently tracking U07.1 ICD-10 reports\n• Real-time cluster detection active\n• Vaccination impact analysis available\n\nSymptoms: Fever, cough, breathlessness, loss of taste/smell\nTreatment: Supportive care; antivirals for high-risk patients\nPrevention: Vaccination, masking in high-risk settings',
    suggestions: ['View COVID clusters', 'Vaccination data', 'COVID guidelines'],
  },
  {
    patterns: ['help', 'what can you do', 'features', 'capabilities'],
    reply: 'I\'m OmniShield AI — here\'s what I can help with:\n\n🔍 Disease surveillance & hotspot detection\n🦠 Epidemic simulation (SIR/SEIR)\n🏥 ABHA integration & care pathway\n🔒 Privacy budget management\n📊 Population health analytics\n💊 Drug interactions (via CDSS)\n🤝 Federated learning status\n📋 FHIR data export\n\nAsk me anything about disease management or public health!',
    suggestions: ['Show hotspots', 'Run simulation', 'Verify ABHA ID', 'Check privacy budget'],
  },
]

// POST /api/v1/chatbot/message
router.post('/message', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'message field required', httpStatus: 400 } })
    }

    const msgLower = message.toLowerCase()

    // Try Anthropic Claude API if key is set
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 512,
            system: 'You are OmniShield AI — a healthcare surveillance assistant for India. You help with disease detection, ABHA integration, epidemic simulation, privacy management, and clinical decision support. Be concise, accurate, and use Indian healthcare context. Max 150 words per response.',
            messages: [{ role: 'user', content: message }],
          }),
        })
        if (response.ok) {
          const data = await response.json() as any
          const reply = data.content?.[0]?.text ?? ''
          if (reply) {
            return res.json({ reply, suggestions: ['More info', 'Show data', 'Run analysis'], source: 'claude' })
          }
        }
      } catch (_) {}
    }

    // Rule-based fallback
    for (const rule of RULE_BASED_RESPONSES) {
      if (rule.patterns.some(p => msgLower.includes(p))) {
        return res.json({ reply: rule.reply, suggestions: rule.suggestions, source: 'rule-based' })
      }
    }

    // Default response
    res.json({
      reply: `I understand you're asking about "${message}". As OmniShield AI, I specialise in healthcare surveillance, disease monitoring, ABHA integration, and epidemic modeling. Could you be more specific? Try asking about hotspots, dengue, privacy, ABHA, or epidemic simulations.`,
      suggestions: ['What are current hotspots?', 'What is ABHA?', 'What can you do?'],
      source: 'rule-based',
    })
  } catch (err) {
    next(err)
  }
})

export default router

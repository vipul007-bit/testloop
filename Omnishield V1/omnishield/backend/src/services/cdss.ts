// ============================================================
// src/services/cdss.ts — Clinical Decision Support System
// ============================================================

// ── ICD-10 symptom-disease database (20+ mappings) ────────────
interface ICD10Entry {
  code: string
  name: string
  symptoms: string[]
  urgency: 'Low' | 'Medium' | 'High' | 'Critical'
  recommendedTests: string[]
}

const ICD10_DB: ICD10Entry[] = [
  { code: 'J18.9', name: 'Pneumonia, unspecified', symptoms: ['fever', 'cough', 'dyspnea', 'chest pain', 'chills'], urgency: 'High', recommendedTests: ['Chest X-ray', 'CBC', 'Blood culture', 'Sputum culture'] },
  { code: 'I21.9', name: 'Acute myocardial infarction', symptoms: ['chest pain', 'dyspnea', 'sweating', 'nausea', 'arm pain'], urgency: 'Critical', recommendedTests: ['ECG', 'Troponin I', 'CK-MB', 'Echocardiogram'] },
  { code: 'A90', name: 'Dengue fever', symptoms: ['fever', 'headache', 'rash', 'myalgia', 'joint pain', 'retro-orbital pain'], urgency: 'High', recommendedTests: ['NS1 antigen', 'Dengue IgM/IgG', 'CBC', 'Platelet count'] },
  { code: 'A01.0', name: 'Typhoid fever', symptoms: ['fever', 'headache', 'abdominal pain', 'constipation', 'rose spots'], urgency: 'High', recommendedTests: ['Widal test', 'Blood culture', 'CBC'] },
  { code: 'B50', name: 'Malaria due to P. falciparum', symptoms: ['fever', 'chills', 'sweating', 'headache', 'nausea', 'splenomegaly'], urgency: 'High', recommendedTests: ['Rapid Malaria Test', 'Peripheral blood smear', 'CBC'] },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus', symptoms: ['polyuria', 'polydipsia', 'fatigue', 'blurred vision', 'weight loss'], urgency: 'Medium', recommendedTests: ['FBS', 'HbA1c', 'OGTT', 'Urine microalbumin'] },
  { code: 'I10', name: 'Essential hypertension', symptoms: ['headache', 'dizziness', 'blurred vision', 'chest pain', 'shortness of breath'], urgency: 'Medium', recommendedTests: ['BP monitoring', 'ECG', 'Renal function', 'Urine protein'] },
  { code: 'J45.9', name: 'Asthma, unspecified', symptoms: ['dyspnea', 'wheezing', 'cough', 'chest tightness', 'nocturnal symptoms'], urgency: 'Medium', recommendedTests: ['Spirometry', 'Peak flow', 'IgE', 'Chest X-ray'] },
  { code: 'K29.0', name: 'Acute gastritis', symptoms: ['nausea', 'vomiting', 'abdominal pain', 'epigastric pain', 'hematemesis'], urgency: 'Medium', recommendedTests: ['H. pylori test', 'Endoscopy', 'CBC', 'LFT'] },
  { code: 'N39.0', name: 'Urinary tract infection', symptoms: ['dysuria', 'frequency', 'urgency', 'hematuria', 'suprapubic pain'], urgency: 'Low', recommendedTests: ['Urinalysis', 'Urine culture', 'CBC'] },
  { code: 'G43.9', name: 'Migraine, unspecified', symptoms: ['headache', 'photophobia', 'phonophobia', 'nausea', 'aura'], urgency: 'Low', recommendedTests: ['MRI brain', 'CT scan', 'Ophthalmology review'] },
  { code: 'J06.9', name: 'URTI', symptoms: ['rhinorrhea', 'sore throat', 'cough', 'fever', 'sneezing', 'nasal congestion'], urgency: 'Low', recommendedTests: ['Throat swab', 'CBC'] },
  { code: 'M79.3', name: 'Panniculitis', symptoms: ['joint pain', 'myalgia', 'fatigue', 'fever', 'tenderness'], urgency: 'Low', recommendedTests: ['ESR', 'CRP', 'ANA', 'RF'] },
  { code: 'A15.0', name: 'Pulmonary tuberculosis', symptoms: ['cough', 'hemoptysis', 'night sweats', 'weight loss', 'fatigue', 'fever'], urgency: 'High', recommendedTests: ['Sputum AFB', 'Chest X-ray', 'Mantoux test', 'GeneXpert'] },
  { code: 'B24', name: 'HIV/AIDS', symptoms: ['fever', 'weight loss', 'diarrhea', 'oral thrush', 'lymphadenopathy', 'fatigue'], urgency: 'High', recommendedTests: ['HIV ELISA', 'Western blot', 'CD4 count', 'Viral load'] },
  { code: 'K35.9', name: 'Acute appendicitis', symptoms: ['abdominal pain', 'nausea', 'vomiting', 'fever', 'rebound tenderness'], urgency: 'Critical', recommendedTests: ['USG abdomen', 'CT abdomen', 'CBC', 'CRP'] },
  { code: 'I63.9', name: 'Cerebral infarction', symptoms: ['hemiplegia', 'facial drooping', 'speech difficulty', 'confusion', 'headache'], urgency: 'Critical', recommendedTests: ['CT head', 'MRI brain', 'ECG', 'Carotid Doppler'] },
  { code: 'J44.1', name: 'COPD with exacerbation', symptoms: ['dyspnea', 'cough', 'sputum', 'wheezing', 'cyanosis'], urgency: 'High', recommendedTests: ['Spirometry', 'ABG', 'Chest X-ray', 'CBC'] },
  { code: 'C34.9', name: 'Lung malignancy, unspecified', symptoms: ['cough', 'hemoptysis', 'weight loss', 'chest pain', 'hoarseness'], urgency: 'High', recommendedTests: ['CT chest', 'PET scan', 'Bronchoscopy', 'Biopsy'] },
  { code: 'E86.0', name: 'Dehydration', symptoms: ['weakness', 'dry mouth', 'dizziness', 'decreased urine', 'confusion'], urgency: 'Medium', recommendedTests: ['Electrolytes', 'BUN', 'Creatinine', 'Urinalysis'] },
  { code: 'F32.9', name: 'Major depressive episode', symptoms: ['low mood', 'anhedonia', 'fatigue', 'insomnia', 'poor concentration', 'weight change'], urgency: 'Medium', recommendedTests: ['PHQ-9', 'TSH', 'CBC', 'Vitamin B12'] },
  { code: 'A37.0', name: 'Whooping cough (Pertussis)', symptoms: ['cough', 'whoop', 'vomiting after cough', 'cyanosis'], urgency: 'High', recommendedTests: ['Nasopharyngeal swab', 'PCR', 'CBC'] },
]

// ── Drug interaction database (10+ pairs) ────────────────────
interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Contraindicated'
  description: string
  mechanism: string
}

const DRUG_INTERACTIONS: DrugInteraction[] = [
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'Severe', description: 'Increased bleeding risk', mechanism: 'Additive anticoagulant effect' },
  { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'Severe', description: 'Increased bleeding risk + renal impairment', mechanism: 'CYP2C9 inhibition + platelet inhibition' },
  { drug1: 'metformin', drug2: 'contrast dye', severity: 'Contraindicated', description: 'Risk of lactic acidosis', mechanism: 'Renal impairment from contrast reduces metformin clearance' },
  { drug1: 'ssri', drug2: 'tramadol', severity: 'Severe', description: 'Serotonin syndrome risk', mechanism: 'Additive serotonergic effect' },
  { drug1: 'ace inhibitor', drug2: 'potassium', severity: 'Moderate', description: 'Hyperkalemia risk', mechanism: 'ACE inhibitors reduce potassium excretion' },
  { drug1: 'statin', drug2: 'clarithromycin', severity: 'Severe', description: 'Myopathy/rhabdomyolysis risk', mechanism: 'CYP3A4 inhibition increases statin levels' },
  { drug1: 'methotrexate', drug2: 'nsaid', severity: 'Severe', description: 'Methotrexate toxicity', mechanism: 'NSAIDs reduce renal methotrexate clearance' },
  { drug1: 'digoxin', drug2: 'amiodarone', severity: 'Moderate', description: 'Digoxin toxicity', mechanism: 'Amiodarone inhibits P-glycoprotein' },
  { drug1: 'ciprofloxacin', drug2: 'antacids', severity: 'Moderate', description: 'Reduced ciprofloxacin absorption', mechanism: 'Chelation by divalent cations' },
  { drug1: 'sildenafil', drug2: 'nitrates', severity: 'Contraindicated', description: 'Severe hypotension', mechanism: 'Additive nitric oxide mediated vasodilation' },
  { drug1: 'lithium', drug2: 'nsaid', severity: 'Severe', description: 'Lithium toxicity', mechanism: 'NSAIDs reduce renal lithium clearance' },
  { drug1: 'maoi', drug2: 'tyramine', severity: 'Contraindicated', description: 'Hypertensive crisis', mechanism: 'MAO inhibition allows tyramine accumulation' },
]

// ── Types ─────────────────────────────────────────────────────
export interface Vitals {
  systolicBP?: number
  diastolicBP?: number
  heartRate?: number
  respiratoryRate?: number
  temperature?: number
  oxygenSaturation?: number
  consciousnessLevel?: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive'
}

export interface CDSSResult {
  possibleDiagnoses: Array<{
    icd10Code: string
    name: string
    confidence: number
    urgency: 'Low' | 'Medium' | 'High' | 'Critical'
  }>
  drugInteractionAlerts: DrugInteractionAlert[]
  recommendedTests: string[]
  news2Score: number
  news2Level: 'Low' | 'Medium' | 'High' | 'Critical'
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  recommendations: string[]
  analysedAt: string
}

export interface DrugInteractionAlert {
  drug1: string
  drug2: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Contraindicated'
  description: string
  action: string
}

export interface CDSSAlert {
  id: string
  patientId: string
  type: 'DiagnosticAlert' | 'DrugInteraction' | 'CriticalValue' | 'NEWS2'
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  message: string
  createdAt: string
  acknowledged: boolean
}

// ── In-memory alerts store ────────────────────────────────────
const alertStore = new Map<string, CDSSAlert[]>()
let alertCounter = 0

function storeAlert(patientId: string, alert: Omit<CDSSAlert, 'id' | 'createdAt' | 'acknowledged'>): CDSSAlert {
  const entry: CDSSAlert = {
    id: `alert-${++alertCounter}`,
    createdAt: new Date().toISOString(),
    acknowledged: false,
    ...alert,
  }
  const existing = alertStore.get(patientId) ?? []
  existing.push(entry)
  alertStore.set(patientId, existing)
  return entry
}

// ── NEWS2 Score calculation ────────────────────────────────────
function calculateNEWS2(vitals: Vitals): { score: number; level: 'Low' | 'Medium' | 'High' | 'Critical' } {
  let score = 0

  // Respiratory rate
  if (vitals.respiratoryRate !== undefined) {
    if (vitals.respiratoryRate <= 8) score += 3
    else if (vitals.respiratoryRate <= 11) score += 1
    else if (vitals.respiratoryRate <= 20) score += 0
    else if (vitals.respiratoryRate <= 24) score += 2
    else score += 3
  }

  // O2 saturation
  if (vitals.oxygenSaturation !== undefined) {
    if (vitals.oxygenSaturation <= 91) score += 3
    else if (vitals.oxygenSaturation <= 93) score += 2
    else if (vitals.oxygenSaturation <= 95) score += 1
  }

  // Systolic BP
  if (vitals.systolicBP !== undefined) {
    if (vitals.systolicBP <= 90) score += 3
    else if (vitals.systolicBP <= 100) score += 2
    else if (vitals.systolicBP <= 110) score += 1
    else if (vitals.systolicBP <= 219) score += 0
    else score += 3
  }

  // Heart rate
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate <= 40) score += 3
    else if (vitals.heartRate <= 50) score += 1
    else if (vitals.heartRate <= 90) score += 0
    else if (vitals.heartRate <= 110) score += 1
    else if (vitals.heartRate <= 130) score += 2
    else score += 3
  }

  // Temperature
  if (vitals.temperature !== undefined) {
    if (vitals.temperature <= 35.0) score += 3
    else if (vitals.temperature <= 36.0) score += 1
    else if (vitals.temperature <= 38.0) score += 0
    else if (vitals.temperature <= 39.0) score += 1
    else score += 2
  }

  // Consciousness
  if (vitals.consciousnessLevel && vitals.consciousnessLevel !== 'Alert') {
    score += 3
  }

  let level: 'Low' | 'Medium' | 'High' | 'Critical'
  if (score >= 7) level = 'Critical'
  else if (score >= 5) level = 'High'
  else if (score >= 3) level = 'Medium'
  else level = 'Low'

  return { score, level }
}

// ── Main CDSS analysis ────────────────────────────────────────
export function analyzePatient(
  symptoms: string[],
  history: string[],
  medications: string[],
  vitals: Vitals,
  patientId?: string
): CDSSResult {
  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim())
  // Include history keywords to augment symptom matching
  const normalizedHistory = history.map(h => h.toLowerCase().trim())
  const allClinicalClues = [...normalizedSymptoms, ...normalizedHistory]

  // Score each disease by symptom/history overlap
  const scored = ICD10_DB.map(entry => {
    const matches = entry.symptoms.filter(s => allClinicalClues.some(ns => ns.includes(s) || s.includes(ns)))
    const confidence = matches.length / Math.max(entry.symptoms.length, allClinicalClues.length)
    return { ...entry, confidence: Math.round(confidence * 100) / 100 }
  }).filter(e => e.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  // Drug interactions
  const drugAlerts = checkDrugInteractions(medications)

  // Recommended tests (union of top 3 diagnoses)
  const allTests = new Set<string>()
  scored.slice(0, 3).forEach(d => d.recommendedTests.forEach(t => allTests.add(t)))

  // NEWS2
  const { score: news2Score, level: news2Level } = calculateNEWS2(vitals)

  // Overall risk
  const topUrgency = scored[0]?.urgency ?? 'Low'
  const riskLevel = news2Level === 'Critical' || topUrgency === 'Critical' ? 'Critical'
    : news2Level === 'High' || topUrgency === 'High' ? 'High'
    : news2Level === 'Medium' || topUrgency === 'Medium' ? 'Medium'
    : 'Low'

  const recommendations: string[] = []
  if (news2Score >= 7) recommendations.push('URGENT: Escalate to senior clinician immediately')
  if (news2Score >= 5) recommendations.push('Initiate continuous monitoring')
  if (drugAlerts.some(a => a.severity === 'Contraindicated')) recommendations.push('ALERT: Contraindicated drug combination detected — review medications immediately')
  if (scored[0]?.urgency === 'Critical') recommendations.push(`Suspected ${scored[0].name} — immediate intervention required`)

  // Store alerts for patient
  if (patientId) {
    if (riskLevel === 'Critical' || riskLevel === 'High') {
      storeAlert(patientId, { patientId, type: 'NEWS2', severity: riskLevel, message: `NEWS2 score ${news2Score} — ${news2Level} risk` })
    }
    drugAlerts.filter(a => a.severity === 'Severe' || a.severity === 'Contraindicated').forEach(a => {
      storeAlert(patientId, { patientId, type: 'DrugInteraction', severity: a.severity === 'Contraindicated' ? 'Critical' : 'High', message: a.description })
    })
  }

  return {
    possibleDiagnoses: scored.map(d => ({ icd10Code: d.code, name: d.name, confidence: d.confidence, urgency: d.urgency })),
    drugInteractionAlerts: drugAlerts,
    recommendedTests: [...allTests],
    news2Score,
    news2Level,
    riskLevel,
    recommendations,
    analysedAt: new Date().toISOString(),
  }
}

// ── Drug interaction checker ─────────────────────────────────
export function checkDrugInteractions(medications: string[]): DrugInteractionAlert[] {
  const normalized = medications.map(m => m.toLowerCase().trim())
  const alerts: DrugInteractionAlert[] = []

  for (const interaction of DRUG_INTERACTIONS) {
    const has1 = normalized.some(m => m.includes(interaction.drug1) || interaction.drug1.includes(m))
    const has2 = normalized.some(m => m.includes(interaction.drug2) || interaction.drug2.includes(m))

    if (has1 && has2) {
      alerts.push({
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        severity: interaction.severity,
        description: interaction.description,
        action: interaction.severity === 'Contraindicated'
          ? 'Do not co-administer'
          : interaction.severity === 'Severe'
          ? 'Avoid combination if possible; monitor closely'
          : 'Monitor patient and adjust doses as needed',
      })
    }
  }

  return alerts
}

// ── Get active alerts ─────────────────────────────────────────
export function getActiveAlerts(patientId: string): CDSSAlert[] {
  return (alertStore.get(patientId) ?? []).filter(a => !a.acknowledged)
}

export function acknowledgeAlert(patientId: string, alertId: string): boolean {
  const alerts = alertStore.get(patientId)
  if (!alerts) return false
  const alert = alerts.find(a => a.id === alertId)
  if (!alert) return false
  alert.acknowledged = true
  return true
}

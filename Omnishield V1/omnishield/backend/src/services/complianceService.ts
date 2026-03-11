// ============================================================
// src/services/complianceService.ts — HIPAA/GDPR/NDHM Compliance
// ============================================================

export type ComplianceStatus = 'Compliant' | 'Non-Compliant' | 'Requires Review' | 'Not Applicable'

export interface ComplianceCheck {
  rule: string
  status: ComplianceStatus
  description: string
  remediation?: string
  lastChecked: string
}

export interface FrameworkCompliance {
  framework: string
  overallStatus: ComplianceStatus
  score: number
  checks: ComplianceCheck[]
}

export interface ComplianceDashboard {
  generatedAt: string
  overallScore: number
  frameworks: {
    hipaa: FrameworkCompliance
    gdpr: FrameworkCompliance
    ndhm: FrameworkCompliance
  }
  criticalIssues: number
  recommendations: string[]
}

// ── HIPAA Rule Definitions ─────────────────────────────────────
const HIPAA_RULES = [
  { rule: '164.312(a)(1)', description: 'Access Control — unique user identification', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(a)(2)(i)', description: 'Emergency Access Procedure', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(a)(2)(iii)', description: 'Automatic Logoff', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(a)(2)(iv)', description: 'Encryption and Decryption', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(b)', description: 'Audit Controls — hardware, software, and procedural mechanisms', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(c)(1)', description: 'Integrity — ePHI not improperly altered or destroyed', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(d)', description: 'Person or Entity Authentication', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.312(e)(1)', description: 'Transmission Security — guard against unauthorized ePHI access', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: '164.308(a)(1)', description: 'Security Management Process — risk analysis', defaultStatus: 'Requires Review' as ComplianceStatus },
  { rule: '164.308(a)(6)', description: 'Security Incident Procedures', defaultStatus: 'Compliant' as ComplianceStatus },
]

// ── GDPR Article Definitions ──────────────────────────────────
const GDPR_RULES = [
  { rule: 'Article 5', description: 'Principles of data processing — lawfulness, fairness, transparency', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 6', description: 'Lawfulness of processing — valid legal basis', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 9', description: 'Processing special categories of data (health data)', defaultStatus: 'Requires Review' as ComplianceStatus },
  { rule: 'Article 13/14', description: 'Information provided to data subject', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 17', description: 'Right to erasure ("right to be forgotten")', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 20', description: 'Right to data portability', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 25', description: 'Data protection by design and by default', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 30', description: 'Records of processing activities', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 32', description: 'Security of processing — appropriate technical measures', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'Article 33', description: 'Notification of breach within 72 hours', defaultStatus: 'Requires Review' as ComplianceStatus },
  { rule: 'Article 35', description: 'Data Protection Impact Assessment (DPIA)', defaultStatus: 'Requires Review' as ComplianceStatus },
]

// ── NDHM (National Digital Health Mission) Rules ──────────────
const NDHM_RULES = [
  { rule: 'NDHM-1.1', description: 'ABHA ID integration for patient identification', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-1.2', description: 'Health record linkage to ABHA', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-2.1', description: 'FHIR R4 interoperability compliance', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-2.2', description: 'HL7 FHIR data exchange standards', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-3.1', description: 'Patient consent management', defaultStatus: 'Requires Review' as ComplianceStatus },
  { rule: 'NDHM-3.2', description: 'Granular consent for data sharing', defaultStatus: 'Requires Review' as ComplianceStatus },
  { rule: 'NDHM-4.1', description: 'Data localisation within India', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-5.1', description: 'Audit trail for health record access', defaultStatus: 'Compliant' as ComplianceStatus },
  { rule: 'NDHM-5.2', description: 'Healthcare provider verification', defaultStatus: 'Compliant' as ComplianceStatus },
]

// ── Compliance check evaluators ────────────────────────────────
export function checkHIPAACompliance(operation: string, dataType: string): ComplianceCheck[] {
  const timestamp = new Date().toISOString()

  return HIPAA_RULES.map(rule => {
    let status = rule.defaultStatus

    // Context-sensitive overrides
    if (rule.rule === '164.312(a)(2)(iv)' && !operation.includes('encrypted')) {
      status = 'Requires Review'
    }
    if (rule.rule === '164.308(a)(1)' && dataType === 'PHI') {
      status = 'Requires Review'
    }

    return {
      rule: rule.rule,
      status,
      description: rule.description,
      remediation: status !== 'Compliant'
        ? `Review ${rule.rule} implementation for ${operation} on ${dataType}`
        : undefined,
      lastChecked: timestamp,
    }
  })
}

export function checkGDPRCompliance(operation: string, dataSubject: string): ComplianceCheck[] {
  const timestamp = new Date().toISOString()

  return GDPR_RULES.map(rule => {
    let status = rule.defaultStatus

    if (rule.rule === 'Article 9' && dataSubject === 'patient') {
      status = 'Requires Review'
    }
    if (rule.rule === 'Article 33' && operation === 'breach') {
      status = 'Non-Compliant'
    }

    return {
      rule: rule.rule,
      status,
      description: rule.description,
      remediation: status === 'Non-Compliant'
        ? `Immediate action required: ${rule.description}`
        : status === 'Requires Review'
        ? `Review ${rule.rule} for ${operation} involving ${dataSubject}`
        : undefined,
      lastChecked: timestamp,
    }
  })
}

export function checkNDHMCompliance(operation: string): ComplianceCheck[] {
  const timestamp = new Date().toISOString()

  return NDHM_RULES.map(rule => {
    let status = rule.defaultStatus

    if ((rule.rule === 'NDHM-3.1' || rule.rule === 'NDHM-3.2') && operation === 'data_share') {
      status = 'Requires Review'
    }

    return {
      rule: rule.rule,
      status,
      description: rule.description,
      remediation: status !== 'Compliant'
        ? `Ensure ${rule.description} is properly implemented`
        : undefined,
      lastChecked: timestamp,
    }
  })
}

function scoreChecks(checks: ComplianceCheck[]): number {
  const weights: Record<ComplianceStatus, number> = {
    'Compliant': 1,
    'Requires Review': 0.5,
    'Non-Compliant': 0,
    'Not Applicable': 1,
  }
  const total = checks.reduce((s, c) => s + weights[c.status], 0)
  return Math.round((total / checks.length) * 100)
}

function determineStatus(score: number): ComplianceStatus {
  if (score >= 90) return 'Compliant'
  if (score >= 70) return 'Requires Review'
  return 'Non-Compliant'
}

export function generateComplianceDashboard(): ComplianceDashboard {
  const hipaaChecks = checkHIPAACompliance('general', 'PHI')
  const gdprChecks = checkGDPRCompliance('general', 'patient')
  const ndhmChecks = checkNDHMCompliance('general')

  const hipaaScore = scoreChecks(hipaaChecks)
  const gdprScore = scoreChecks(gdprChecks)
  const ndhmScore = scoreChecks(ndhmChecks)

  const overallScore = Math.round((hipaaScore + gdprScore + ndhmScore) / 3)

  const allChecks = [...hipaaChecks, ...gdprChecks, ...ndhmChecks]
  const criticalIssues = allChecks.filter(c => c.status === 'Non-Compliant').length

  const recommendations: string[] = []
  if (hipaaScore < 90) recommendations.push('Complete HIPAA risk analysis (§164.308(a)(1))')
  if (gdprScore < 90) recommendations.push('Finalise GDPR DPIA for patient data processing (Art. 35)')
  if (ndhmScore < 90) recommendations.push('Implement granular patient consent management per NDHM guidelines')
  if (overallScore > 85) recommendations.push('Schedule quarterly compliance review to maintain certification')

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    frameworks: {
      hipaa: { framework: 'HIPAA Security Rule', overallStatus: determineStatus(hipaaScore), score: hipaaScore, checks: hipaaChecks },
      gdpr: { framework: 'GDPR', overallStatus: determineStatus(gdprScore), score: gdprScore, checks: gdprChecks },
      ndhm: { framework: 'NDHM Health Data Management Policy', overallStatus: determineStatus(ndhmScore), score: ndhmScore, checks: ndhmChecks },
    },
    criticalIssues,
    recommendations,
  }
}

// ============================================================
// src/services/fhirService.ts — FHIR R4 Resource Handlers
// ============================================================

import crypto from 'crypto'

// ── FHIR R4 Base Types ────────────────────────────────────────
export interface FHIRCoding {
  system: string
  code: string
  display?: string
}

export interface FHIRCodeableConcept {
  coding: FHIRCoding[]
  text?: string
}

export interface FHIRReference {
  reference: string
  display?: string
}

export interface FHIRMeta {
  versionId: string
  lastUpdated: string
  profile?: string[]
}

// ── FHIR Patient R4 ───────────────────────────────────────────
export interface FHIRPatient {
  resourceType: 'Patient'
  id: string
  meta: FHIRMeta
  identifier?: Array<{ system: string; value: string }>
  active: boolean
  name: Array<{ use: string; family: string; given: string[] }>
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  telecom?: Array<{ system: string; value: string; use?: string }>
  address?: Array<{ use?: string; line?: string[]; city?: string; state?: string; postalCode?: string; country?: string }>
}

export interface PatientInput {
  id?: string
  name: string
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  phone?: string
  email?: string
  abhaId?: string
  address?: { city?: string; state?: string; postalCode?: string }
}

export function createPatientResource(data: PatientInput): FHIRPatient {
  const nameParts = data.name.split(' ')
  const family = nameParts.pop() ?? data.name
  const given = nameParts.length > 0 ? nameParts : [data.name]

  return {
    resourceType: 'Patient',
    id: data.id ?? crypto.randomUUID(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    identifier: data.abhaId
      ? [{ system: 'https://ndhm.gov.in/abha', value: data.abhaId }]
      : undefined,
    active: true,
    name: [{ use: 'official', family, given }],
    gender: data.gender,
    birthDate: data.birthDate,
    telecom: [
      ...(data.phone ? [{ system: 'phone', value: data.phone, use: 'mobile' }] : []),
      ...(data.email ? [{ system: 'email', value: data.email }] : []),
    ],
    address: data.address
      ? [{
          use: 'home',
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: 'IN',
        }]
      : undefined,
  }
}

// ── FHIR Observation R4 ───────────────────────────────────────
export interface FHIRObservation {
  resourceType: 'Observation'
  id: string
  meta: FHIRMeta
  status: 'registered' | 'preliminary' | 'final' | 'amended'
  category: FHIRCodeableConcept[]
  code: FHIRCodeableConcept
  subject: FHIRReference
  effectiveDateTime: string
  valueQuantity?: { value: number; unit: string; system: string; code: string }
  valueString?: string
  interpretation?: FHIRCodeableConcept[]
}

export interface ObservationInput {
  id?: string
  patientId: string
  loincCode: string
  display: string
  value?: number
  unit?: string
  valueString?: string
  status?: 'registered' | 'preliminary' | 'final' | 'amended'
  effectiveDateTime?: string
}

export function createObservationResource(data: ObservationInput): FHIRObservation {
  return {
    resourceType: 'Observation',
    id: data.id ?? crypto.randomUUID(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
    },
    status: data.status ?? 'final',
    category: [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }],
    }],
    code: {
      coding: [{ system: 'http://loinc.org', code: data.loincCode, display: data.display }],
      text: data.display,
    },
    subject: { reference: `Patient/${data.patientId}` },
    effectiveDateTime: data.effectiveDateTime ?? new Date().toISOString(),
    ...(data.value !== undefined && data.unit ? {
      valueQuantity: {
        value: data.value,
        unit: data.unit,
        system: 'http://unitsofmeasure.org',
        code: data.unit,
      },
    } : {}),
    ...(data.valueString ? { valueString: data.valueString } : {}),
  }
}

// ── FHIR DiagnosticReport R4 ──────────────────────────────────
export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport'
  id: string
  meta: FHIRMeta
  status: 'registered' | 'partial' | 'final' | 'corrected' | 'cancelled'
  category: FHIRCodeableConcept[]
  code: FHIRCodeableConcept
  subject: FHIRReference
  effectiveDateTime: string
  issued: string
  result?: FHIRReference[]
  conclusion?: string
}

export interface DiagnosticReportInput {
  id?: string
  patientId: string
  code: string
  display: string
  category?: string
  observationIds?: string[]
  conclusion?: string
  status?: 'registered' | 'partial' | 'final' | 'corrected' | 'cancelled'
}

export function createDiagnosticReportResource(data: DiagnosticReportInput): FHIRDiagnosticReport {
  return {
    resourceType: 'DiagnosticReport',
    id: data.id ?? crypto.randomUUID(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport'],
    },
    status: data.status ?? 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: data.category ?? 'LAB',
        display: data.category ?? 'Laboratory',
      }],
    }],
    code: {
      coding: [{ system: 'http://loinc.org', code: data.code, display: data.display }],
      text: data.display,
    },
    subject: { reference: `Patient/${data.patientId}` },
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    result: data.observationIds?.map(id => ({ reference: `Observation/${id}` })),
    conclusion: data.conclusion,
  }
}

// ── FHIR MedicationRequest R4 ─────────────────────────────────
export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest'
  id: string
  meta: FHIRMeta
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'stopped'
  intent: 'proposal' | 'plan' | 'order' | 'original-order'
  medicationCodeableConcept: FHIRCodeableConcept
  subject: FHIRReference
  authoredOn: string
  dosageInstruction?: Array<{
    text: string
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } }
    doseAndRate?: Array<{ doseQuantity?: { value: number; unit: string } }>
  }>
  note?: Array<{ text: string }>
}

export interface MedicationRequestInput {
  id?: string
  patientId: string
  rxnormCode: string
  medicationName: string
  dosageText?: string
  frequency?: number
  period?: number
  periodUnit?: string
  doseValue?: number
  doseUnit?: string
  notes?: string
  status?: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'stopped'
}

export function createMedicationRequestResource(data: MedicationRequestInput): FHIRMedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id: data.id ?? crypto.randomUUID(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/MedicationRequest'],
    },
    status: data.status ?? 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: data.rxnormCode, display: data.medicationName }],
      text: data.medicationName,
    },
    subject: { reference: `Patient/${data.patientId}` },
    authoredOn: new Date().toISOString(),
    dosageInstruction: data.dosageText ? [{
      text: data.dosageText,
      timing: {
        repeat: {
          frequency: data.frequency,
          period: data.period,
          periodUnit: data.periodUnit ?? 'd',
        },
      },
      doseAndRate: data.doseValue !== undefined
        ? [{ doseQuantity: { value: data.doseValue, unit: data.doseUnit ?? 'mg' } }]
        : undefined,
    }] : undefined,
    note: data.notes ? [{ text: data.notes }] : undefined,
  }
}

// ── FHIR Bundle ───────────────────────────────────────────────
export type FHIRResource = FHIRPatient | FHIRObservation | FHIRDiagnosticReport | FHIRMedicationRequest

export interface FHIRBundle {
  resourceType: 'Bundle'
  id: string
  meta: FHIRMeta
  type: 'collection' | 'searchset' | 'transaction' | 'document'
  timestamp: string
  total: number
  entry: Array<{ resource: FHIRResource; fullUrl?: string }>
}

export function createBundle(resources: FHIRResource[], type: FHIRBundle['type'] = 'collection'): FHIRBundle {
  return {
    resourceType: 'Bundle',
    id: crypto.randomUUID(),
    meta: { versionId: '1', lastUpdated: new Date().toISOString() },
    type,
    timestamp: new Date().toISOString(),
    total: resources.length,
    entry: resources.map(r => ({
      resource: r,
      fullUrl: `urn:uuid:${r.id}`,
    })),
  }
}

// ── Convert from FHIR to internal format ──────────────────────
export interface InternalPatient {
  id: string
  name: string
  gender?: string
  birthDate?: string
  phone?: string
  abhaId?: string
}

export function convertFromFHIR(resource: FHIRResource): Record<string, unknown> {
  if (resource.resourceType === 'Patient') {
    const p = resource as FHIRPatient
    const nameObj = p.name?.[0]
    const fullName = nameObj
      ? [...(nameObj.given ?? []), nameObj.family].filter(Boolean).join(' ')
      : 'Unknown'
    return {
      id: p.id,
      name: fullName,
      gender: p.gender,
      birthDate: p.birthDate,
      phone: p.telecom?.find(t => t.system === 'phone')?.value,
      email: p.telecom?.find(t => t.system === 'email')?.value,
      abhaId: p.identifier?.find(i => i.system.includes('abha'))?.value,
      active: p.active,
    }
  }

  if (resource.resourceType === 'Observation') {
    const o = resource as FHIRObservation
    return {
      id: o.id,
      patientId: o.subject.reference.replace('Patient/', ''),
      code: o.code.coding?.[0]?.code,
      display: o.code.text,
      value: o.valueQuantity?.value,
      unit: o.valueQuantity?.unit,
      status: o.status,
      effectiveDateTime: o.effectiveDateTime,
    }
  }

  if (resource.resourceType === 'MedicationRequest') {
    const m = resource as FHIRMedicationRequest
    return {
      id: m.id,
      patientId: m.subject.reference.replace('Patient/', ''),
      medication: m.medicationCodeableConcept.text,
      rxnormCode: m.medicationCodeableConcept.coding?.[0]?.code,
      status: m.status,
      authoredOn: m.authoredOn,
      dosage: m.dosageInstruction?.[0]?.text,
    }
  }

  return { id: resource.id, resourceType: resource.resourceType }
}

// ============================================================
// src/services/dicomService.ts — DICOM Metadata Handler
// ============================================================

export interface DicomStudy {
  studyUid: string
  seriesUid: string
  patientId: string
  modality: string
  studyDate: string
  studyDescription: string
  seriesDescription: string
  numberOfImages: number
  manufacturer?: string
  institutionName?: string
  bodyPartExamined?: string
  metadata: Record<string, string>
  storedAt: string
}

export interface DicomMetadata {
  studyInstanceUid?: string
  seriesInstanceUid?: string
  modality?: string
  studyDate?: string
  studyDescription?: string
  seriesDescription?: string
  numberOfImages?: number
  manufacturer?: string
  institutionName?: string
  bodyPartExamined?: string
  [key: string]: string | number | undefined
}

// DICOM tag to friendly name mapping
const DICOM_TAG_MAP: Record<string, string> = {
  '(0008,0060)': 'modality',
  '(0008,0020)': 'studyDate',
  '(0008,1030)': 'studyDescription',
  '(0008,103E)': 'seriesDescription',
  '(0008,0070)': 'manufacturer',
  '(0008,0080)': 'institutionName',
  '(0018,0015)': 'bodyPartExamined',
  '(0020,000D)': 'studyInstanceUid',
  '(0020,000E)': 'seriesInstanceUid',
  '(0028,0008)': 'numberOfImages',
}

// ── In-memory store ───────────────────────────────────────────
const dicomStore = new Map<string, DicomStudy[]>()  // patientId → studies

// ── Store DICOM reference ─────────────────────────────────────
export function storeDicomReference(
  patientId: string,
  studyUid: string,
  seriesUid: string,
  metadata: DicomMetadata
): DicomStudy {
  const study: DicomStudy = {
    studyUid,
    seriesUid,
    patientId,
    modality: metadata.modality ?? 'OT',
    studyDate: metadata.studyDate ?? new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    studyDescription: metadata.studyDescription ?? 'Unknown Study',
    seriesDescription: metadata.seriesDescription ?? 'Unknown Series',
    numberOfImages: typeof metadata.numberOfImages === 'number' ? metadata.numberOfImages : 1,
    manufacturer: metadata.manufacturer,
    institutionName: metadata.institutionName,
    bodyPartExamined: metadata.bodyPartExamined,
    metadata: Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, String(v ?? '')])
    ),
    storedAt: new Date().toISOString(),
  }

  const existing = dicomStore.get(patientId) ?? []
  existing.push(study)
  dicomStore.set(patientId, existing)

  return study
}

// ── Get all studies for a patient ─────────────────────────────
export function getDicomStudies(patientId: string): DicomStudy[] {
  return dicomStore.get(patientId) ?? []
}

// ── Parse raw DICOM headers ───────────────────────────────────
export function parseDicomMetadata(rawHeaders: Record<string, string>): DicomMetadata {
  const result: DicomMetadata = {}

  for (const [tag, value] of Object.entries(rawHeaders)) {
    const friendlyName = DICOM_TAG_MAP[tag]
    if (friendlyName) {
      if (friendlyName === 'numberOfImages') {
        result[friendlyName] = parseInt(value, 10) || 1
      } else {
        result[friendlyName] = value
      }
    } else {
      // Store unknown tags as-is
      result[tag] = value
    }
  }

  return result
}

// ── Delete study ──────────────────────────────────────────────
export function deleteDicomStudy(patientId: string, studyUid: string): boolean {
  const studies = dicomStore.get(patientId)
  if (!studies) return false
  const filtered = studies.filter(s => s.studyUid !== studyUid)
  if (filtered.length === studies.length) return false
  dicomStore.set(patientId, filtered)
  return true
}

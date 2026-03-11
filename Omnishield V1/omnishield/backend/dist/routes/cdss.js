"use strict";
// ============================================================
// src/routes/cdss.ts — Clinical Decision Support System
// POST /analyze
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ICD-10 symptom-to-diagnosis mapping
const SYMPTOM_DIAGNOSES = {
    fever: [
        { icd: 'A90', name: 'Dengue Fever', confidence: 0.72 },
        { icd: 'B54', name: 'Malaria', confidence: 0.65 },
        { icd: 'A01.0', name: 'Typhoid Fever', confidence: 0.60 },
        { icd: 'J18.9', name: 'Pneumonia', confidence: 0.45 },
        { icd: 'U07.1', name: 'COVID-19', confidence: 0.40 },
    ],
    headache: [
        { icd: 'G43.9', name: 'Migraine', confidence: 0.70 },
        { icd: 'A90', name: 'Dengue Fever', confidence: 0.55 },
        { icd: 'G44.2', name: 'Tension Headache', confidence: 0.65 },
        { icd: 'I10', name: 'Hypertension', confidence: 0.40 },
    ],
    cough: [
        { icd: 'J18.9', name: 'Pneumonia', confidence: 0.65 },
        { icd: 'J06.9', name: 'Upper Respiratory Infection', confidence: 0.75 },
        { icd: 'A15.0', name: 'Pulmonary Tuberculosis', confidence: 0.35 },
        { icd: 'U07.1', name: 'COVID-19', confidence: 0.55 },
        { icd: 'J45.9', name: 'Asthma', confidence: 0.40 },
    ],
    'chest pain': [
        { icd: 'I21.9', name: 'Acute Myocardial Infarction', confidence: 0.55 },
        { icd: 'J18.9', name: 'Pneumonia', confidence: 0.40 },
        { icd: 'K21.9', name: 'GERD', confidence: 0.50 },
        { icd: 'M54.6', name: 'Costochondritis', confidence: 0.35 },
    ],
    diarrhea: [
        { icd: 'A09', name: 'Acute Gastroenteritis', confidence: 0.80 },
        { icd: 'A00.9', name: 'Cholera', confidence: 0.30 },
        { icd: 'K58.0', name: 'Irritable Bowel Syndrome', confidence: 0.45 },
    ],
    rash: [
        { icd: 'L50.9', name: 'Urticaria', confidence: 0.60 },
        { icd: 'B05.9', name: 'Measles', confidence: 0.45 },
        { icd: 'B06.9', name: 'Rubella', confidence: 0.40 },
        { icd: 'A90', name: 'Dengue Fever', confidence: 0.50 },
    ],
    fatigue: [
        { icd: 'D64.9', name: 'Anaemia', confidence: 0.55 },
        { icd: 'E11.9', name: 'Type 2 Diabetes', confidence: 0.40 },
        { icd: 'F32.9', name: 'Depression', confidence: 0.45 },
        { icd: 'B54', name: 'Malaria', confidence: 0.50 },
    ],
    'joint pain': [
        { icd: 'M79.3', name: 'Panniculitis', confidence: 0.40 },
        { icd: 'M06.9', name: 'Rheumatoid Arthritis', confidence: 0.55 },
        { icd: 'A90', name: 'Dengue Fever', confidence: 0.65 },
        { icd: 'M05.9', name: 'Seropositive RA', confidence: 0.45 },
    ],
    vomiting: [
        { icd: 'A09', name: 'Acute Gastroenteritis', confidence: 0.75 },
        { icd: 'R11.1', name: 'Vomiting without Nausea', confidence: 0.50 },
        { icd: 'K92.1', name: 'Melaena', confidence: 0.30 },
    ],
};
// Drug interaction database
const DRUG_INTERACTIONS = [
    { drug1: 'Warfarin', drug2: 'Aspirin', severity: 'HIGH', description: 'Increased bleeding risk. Avoid combination or monitor INR closely.' },
    { drug1: 'Metformin', drug2: 'Contrast Dye', severity: 'HIGH', description: 'Risk of lactic acidosis. Hold Metformin before and after imaging.' },
    { drug1: 'ACE Inhibitors', drug2: 'Potassium Supplements', severity: 'HIGH', description: 'Risk of hyperkalaemia. Monitor electrolytes.' },
    { drug1: 'Statins', drug2: 'Amiodarone', severity: 'HIGH', description: 'Increased statin levels → myopathy risk.' },
    { drug1: 'SSRIs', drug2: 'Tramadol', severity: 'HIGH', description: 'Risk of serotonin syndrome.' },
    { drug1: 'Clopidogrel', drug2: 'Omeprazole', severity: 'MODERATE', description: 'Omeprazole reduces Clopidogrel efficacy.' },
    { drug1: 'Paracetamol', drug2: 'Alcohol', severity: 'MODERATE', description: 'Hepatotoxicity risk with regular alcohol use.' },
    { drug1: 'NSAIDs', drug2: 'ACE Inhibitors', severity: 'MODERATE', description: 'NSAIDs reduce antihypertensive effect and increase nephrotoxicity risk.' },
    { drug1: 'Digoxin', drug2: 'Amiodarone', severity: 'HIGH', description: 'Amiodarone increases Digoxin levels → toxicity.' },
    { drug1: 'Lithium', drug2: 'NSAIDs', severity: 'HIGH', description: 'NSAIDs increase Lithium levels → toxicity risk.' },
    { drug1: 'Theophylline', drug2: 'Ciprofloxacin', severity: 'HIGH', description: 'Ciprofloxacin increases Theophylline levels.' },
    { drug1: 'MAOIs', drug2: 'Antidepressants', severity: 'HIGH', description: 'Risk of serotonin syndrome. Do not combine.' },
    { drug1: 'Methotrexate', drug2: 'NSAIDs', severity: 'HIGH', description: 'NSAIDs increase Methotrexate toxicity.' },
    { drug1: 'Quinolones', drug2: 'Antacids', severity: 'MODERATE', description: 'Antacids reduce quinolone absorption.' },
    { drug1: 'Benzodiazepines', drug2: 'Opioids', severity: 'HIGH', description: 'CNS and respiratory depression.' },
    { drug1: 'Rifampicin', drug2: 'Oral Contraceptives', severity: 'HIGH', description: 'Rifampicin reduces contraceptive efficacy.' },
    { drug1: 'Chloroquine', drug2: 'Antacids', severity: 'MODERATE', description: 'Antacids reduce chloroquine absorption.' },
    { drug1: 'Fluconazole', drug2: 'Warfarin', severity: 'HIGH', description: 'Fluconazole increases anticoagulant effect.' },
    { drug1: 'Beta-blockers', drug2: 'Verapamil', severity: 'HIGH', description: 'Risk of heart block and bradycardia.' },
    { drug1: 'Doxycycline', drug2: 'Iron Supplements', severity: 'MODERATE', description: 'Iron reduces doxycycline absorption. Separate by 2 hours.' },
];
// POST /api/v1/cdss/analyze
router.post('/analyze', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { symptoms = [], currentMedications = [], medicalHistory = [] } = req.body;
        // 1. Diagnoses based on symptoms
        const diagnosisScores = new Map();
        for (const symptom of symptoms) {
            const sym = symptom.toLowerCase();
            for (const [key, diagnoses] of Object.entries(SYMPTOM_DIAGNOSES)) {
                if (sym.includes(key) || key.includes(sym)) {
                    for (const dx of diagnoses) {
                        const existing = diagnosisScores.get(dx.icd);
                        if (existing) {
                            existing.score += dx.confidence;
                            existing.count++;
                        }
                        else {
                            diagnosisScores.set(dx.icd, { icd: dx.icd, name: dx.name, score: dx.confidence, count: 1 });
                        }
                    }
                }
            }
        }
        const possibleDiagnoses = Array.from(diagnosisScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(d => ({
            icd: d.icd,
            name: d.name,
            confidence: Math.min(0.99, d.score / Math.max(1, symptoms.length)).toFixed(2),
            supportingSymptoms: symptoms.slice(0, 3),
        }));
        // 2. Drug interactions
        const drugInteractions = [];
        for (let i = 0; i < currentMedications.length; i++) {
            for (let j = i + 1; j < currentMedications.length; j++) {
                const med1 = currentMedications[i];
                const med2 = currentMedications[j];
                for (const interaction of DRUG_INTERACTIONS) {
                    if ((med1.toLowerCase().includes(interaction.drug1.toLowerCase()) && med2.toLowerCase().includes(interaction.drug2.toLowerCase())) ||
                        (med2.toLowerCase().includes(interaction.drug1.toLowerCase()) && med1.toLowerCase().includes(interaction.drug2.toLowerCase()))) {
                        drugInteractions.push({ drug1: med1, drug2: med2, severity: interaction.severity, description: interaction.description });
                    }
                }
            }
        }
        // 3. Recommended tests
        const recommendedTests = [];
        const symptomSet = symptoms.map((s) => s.toLowerCase()).join(' ');
        if (symptomSet.includes('fever')) {
            recommendedTests.push({ test: 'Complete Blood Count (CBC)', reason: 'Differentiate bacterial vs viral infection', urgency: 'URGENT' });
            recommendedTests.push({ test: 'Dengue NS1 Antigen + IgM/IgG', reason: 'Rule out dengue in endemic area', urgency: 'URGENT' });
            recommendedTests.push({ test: 'Malaria RDT', reason: 'Rule out Plasmodium infection', urgency: 'URGENT' });
            recommendedTests.push({ test: 'Widal Test', reason: 'Typhoid fever screening', urgency: 'ROUTINE' });
        }
        if (symptomSet.includes('cough')) {
            recommendedTests.push({ test: 'Chest X-Ray', reason: 'Assess for pneumonia or TB', urgency: 'URGENT' });
            recommendedTests.push({ test: 'Sputum AFB Smear', reason: 'Screen for tuberculosis', urgency: 'ROUTINE' });
        }
        if (symptomSet.includes('chest pain')) {
            recommendedTests.push({ test: 'ECG (12-lead)', reason: 'Rule out cardiac event', urgency: 'STAT' });
            recommendedTests.push({ test: 'Troponin I/T', reason: 'Detect myocardial injury', urgency: 'STAT' });
        }
        if (recommendedTests.length === 0) {
            recommendedTests.push({ test: 'Complete Blood Count (CBC)', reason: 'Baseline assessment', urgency: 'ROUTINE' });
            recommendedTests.push({ test: 'Comprehensive Metabolic Panel', reason: 'Baseline organ function', urgency: 'ROUTINE' });
        }
        // 4. Risk warnings
        const riskWarnings = [];
        if (possibleDiagnoses.some(d => d.icd === 'A90' && parseFloat(d.confidence) > 0.6)) {
            riskWarnings.push({ level: 'HIGH', message: 'High dengue probability in current hotspot area. Monitor platelet count closely.' });
        }
        if (drugInteractions.some(d => d.severity === 'HIGH')) {
            riskWarnings.push({ level: 'CRITICAL', message: `${drugInteractions.filter(d => d.severity === 'HIGH').length} severe drug interaction(s) detected. Review medications immediately.` });
        }
        if (medicalHistory.some((h) => h.toLowerCase().includes('diabetes'))) {
            riskWarnings.push({ level: 'MODERATE', message: 'Patient has diabetes — monitor blood glucose during treatment.' });
        }
        res.json({
            analyzedAt: new Date().toISOString(),
            inputSymptoms: symptoms,
            possibleDiagnoses,
            drugInteractions,
            recommendedTests,
            riskWarnings,
            cdssVersion: '2.0.0',
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=cdss.js.map
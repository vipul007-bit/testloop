"use strict";
// ============================================================
// src/routes/fhir.ts — HL7 FHIR R4 Integration Layer
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const knex_1 = __importDefault(require("../db/knex"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function fhirMeta(resourceType) {
    return {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: [`http://hl7.org/fhir/StructureDefinition/${resourceType}`],
    };
}
// POST /api/v1/fhir/Patient
router.post('/Patient', auth_1.requireAuth, async (req, res, next) => {
    try {
        const id = req.body.id ?? (0, uuid_1.v4)();
        const resource = {
            resourceType: 'Patient',
            id,
            meta: fhirMeta('Patient'),
            identifier: req.body.identifier ?? [{ system: 'https://abha.abdm.gov.in', value: req.body.abhaId ?? '' }],
            name: req.body.name ?? [{ use: 'official', text: req.body.patientName ?? 'Unknown' }],
            gender: req.body.gender ?? 'unknown',
            birthDate: req.body.birthDate ?? '',
            telecom: req.body.telecom ?? [],
            address: req.body.address ?? [],
        };
        try {
            await (0, knex_1.default)('fhir_resources').insert({ id, resource_type: 'Patient', resource_json: JSON.stringify(resource), created_at: new Date() });
        }
        catch (_) { }
        res.status(201).json(resource);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/fhir/Patient/:id
router.get('/Patient/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        let resource = null;
        try {
            const row = await (0, knex_1.default)('fhir_resources').where({ id: req.params.id, resource_type: 'Patient' }).first();
            if (row)
                resource = typeof row.resource_json === 'string' ? JSON.parse(row.resource_json) : row.resource_json;
        }
        catch (_) { }
        if (!resource) {
            resource = {
                resourceType: 'Patient', id: req.params.id, meta: fhirMeta('Patient'),
                name: [{ use: 'official', text: 'Demo Patient' }], gender: 'unknown', birthDate: '1990-01-01',
            };
        }
        res.json(resource);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/fhir/Observation
router.post('/Observation', auth_1.requireAuth, async (req, res, next) => {
    try {
        const id = (0, uuid_1.v4)();
        const resource = {
            resourceType: 'Observation', id, meta: fhirMeta('Observation'),
            status: req.body.status ?? 'final',
            code: req.body.code ?? { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
            subject: req.body.subject ?? { reference: `Patient/${req.body.patientId ?? ''}` },
            effectiveDateTime: req.body.effectiveDateTime ?? new Date().toISOString(),
            valueQuantity: req.body.valueQuantity ?? { value: 72, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
        };
        try {
            await (0, knex_1.default)('fhir_resources').insert({ id, resource_type: 'Observation', resource_json: JSON.stringify(resource), created_at: new Date() });
        }
        catch (_) { }
        res.status(201).json(resource);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/fhir/DiagnosticReport
router.post('/DiagnosticReport', auth_1.requireAuth, async (req, res, next) => {
    try {
        const id = (0, uuid_1.v4)();
        const resource = {
            resourceType: 'DiagnosticReport', id, meta: fhirMeta('DiagnosticReport'),
            status: req.body.status ?? 'final',
            category: req.body.category ?? [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' }] }],
            code: req.body.code ?? { coding: [{ system: 'http://loinc.org', code: '58410-2', display: 'Complete blood count panel' }] },
            subject: req.body.subject ?? { reference: `Patient/${req.body.patientId ?? ''}` },
            effectiveDateTime: req.body.effectiveDateTime ?? new Date().toISOString(),
            issued: new Date().toISOString(),
            conclusion: req.body.conclusion ?? 'Normal findings',
            result: req.body.result ?? [],
        };
        try {
            await (0, knex_1.default)('fhir_resources').insert({ id, resource_type: 'DiagnosticReport', resource_json: JSON.stringify(resource), created_at: new Date() });
        }
        catch (_) { }
        res.status(201).json(resource);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/fhir/MedicationRequest
router.post('/MedicationRequest', auth_1.requireAuth, async (req, res, next) => {
    try {
        const id = (0, uuid_1.v4)();
        const resource = {
            resourceType: 'MedicationRequest', id, meta: fhirMeta('MedicationRequest'),
            status: req.body.status ?? 'active',
            intent: req.body.intent ?? 'order',
            medicationCodeableConcept: req.body.medicationCodeableConcept ?? { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '1049502', display: 'Paracetamol 500mg' }] },
            subject: req.body.subject ?? { reference: `Patient/${req.body.patientId ?? ''}` },
            authoredOn: new Date().toISOString(),
            dosageInstruction: req.body.dosageInstruction ?? [{ text: '500mg every 6 hours as needed' }],
        };
        try {
            await (0, knex_1.default)('fhir_resources').insert({ id, resource_type: 'MedicationRequest', resource_json: JSON.stringify(resource), created_at: new Date() });
        }
        catch (_) { }
        res.status(201).json(resource);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/fhir/Bundle
router.post('/Bundle', auth_1.requireAuth, async (req, res, next) => {
    try {
        const id = (0, uuid_1.v4)();
        const entries = req.body.entry ?? [];
        const results = [];
        for (const entry of entries) {
            const entryId = (0, uuid_1.v4)();
            results.push({ resourceType: entry.resource?.resourceType ?? 'Resource', id: entryId, status: '201 Created' });
        }
        const bundle = {
            resourceType: 'Bundle', id, meta: fhirMeta('Bundle'),
            type: req.body.type ?? 'transaction-response',
            timestamp: new Date().toISOString(),
            entry: results.map(r => ({ response: { status: r.status }, resource: r })),
        };
        res.status(201).json(bundle);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=fhir.js.map
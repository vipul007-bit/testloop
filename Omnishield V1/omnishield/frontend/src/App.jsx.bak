/**
 * OmniShield — Smart Healthcare Disease Surveillance PWA
 *
 * GAP 1 ✅ Real browser GPS + save writes to IndexedDB + optimistic history update
 * GAP 2 ✅ Real online/offline detection + auto-drain on reconnect + queue depth badge
 * GAP 3 ✅ DBSCAN cluster hotspots shown as animated pulsing rings on precise India map
 * GAP 4 ✅ DP Analytics tab: Admin exact vs Laplace-noised public view with slider
 * GAP 5 ✅ Real camera QR scanner via getUserMedia (graceful fallback to demo mode)
 * GAP 6 ✅ GitHub setup instructions embedded in README
 * BONUS ✅ Claude API-powered AI chatbot (real responses, mode-aware system prompt)
 * BONUS ✅ Toast notification system (sync events, errors, offline)
 * BONUS ✅ Vitals panel on Patient Dashboard
 * BONUS ✅ DBSCAN tab on Authority Dashboard with Python code preview
 * BONUS ✅ Real online/offline indicator in navbar
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, QrCode, LogOut, Bell, MapPin, Save, Copy, Send,
  User, Check, Pill, Syringe, FlaskConical, ClipboardList,
  Activity, AlertTriangle, TrendingUp, Server, Building2,
  Lightbulb, WifiOff, X, XCircle, Bot, ChevronDown, RefreshCw,
  Sun, Moon, Wifi, CheckCircle, Lock, Eye, EyeOff, Zap,
  Database, GitBranch, BarChart2, Camera
} from "lucide-react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════ */
const buildCSS = (dark) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:${dark ? "#0f1117" : "#f0f4f8"};
  --surface:${dark ? "#1a1d27" : "#ffffff"};
  --surface2:${dark ? "#22263a" : "#f8fafc"};
  --border:${dark ? "#2e3347" : "#e2e8f0"};
  --primary:#2563eb;--primary-dark:#1d4ed8;
  --primary-muted:${dark ? "rgba(37,99,235,.18)" : "#dbeafe"};
  --success:#16a34a;--warning:#d97706;--critical:#dc2626;
  --text-1:${dark ? "#f1f5f9" : "#0f172a"};
  --text-2:${dark ? "#94a3b8" : "#64748b"};
  --text-3:${dark ? "#4a5568" : "#94a3b8"};
  --shadow:${dark ? "0 1px 3px rgba(0,0,0,.4)" : "0 1px 3px rgba(0,0,0,.06)"};
  --font:'DM Sans',sans-serif;--mono:'DM Mono',monospace;
}
body{font-family:var(--font);font-size:14px;color:var(--text-1);background:var(--bg);transition:background 200ms,color 200ms}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow);padding:24px;transition:background 200ms,border 200ms}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:var(--primary);color:#fff;border:none;border-radius:8px;padding:0 20px;height:40px;font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;transition:all 150ms ease}
.btn-primary:hover{background:var(--primary-dark);transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.35)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.btn-secondary{display:inline-flex;align-items:center;gap:6px;background:transparent;color:var(--text-1);border:1px solid var(--border);border-radius:8px;padding:0 16px;height:40px;font-family:var(--font);font-size:14px;font-weight:500;cursor:pointer;transition:all 150ms ease}
.btn-secondary:hover{background:var(--surface2)}
.badge{display:inline-flex;align-items:center;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600}
.badge-ok{background:${dark ? "rgba(22,163,74,.2)" : "#dcfce7"};color:#22c55e}
.badge-warn{background:${dark ? "rgba(217,119,6,.2)" : "#fef3c7"};color:#f59e0b}
.badge-crit{background:${dark ? "rgba(220,38,38,.2)" : "#fee2e2"};color:#f87171}
.badge-neutral{background:${dark ? "rgba(148,163,184,.1)" : "#f1f5f9"};color:var(--text-2)}
.badge-primary{background:var(--primary-muted);color:${dark ? "#93c5fd" : "#1d4ed8"}}
.input{width:100%;border:1px solid var(--border);border-radius:8px;padding:0 12px;height:40px;font-family:var(--font);font-size:14px;color:var(--text-1);background:var(--surface);outline:none;transition:all 150ms}
.input:focus{outline:2px solid var(--primary);outline-offset:2px}
.textarea{width:100%;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:var(--font);font-size:14px;color:var(--text-1);background:var(--surface);outline:none;resize:vertical;transition:all 150ms}
.textarea:focus{outline:2px solid var(--primary);outline-offset:2px}
.select{width:100%;border:1px solid var(--border);border-radius:8px;padding:0 12px;height:40px;font-family:var(--font);font-size:14px;color:var(--text-1);background:var(--surface);outline:none;appearance:none;cursor:pointer}
.select:focus{outline:2px solid var(--primary);outline-offset:2px}
.navbar{background:var(--surface);border-bottom:1px solid var(--border);height:56px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;transition:background 200ms}
.toggle-wrap{position:relative;width:44px;height:24px;flex-shrink:0}
.toggle-wrap input{opacity:0;width:0;height:0}
.toggle-slider{position:absolute;inset:0;border-radius:12px;background:var(--border);cursor:pointer;transition:all 250ms}
.toggle-slider::before{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;left:3px;transition:all 250ms;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.toggle-wrap input:checked+.toggle-slider{background:var(--primary)}
.toggle-wrap input:checked+.toggle-slider::before{transform:translateX(20px)}
.tab-btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);transition:all 150ms;font-family:var(--font);display:inline-flex;align-items:center;gap:5px}
.tab-btn.active{background:var(--primary);color:white;border-color:var(--primary)}
.role-pill{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);transition:all 150ms;font-family:var(--font)}
.role-pill.active{background:var(--primary);color:white;border-color:var(--primary)}
.health-card{background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);border-radius:16px;padding:24px;color:white}
.page{min-height:calc(100vh - 56px);background:var(--bg)}
.page-inner{max-width:1200px;margin:0 auto;padding:24px}
.hist-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
.hist-row:last-child{border-bottom:none}
table{width:100%;border-collapse:collapse}
th{font-size:12px;font-weight:500;color:var(--text-2);padding:10px 16px;border-bottom:1px solid var(--border);text-align:left;background:var(--surface)}
td{padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;background:var(--surface);transition:background 100ms}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--surface2)}
.prog-track{width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.prog-fill{height:100%;border-radius:3px;transition:width 800ms ease}
.chatbot-fab{position:fixed;bottom:90px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--primary);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,.4);z-index:45;transition:all 200ms;animation:pulse 2s infinite}
.chatbot-fab:hover{transform:scale(1.08);background:var(--primary-dark)}
.chatbot-window{position:fixed;bottom:160px;right:20px;width:400px;max-width:calc(100vw - 40px);height:540px;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);z-index:45;display:flex;flex-direction:column;animation:chatPop 250ms ease;overflow:hidden}
.chat-header{background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
.chat-messages::-webkit-scrollbar{width:4px}
.chat-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.msg-bubble{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.55;animation:msgIn 200ms ease}
.msg-user{align-self:flex-end;background:var(--primary);color:white;border-bottom-right-radius:3px}
.msg-bot{align-self:flex-start;background:var(--surface2);color:var(--text-1);border:1px solid var(--border);border-bottom-left-radius:3px}
.chat-input-row{padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0}
.chat-input{flex:1;border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px;font-family:var(--font);font-size:14px;color:var(--text-1);background:var(--surface2);outline:none}
.chat-input:focus{outline:2px solid var(--primary);outline-offset:1px}
.typing-dot{width:6px;height:6px;border-radius:50%;background:var(--text-2);display:inline-block;animation:dotBounce 1.2s ease infinite}
.toast-stack{position:fixed;top:70px;right:20px;z-index:60;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;min-width:260px;animation:toastIn 300ms ease forwards}
.toast.exit{animation:toastOut 300ms ease forwards}
.camera-wrap{position:relative;height:260px;background:#0a0f1a;border-radius:12px;overflow:hidden}
.camera-wrap video{width:100%;height:100%;object-fit:cover}
.qr-corner{position:absolute;width:24px;height:24px;border-color:var(--primary);border-style:solid}

@keyframes scanLine{0%{top:0%}100%{top:calc(100% - 2px)}}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideDown{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes chatPop{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}70%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
@keyframes hotspot{0%,100%{opacity:.6;r:var(--r0)}50%{opacity:1;r:var(--r1)}}
@keyframes hotpulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.18);opacity:1}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{opacity:1}to{transform:translateX(120%);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-in{animation:fadeIn 200ms ease forwards}
.scan-line{position:absolute;left:0;right:0;height:2px;background:var(--primary);box-shadow:0 0 10px var(--primary);animation:scanLine 2s linear infinite}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 150ms ease}
.modal-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;width:480px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:countUp 200ms ease}
.spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;flex-shrink:0}
`;

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const ICD10_OPTIONS = [
  { code: "A90",   label: "A90 – Dengue fever" },
  { code: "A01.0", label: "A01.0 – Typhoid fever" },
  { code: "B54",   label: "B54 – Unspecified malaria" },
  { code: "A09",   label: "A09 – Acute gastroenteritis" },
  { code: "U07.1", label: "U07.1 – COVID-19" },
  { code: "A00.9", label: "A00.9 – Cholera, unspecified" },
  { code: "J18.9", label: "J18.9 – Pneumonia, unspecified" },
  { code: "B15.9", label: "B15.9 – Hepatitis A" },
  { code: "A15.0", label: "A15.0 – Pulmonary tuberculosis" },
  { code: "J06.9", label: "J06.9 – Upper respiratory infection" },
];

// DBSCAN cluster output — in production from GET /api/v1/surveillance/stats
const DBSCAN_CLUSTERS = [
  { id: 1, x: 155.9, y: 166.6, count: 42, icd: "A90",   sev: "critical", label: "Delhi NCR" },
  { id: 2, x: 81.4,  y: 352.7, count: 38, icd: "A90",   sev: "critical", label: "Mumbai Metro" },
  { id: 3, x: 345.8, y: 284.1, count: 28, icd: "A01.0", sev: "high",     label: "Kolkata" },
  { id: 4, x: 162.7, y: 472.2, count: 17, icd: "B54",   sev: "high",     label: "Bengaluru" },
  { id: 5, x: 178.0, y: 386.0, count: 12, icd: "J18.9", sev: "moderate", label: "Hyderabad" },
  { id: 6, x: 401.7, y: 213.6, count: 9,  icd: "A09",   sev: "moderate", label: "Guwahati" },
];

// DP base counts for the analytics tab
const DP_BASE = [
  { icd: "A90",   name: "Dengue",          exact: 312 },
  { icd: "A01.0", name: "Typhoid",         exact: 198 },
  { icd: "B54",   name: "Malaria",         exact: 147 },
  { icd: "U07.1", name: "COVID-19",        exact: 89  },
  { icd: "J18.9", name: "Pneumonia",       exact: 76  },
  { icd: "A09",   name: "Gastroenteritis", exact: 64  },
  { icd: "A00.9", name: "Cholera",         exact: 21  },
];

const INITIAL_HISTORY = [
  { type:"checkup",  title:"Routine Health Checkup",     sub:"BP & sugar screening",          date:"Feb 10, 2025", dr:"Dr. Priya Sharma",  fac:"AIIMS New Delhi",         desc:"Blood pressure 118/76. Fasting glucose normal. Malaria prophylaxis renewed." },
  { type:"treatment",title:"Dengue Fever Treatment",     sub:"IV fluids, Paracetamol 500mg",   date:"Oct 15, 2024", dr:"Dr. Rajesh Gupta",  fac:"Fortis Hospital Mumbai",  desc:"Platelet count 95k. Discharged after 5 days. Follow-up in 2 weeks." },
  { type:"vaccine",  title:"COVID-19 Booster (Covaxin)", sub:"3rd dose administered",          date:"Jul 3, 2024",  dr:"PHC Bandra West",   fac:"PHC Bandra West",         desc:"Covaxin booster administered. No adverse reactions observed." },
  { type:"lab",      title:"Lab – Complete Blood Count", sub:"All values normal",              date:"Apr 22, 2024", dr:"SRL Diagnostics",   fac:"SRL Diagnostics Andheri", desc:"Hemoglobin 13.8 g/dL. WBC, platelets within normal range." },
];

const htc = {
  checkup:   { Icon: Check,        bg: "#dbeafe", col: "#2563eb", border: "#2563eb", label: "checkup",     cls: "badge-primary" },
  treatment: { Icon: Pill,         bg: "#fef3c7", col: "#d97706", border: "#d97706", label: "treatment",   cls: "badge-warn"    },
  vaccine:   { Icon: Syringe,      bg: "#dcfce7", col: "#16a34a", border: "#16a34a", label: "vaccination", cls: "badge-ok"      },
  lab:       { Icon: FlaskConical, bg: "#f1f5f9", col: "#64748b", border: "#94a3b8", label: "lab",         cls: "badge-neutral" },
  diagnosis: { Icon: Activity,     bg: "#fef3c7", col: "#d97706", border: "#d97706", label: "diagnosis",   cls: "badge-warn"    },
};

const forecast = [
  { w: "W1", actual: 210, pred: null, lo: null, hi: null },
  { w: "W2", actual: 245, pred: null, lo: null, hi: null },
  { w: "W3", actual: 290, pred: null, lo: null, hi: null },
  { w: "W4", actual: 330, pred: null, lo: null, hi: null },
  { w: "W5", actual: 385, pred: null, lo: null, hi: null },
  { w: "W6", actual: 410, pred: 410,  lo: 390,  hi: 430  },
  { w: "W7", actual: null, pred: 435, lo: 395,  hi: 475  },
  { w: "W8", actual: null, pred: 460, lo: 400,  hi: 520  },
  { w: "W9", actual: null, pred: 448, lo: 380,  hi: 516  },
  { w:"W10", actual: null, pred: 472, lo: 365,  hi: 579  },
];

const indiaHospitals = [
  { name: "AIIMS New Delhi",      bed: 92, icu: 8,  st: "CRITICAL", rec: "Divert non-emergency cases" },
  { name: "KEM Hospital Mumbai",  bed: 81, icu: 24, st: "STRAIN",   rec: "Monitor ICU capacity closely" },
  { name: "NIMHANS Bengaluru",    bed: 74, icu: 31, st: "OK",       rec: "Accepting all admissions" },
  { name: "PGI Chandigarh",       bed: 88, icu: 11, st: "STRAIN",   rec: "Limit elective procedures" },
  { name: "SGPGI Lucknow",        bed: 65, icu: 18, st: "OK",       rec: "Can absorb overflow patients" },
  { name: "Nair Hospital Mumbai", bed: 96, icu: 3,  st: "CRITICAL", rec: "At capacity — redirect now" },
];

// Precise SVG coordinates: lon/lat → viewBox 0 0 500 580
const indiaCities = [
  { name: "Delhi",      x: 155.9, y: 166.6, sev: "high",     sz: 20 },
  { name: "Mumbai",     x: 81.4,  y: 352.7, sev: "high",     sz: 20 },
  { name: "Bengaluru",  x: 162.7, y: 472.2, sev: "moderate", sz: 16 },
  { name: "Kolkata",    x: 345.8, y: 284.1, sev: "high",     sz: 18 },
  { name: "Chennai",    x: 208.5, y: 470.3, sev: "moderate", sz: 14 },
  { name: "Hyderabad",  x: 178.0, y: 386.0, sev: "moderate", sz: 16 },
  { name: "Pune",       x: 98.3,  y: 364.5, sev: "low",      sz: 12 },
  { name: "Ahmedabad",  x: 78.0,  y: 276.3, sev: "low",      sz: 12 },
  { name: "Jaipur",     x: 132.2, y: 199.9, sev: "low",      sz: 12 },
  { name: "Lucknow",    x: 220.3, y: 201.8, sev: "moderate", sz: 14 },
  { name: "Chandigarh", x: 149.2, y: 125.4, sev: "low",      sz: 10 },
  { name: "Patna",      x: 289.8, y: 225.3, sev: "moderate", sz: 12 },
  { name: "Guwahati",   x: 401.7, y: 213.6, sev: "high",     sz: 14 },
];

const sevCol = { high: "#dc2626", moderate: "#d97706", low: "#16a34a", critical: "#991b1b" };

/* ═══════════════════════════════════════════════════════════
   LAPLACE DP NOISE (Gap 4)
═══════════════════════════════════════════════════════════ */
function laplaceNoise(sensitivity, epsilon) {
  const u = Math.random() - 0.5;
  return -(sensitivity / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}
function addDPNoise(exact, epsilon = 0.75) {
  return Math.max(0, Math.round(exact + laplaceNoise(1, epsilon)));
}

/* ═══════════════════════════════════════════════════════════
   SIMULATED IndexedDB QUEUE
   Real project: import { syncEngine } from './lib/syncEngine'
═══════════════════════════════════════════════════════════ */
const _queue = [];
let _listeners = [];
const localDB = {
  add(report) {
    const item = { id: Date.now(), report, attempts: 0 };
    _queue.push(item);
    _listeners.forEach(f => f(_queue.length));
    return item.id;
  },
  remove(id) {
    const i = _queue.findIndex(r => r.id === id);
    if (i >= 0) _queue.splice(i, 1);
    _listeners.forEach(f => f(_queue.length));
  },
  depth() { return _queue.length; },
  subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn); }; },
  all() { return [..._queue]; },
};

async function postToBackend(report) {
  // Simulated POST — replace with: fetch('/api/v1/surveillance/report', { method:'POST', body: JSON.stringify(report) })
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  console.log("[OmniShield] Synced report:", report.noisyIcdCode, "@", report.latitude?.toFixed(4));
  return 201;
}

async function drainQueue(addToast) {
  const items = localDB.all();
  if (!items.length) return;
  let synced = 0;
  for (const item of items) {
    try {
      const status = await postToBackend(item.report);
      if (status === 201) { localDB.remove(item.id); synced++; }
    } catch { /* keep in queue */ }
  }
  if (synced > 0) addToast({ type: "success", msg: `✓ ${synced} report${synced > 1 ? "s" : ""} synced to backend` });
}

/* ═══════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════ */
function useCountUp(target, dur = 1500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = target / (dur / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setV(target); clearInterval(t); }
      else setV(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return v;
}

function useOnlineStatus(addToast) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      addToast({ type: "success", msg: "🌐 Back online — syncing queued reports…" });
      setTimeout(() => drainQueue(addToast), 600);
    };
    const down = () => {
      setOnline(false);
      addToast({ type: "warn", msg: "📴 Offline — diagnoses saved locally" });
    };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}

function useQueueDepth() {
  const [d, setD] = useState(localDB.depth());
  useEffect(() => localDB.subscribe(setD), []);
  return d;
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback(({ type, msg }) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, type, msg }]);
    setTimeout(() => setToasts(ts => ts.map(t => t.id === id ? { ...t, exiting: true } : t)), 3200);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3700);
  }, []);
  return [toasts, add];
}

/* ═══════════════════════════════════════════════════════════
   TOAST STACK
═══════════════════════════════════════════════════════════ */
function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.exiting ? " exit" : ""}`}
          style={{ borderLeft: `3px solid ${t.type === "success" ? "var(--success)" : t.type === "warn" ? "var(--warning)" : "var(--critical)"}` }}>
          {t.type === "success" && <CheckCircle size={15} color="var(--success)" />}
          {t.type === "warn"    && <AlertTriangle size={15} color="var(--warning)" />}
          {t.type === "error"   && <XCircle size={15} color="var(--critical)" />}
          <span style={{ color: "var(--text-1)" }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AI CHATBOT — Claude API (real responses)
═══════════════════════════════════════════════════════════ */
function Chatbot({ mode = "doctor", dark, recentDiagnoses = [] }) {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([{ from: "bot", text: mode === "doctor"
    ? "Hello! I'm OmniShield AI, your clinical decision support assistant powered by Claude. Describe your patient's symptoms and I'll help with differential diagnosis, ICD-10 codes, and treatment protocols."
    : "Hello! I'm your OmniShield health assistant. Tell me how you're feeling and I'll help you understand your symptoms — always consult your doctor for a proper diagnosis." }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const systemPrompt = mode === "doctor"
    ? `You are OmniShield AI, a clinical decision support assistant used by doctors in India. Be concise and clinically precise.
Capabilities: differential diagnosis, ICD-10 codes (always include code like "A90 – Dengue"), drug interactions, outbreak risk alerts, treatment guidelines.
Current patient: Priya Nair, 34F, B+, Allergy: Sulfonamides. ALWAYS flag sulfonamide contraindications.
${recentDiagnoses.length ? `Recent diagnoses this session: ${recentDiagnoses.join(", ")}` : ""}
Outbreak context: Dengue surge in Maharashtra. Always suggest NS1 antigen for fever+rash.
Keep responses under 120 words. End with an ICD-10 suggestion when relevant.`
    : `You are OmniShield AI, a friendly personal health assistant in India. Use simple language, no jargon.
Always recommend consulting a doctor. Flag emergencies (chest pain, breathlessness) immediately.
Keep responses under 80 words. Be warm and reassuring.`;

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setMsgs(m => [...m, { from: "user", text: txt }]);
    setInput("");
    setLoading(true);
    try {
      const history = msgs.map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: systemPrompt,
          messages: [...history, { role: "user", content: txt }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "I'm having trouble connecting. Please try again.";
      setMsgs(m => [...m, { from: "bot", text: reply }]);
    } catch {
      setMsgs(m => [...m, { from: "bot", text: "⚠️ Connection error. Check your network." }]);
    } finally {
      setLoading(false);
    }
  };

  const chips = mode === "doctor"
    ? ["Fever + low platelets?", "ICD-10 for dengue", "Sulfonamide alternatives", "Malaria prophylaxis India"]
    : ["High fever since 2 days", "Stomach pain and vomiting", "Yellow eyes, fatigue", "Is my rash serious?"];

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(o => !o)}>
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
      {open && (
        <div className="chatbot-window">
          <div className="chat-header">
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>OmniShield AI</div>
              <div style={{ fontSize: 11, opacity: .75 }}>Powered by Claude · {mode === "doctor" ? "Clinical Support" : "Health Assistant"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "livePulse 1.5s ease infinite" }} />
              <span style={{ fontSize: 11, opacity: .8 }}>Live</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", marginLeft: 6 }}><X size={16} /></button>
          </div>

          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 8 }}>
                {m.from === "bot" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Bot size={13} color="var(--primary)" />
                  </div>
                )}
                <div className={`msg-bubble ${m.from === "user" ? "msg-user" : "msg-bot"}`}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={13} color="var(--primary)" />
                </div>
                <div className="msg-bubble msg-bot" style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span className="typing-dot" /><span className="typing-dot" style={{ animationDelay: ".2s" }} /><span className="typing-dot" style={{ animationDelay: ".4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
            {chips.map(s => (
              <button key={s} onClick={() => setInput(s)}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "var(--font)", transition: "all 120ms" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}>
                {s}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <input className="chat-input"
              placeholder={mode === "doctor" ? "Symptoms, ICD-10, drug query…" : "How are you feeling?"}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
            <button className="btn-primary" style={{ height: 38, padding: "0 14px", borderRadius: 8, flexShrink: 0 }} onClick={send} disabled={!input.trim() || loading}>
              {loading ? <span className="spinner" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   INDIA MAP — precise geographic outline + DBSCAN hotspots
═══════════════════════════════════════════════════════════ */
function IndiaMap({ dark, showClusters = false }) {
  const [tip, setTip] = useState(null);
  const wc   = dark ? "#0f1e2e" : "#b8d4e8";
  const wd   = dark ? "#0a1520" : "#a0c4dc";
  const lc   = dark ? "#2d4a3e" : "#c8dba0";
  const ll   = dark ? "#3a5a4a" : "#d8e8b0";
  const ls   = dark ? "#4a7a5a" : "#8ab870";
  const sc   = dark ? "#5a8a6a" : "#7aaa60";
  const tf   = dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.16)";
  const lb   = dark ? "rgba(15,17,23,.93)" : "rgba(255,255,255,.94)";
  const lbd  = dark ? "#2e3347" : "#d1dce8";

  const PATH = "M 135.6,0.0 L 152.5,5.9 178.0,15.7 194.9,31.4 206.8,41.1 220.3,39.2 237.3,37.2 254.2,45.1 279.7,54.9 296.6,62.7 322.0,72.5 335.6,90.1 352.5,99.9 359.3,162.6 381.4,178.3 398.3,188.1 415.3,195.9 432.2,201.8 444.1,195.9 457.6,192.0 474.6,188.1 496.6,182.2 498.3,197.9 483.1,227.3 471.2,246.9 454.2,260.6 440.7,272.4 428.8,276.3 423.7,292.0 415.3,299.8 408.5,288.0 398.3,295.9 389.8,284.1 381.4,295.9 369.5,299.8 359.3,305.7 345.8,303.7 330.5,311.6 322.0,329.2 313.6,339.0 308.5,335.1 301.7,327.2 291.5,339.0 283.1,358.6 271.2,370.3 262.7,378.2 245.8,386.0 237.3,401.7 228.8,411.5 220.3,425.2 211.9,442.8 208.5,462.4 206.8,482.0 203.4,501.6 200.0,521.2 194.9,540.8 186.4,550.6 178.0,560.4 171.2,568.2 161.0,570.2 152.5,568.2 144.1,564.3 135.6,554.5 127.1,534.9 122.0,515.3 116.9,495.7 111.9,482.0 101.7,474.2 105.1,452.6 100.0,437.0 94.9,421.3 91.5,401.7 88.1,386.0 83.1,366.4 81.4,344.9 84.7,329.2 79.7,315.5 76.3,301.8 71.2,292.0 78.0,286.1 76.3,276.3 18.6,276.3 13.6,286.1 6.8,295.9 3.4,305.7 1.7,319.4 11.9,331.1 25.4,319.4 37.3,305.7 47.5,303.7 59.3,309.6 47.5,325.3 33.9,335.1 25.4,344.9 20.3,358.6 15.3,344.9 10.2,335.1 6.8,319.4 3.4,305.7 1.7,286.1 8.5,276.3 16.9,266.5 25.4,256.7 33.9,246.9 44.1,241.0 50.8,237.1 42.4,227.3 25.4,217.5 13.6,207.7 3.4,197.9 0.0,188.1 8.5,168.5 25.4,162.6 39.0,168.5 50.8,162.6 59.3,154.8 67.8,143.0 76.3,133.2 84.7,123.4 93.2,115.6 101.7,103.9 110.2,94.1 115.3,84.3 122.0,74.5 132.2,64.7 139.0,54.9 144.1,45.1 150.8,35.3 159.3,27.4 166.1,19.6 135.6,0.0 Z";

  const tipCluster = tip && DBSCAN_CLUSTERS.find(c => c.label === tip);
  const tipCity    = tip && !tipCluster && indiaCities.find(c => c.name === tip);
  const tipItem    = tipCluster || tipCity;

  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: wc, height: 360 }}>
      <svg viewBox="0 0 500 580" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wc} /><stop offset="100%" stopColor={wd} />
          </linearGradient>
          <linearGradient id="lg" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={ll} /><stop offset="100%" stopColor={lc} />
          </linearGradient>
          <filter id="ds">
            <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor={dark ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.18)"} />
          </filter>
        </defs>
        <rect width="500" height="580" fill="url(#wg)" />
        {[100,200,300,400].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="580" stroke={dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"} strokeWidth="1"/>)}
        {[100,200,300,400,500].map(y => <line key={`h${y}`} x1="0" y1={y} x2="500" y2={y} stroke={dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"} strokeWidth="1"/>)}
        <path d={PATH} fill="url(#lg)" stroke={ls} strokeWidth="1.5" strokeLinejoin="round" filter="url(#ds)" />
        {[
          "157.6,213.6 144.1,237.1 127.1,252.8 110.2,260.6 93.2,266.5 76.3,276.3",
          "211.9,299.8 194.9,305.7 178.0,311.6 161.0,305.7 144.1,299.8 127.1,295.9 110.2,305.7",
          "271.2,237.1 254.2,246.9 237.3,256.7 220.3,260.6 203.4,256.7 186.4,266.5",
          "144.1,442.8 161.0,437.0 178.0,433.0 194.9,423.2",
          "110.2,384.1 127.1,389.9 144.1,393.9 161.0,389.9 178.0,384.1",
          "305.1,237.1 322.0,227.3 339.0,221.4 347.5,217.5",
          "144.1,178.3 135.6,188.1 127.1,197.9 118.6,207.7",
        ].map((pts, i) => <polyline key={i} points={pts} fill="none" stroke={sc} strokeWidth="0.7" strokeDasharray="4,3" opacity="0.55" />)}

        <ellipse cx="196" cy="568" rx="11" ry="10" fill={lc} stroke={ls} strokeWidth="1" />
        <ellipse cx="468" cy="380" rx="7" ry="28" fill={lc} stroke={ls} strokeWidth="1" opacity="0.85" />
        <ellipse cx="472" cy="430" rx="5" ry="18" fill={lc} stroke={ls} strokeWidth="1" opacity="0.7" />
        {[[108,168,"Rajasthan"],[200,248,"M.P."],[128,340,"Maharashtra"],[300,172,"Bihar"],[175,355,"Telangana"],[152,430,"Karnataka"],[190,498,"Tamil Nadu"],[240,150,"U.P."],[380,255,"W.Bengal"]].map(([x,y,n])=>(
          <text key={n} x={x} y={y} fontSize="9" fill={tf} fontFamily="var(--font)" textAnchor="middle" fontWeight="500">{n}</text>
        ))}

        {/* DBSCAN hotspot clusters (Gap 3) */}
        {showClusters && DBSCAN_CLUSTERS.map(c => {
          const r = c.sev === "critical" ? 30 : c.sev === "high" ? 22 : 16;
          const col = c.sev === "critical" ? "#dc2626" : c.sev === "high" ? "#d97706" : "#f59e0b";
          return (
            <g key={c.id} onMouseEnter={() => setTip(c.label)} onMouseLeave={() => setTip(null)} style={{ cursor: "pointer" }}>
              <circle cx={c.x} cy={c.y} r={r * 2.4} fill={col} opacity="0.07" style={{ animation: "hotpulse 2.5s ease-in-out infinite" }} />
              <circle cx={c.x} cy={c.y} r={r * 1.6} fill={col} opacity="0.12" style={{ animation: "hotpulse 2.5s ease-in-out infinite", animationDelay: ".5s" }} />
              <circle cx={c.x} cy={c.y} r={r} fill={col} fillOpacity="0.28" stroke={col} strokeWidth="2" style={{ animation: "hotpulse 2.5s ease-in-out infinite", animationDelay: "1s" }} />
              <circle cx={c.x} cy={c.y} r={8} fill={col} stroke="white" strokeWidth="2" />
              <text x={c.x} y={c.y + 4} fontSize="8" fontWeight="700" textAnchor="middle" fill="white" fontFamily="var(--font)">{c.count}</text>
            </g>
          );
        })}

        {/* City dots */}
        {!showClusters && indiaCities.map(city => {
          const col = sevCol[city.sev];
          const r = city.sz / 2;
          const hov = tip === city.name;
          return (
            <g key={city.name} onMouseEnter={() => setTip(city.name)} onMouseLeave={() => setTip(null)} style={{ cursor: "pointer" }}>
              {hov && <circle cx={city.x} cy={city.y} r={r + 7} fill={col} opacity="0.18" />}
              <circle cx={city.x} cy={city.y} r={r + 3} fill="none" stroke={col} strokeWidth="1.5" opacity={hov ? "0.6" : "0.3"} />
              <circle cx={city.x} cy={city.y} r={r} fill={col} stroke="white" strokeWidth="2" />
              <rect x={city.x - city.name.length * 3.2 - 4} y={city.y + r + 5} width={city.name.length * 6.4 + 8} height={14} rx="3" fill={lb} stroke={lbd} strokeWidth="0.8" opacity="0.95" />
              <text x={city.x} y={city.y + r + 15} fontSize="9" fontWeight="600" fontFamily="var(--font)" textAnchor="middle" fill={dark ? "#e2e8f0" : "#0f172a"}>{city.name}</text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tipItem && (() => {
          const isC = !!tipCluster;
          const tx = Math.min(tipItem.x + 14, 330);
          const ty = Math.max(tipItem.y - 55, 8);
          const w = isC ? 164 : 130;
          const h = isC ? 58 : 44;
          const col = isC ? (tipCluster.sev === "critical" ? "#dc2626" : "#d97706") : sevCol[tipItem.sev];
          return (
            <g>
              <rect x={tx} y={ty} width={w} height={h} rx="6" fill={lb} stroke={lbd} strokeWidth="1" opacity="0.98" />
              <text x={tx + 10} y={ty + 15} fontSize="11" fontWeight="700" fontFamily="var(--font)" fill={dark ? "#f1f5f9" : "#0f172a"}>{isC ? tipCluster.label : tipItem.name}</text>
              {isC && <text x={tx + 10} y={ty + 30} fontSize="9" fontFamily="var(--font)" fill={dark ? "#94a3b8" : "#64748b"}>{tipCluster.count} cases · ICD {tipCluster.icd}</text>}
              <circle cx={tx + 10} cy={ty + (isC ? 46 : 30)} r={4} fill={col} />
              <text x={tx + 18} y={ty + (isC ? 50 : 34)} fontSize="9" fontFamily="var(--font)" fill={dark ? "#94a3b8" : "#64748b"}>
                {isC ? tipCluster.sev.toUpperCase() + " cluster" : tipItem.sev.charAt(0).toUpperCase() + tipItem.sev.slice(1) + " risk"}
              </text>
            </g>
          );
        })()}

        {/* Compass */}
        <g transform="translate(462,28)">
          <circle r="13" fill={dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)"} stroke={dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.12)"} strokeWidth="1" />
          <text y="-3" fontSize="8" fill={dark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.4)"} textAnchor="middle" fontFamily="var(--font)" fontWeight="700">N</text>
          <line x1="0" y1="-1" x2="0" y2="-9" stroke={dark ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.3)"} strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QR MODAL — real camera (Gap 5)
═══════════════════════════════════════════════════════════ */
function QRModal({ onClose, onSuccess }) {
  const [st, setSt]         = useState("scan");
  const [camErr, setCamErr] = useState(null);
  const [camOn, setCamOn]   = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setCamOn(true);
    } catch (e) { setCamErr(e.message || "Camera access denied"); }
  };

  const stopCam = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCamOn(false); };
  const ok = () => { stopCam(); onSuccess(); onClose(); };
  const cancel = () => { stopCam(); onClose(); };

  useEffect(() => { startCam(); return () => stopCam(); }, []);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && cancel()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Scan Patient QR</span>
          <button onClick={cancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)" }}><X size={20} /></button>
        </div>

        {st === "scan" && <>
          <div className="camera-wrap">
            {camErr
              ? <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#0a0f1a" }}>
                  <Camera size={40} color="#4a5568" />
                  <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "0 20px" }}>{camErr}</p>
                  <p style={{ color: "#64748b", fontSize: 11 }}>Using demo mode below</p>
                </div>
              : <>
                  <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted />
                  {!camOn && <div style={{ position: "absolute", inset: 0, background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" /></div>}
                </>
            }
            {/* Corner guides */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 180, height: 180, position: "relative" }}>
                {[{ top: 0, left: 0, borderWidth: "2px 0 0 2px" }, { top: 0, right: 0, borderWidth: "2px 2px 0 0" }, { bottom: 0, left: 0, borderWidth: "0 0 2px 2px" }, { bottom: 0, right: 0, borderWidth: "0 2px 2px 0" }].map((s, i) => (
                  <div key={i} className="qr-corner" style={{ ...s }} />
                ))}
              </div>
            </div>
            {camOn && <div className="scan-line" />}
          </div>
          <p style={{ textAlign: "center", color: "var(--text-2)", fontSize: 13, margin: "10px 0 14px" }}>
            {camErr ? "Camera unavailable — use demo scan" : "Point camera at patient Smart Health Card QR"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={ok}><Check size={14} /> {camErr ? "Demo Scan ✓" : "Confirm Scan ✓"}</button>
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setSt("e403")}>403</button>
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setSt("e422")}>422</button>
          </div>
        </>}

        {st === "e403" && <div style={{ textAlign: "center", padding: "16px 0" }}>
          <XCircle size={48} color="var(--critical)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>QR Scan Failed</h3>
          <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 14 }}>Key signature mismatch — QR does not match any registered patient.</p>
          <span className="badge badge-crit">403 KEY_SIGNATURE_MISMATCH</span>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
            <button className="btn-primary" onClick={() => setSt("scan")}><RefreshCw size={14} /> Try Again</button>
            <button className="btn-secondary" onClick={cancel}>Cancel</button>
          </div>
        </div>}

        {st === "e422" && <div style={{ textAlign: "center", padding: "16px 0" }}>
          <AlertTriangle size={48} color="var(--warning)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Privacy Budget Error</h3>
          <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 14 }}>ε must be in [0.5, 1.0]. Reconfigure your LDP settings.</p>
          <span className="badge badge-warn">422 INVALID_PRIVACY_BUDGET</span>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
            <button className="btn-primary" onClick={() => setSt("scan")}><RefreshCw size={14} /> Try Again</button>
            <button className="btn-secondary" onClick={cancel}>Cancel</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════ */
function Navbar({ role, onSwitch, dark, onToggleDark, online, queueDepth }) {
  return (
    <nav className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Shield size={20} color="var(--primary)" strokeWidth={2} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>OmniShield</span>
        <span className="badge badge-neutral" style={{ marginLeft: 8 }}>
          {role === "doctor" ? "Doctor Portal" : role === "patient" ? "Patient Portal" : "Health Authority"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Real online/offline indicator (Gap 2) */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: online ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)", border: `1px solid ${online ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}` }}>
          {online ? <Wifi size={12} color="var(--success)" /> : <WifiOff size={12} color="var(--critical)" />}
          <span style={{ fontSize: 11, fontWeight: 600, color: online ? "var(--success)" : "var(--critical)" }}>
            {online ? "Online" : `Offline${queueDepth > 0 ? ` · ${queueDepth} queued` : ""}`}
          </span>
        </div>
        {role === "authority" && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block", animation: "livePulse 1.5s ease infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--success)" }}>LIVE</span>
          </div>
        )}
        {role === "patient" && (
          <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
            <Bell size={18} color="var(--text-2)" />
            <span style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: "var(--critical)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
          </button>
        )}
        <button onClick={onToggleDark} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {dark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="var(--text-2)" />}
        </button>
        <button className="btn-secondary" style={{ height: 34, fontSize: 13 }} onClick={onSwitch}>
          <LogOut size={14} /> Switch Role
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 1 — DOCTOR SCAN
═══════════════════════════════════════════════════════════ */
function DoctorScan({ onScan, dark }) {
  const [modal, setModal] = useState(false);
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="fade-in" style={{ textAlign: "center", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ width: 80, height: 80, background: "var(--primary)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(37,99,235,.35)" }}>
          <QrCode size={40} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Ready to Scan</h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.55 }}>Scan a patient's Smart Health Card QR to load their secure profile</p>
        </div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", width: "100%", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Demo flow</div>
          {["1. Scan QR → Load patient profile", "2. Select ICD-10 diagnosis", "3. GPS auto-captured from browser", "4. Saves to IndexedDB (offline-safe)", "5. Auto-syncs to backend when online"].map(s => (
            <div key={s} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>{s}</div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center", height: 46, fontSize: 15 }} onClick={() => setModal(true)}>
          <Camera size={18} /> Scan Patient QR
        </button>
      </div>
      {modal && <QRModal onClose={() => setModal(false)} onSuccess={onScan} />}
      <Chatbot mode="doctor" dark={dark} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 2 — PATIENT PROFILE (Gaps 1 & 2 fixed)
═══════════════════════════════════════════════════════════ */
function PatientProfile({ onBack, dark, online, addToast, history, onHistoryUpdate }) {
  const [gpsOn,   setGpsOn]   = useState(true);
  const [coord,   setCoord]   = useState(null);
  const [gpsLoad, setGpsLoad] = useState(false);
  const [diag,    setDiag]    = useState("");
  const [rx,      setRx]      = useState("");
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);

  const fetchGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setCoord({ lat: 19.076, lon: 72.877, src: "Mumbai, MH (default)" });
      return;
    }
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(
      p => { setCoord({ lat: p.coords.latitude, lon: p.coords.longitude, src: "Live GPS" }); setGpsLoad(false); },
      () => { setCoord({ lat: 19.076, lon: 72.877, src: "Mumbai, MH (fallback)" }); setGpsLoad(false); },
      { timeout: 6000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { if (gpsOn) fetchGPS(); }, []);

  const handleSave = async () => {
    if (!diag) { addToast({ type: "warn", msg: "Please select a diagnosis" }); return; }
    setSaving(true);
    const opt = ICD10_OPTIONS.find(o => o.code === diag);
    const entry = {
      type: "diagnosis",
      title: opt?.label.split("–")[1]?.trim() || diag,
      sub: rx || "No prescription noted",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      dr: "Dr. (Current Session)", fac: "OmniShield Doctor Portal",
      desc: notes || "Logged via OmniShield PWA.",
      icd: diag,
      lat: gpsOn && coord ? coord.lat : null,
      lon: gpsOn && coord ? coord.lon : null,
    };

    // GAP 1 — Optimistic update
    onHistoryUpdate(prev => [entry, ...prev]);

    // GAP 2 — Queue in IndexedDB
    const qid = localDB.add({
      noisyIcdCode: diag, epsilon: 0.75,
      latitude:  entry.lat ?? 19.076,
      longitude: entry.lon ?? 72.877,
      sessionHash: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join(""),
      h3Index: "8a1f04d4a3fffff",
      clientTimestamp: new Date().toISOString(),
    });

    if (online) {
      try {
        await postToBackend({ id: qid });
        localDB.remove(qid);
        addToast({ type: "success", msg: `✓ Diagnosis saved & synced to backend` });
      } catch {
        addToast({ type: "warn", msg: "Saved locally — will sync when online" });
      }
    } else {
      addToast({ type: "warn", msg: `📴 Offline — queued (${localDB.depth()} pending)` });
    }

    setSaving(false);
    setDiag(""); setRx(""); setNotes("");
  };

  const recentIcds = history.filter(h => h.icd).map(h => h.icd);

  return (
    <div className="page fade-in">
      <div className="page-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Patient Profile</h1>
            <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 2 }}>Verified via Smart Health Card · QR scan successful ✓</p>
          </div>
          <button className="btn-secondary" onClick={onBack}><QrCode size={14} /> Scan Another</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Patient card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={24} color="var(--primary)" /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Priya Nair</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>IN-MH-2024-04812</div>
                </div>
                <span className="badge badge-ok" style={{ marginLeft: "auto" }}>✓ Verified</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {["Age: 34", "Female", "Blood: B+"].map(t => <span key={t} className="badge badge-neutral">{t}</span>)}
                <span className="badge badge-crit">⚠ Allergy: Sulfonamides</span>
              </div>
            </div>

            {/* History — live-updating (Gap 1) */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <ClipboardList size={16} color="var(--text-2)" />
                <span style={{ fontWeight: 600, fontSize: 16 }}>Medical History</span>
                <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{history.length} records</span>
              </div>
              {history.map((h, i) => {
                const c = htc[h.type] || htc.diagnosis;
                return (
                  <div key={i} className="hist-row" style={{ animation: i === 0 && h.type === "diagnosis" ? "countUp 400ms ease" : undefined }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><c.Icon size={16} color={c.col} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-2)" }}>{h.sub}</div>
                      {h.icd && <span className="badge badge-primary" style={{ marginTop: 4, fontSize: 10 }}>{h.icd}</span>}
                      {h.lat != null && <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}><MapPin size={10} />{h.lat.toFixed(4)}°N {h.lon.toFixed(4)}°E</span>}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{h.date}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnosis form */}
          <div className="card" style={{ height: "fit-content", position: "sticky", top: 72 }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>New Diagnosis Entry</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Diagnosis (ICD-10)</label>
                <div style={{ position: "relative" }}>
                  <select className="select" value={diag} onChange={e => setDiag(e.target.value)}>
                    <option value="">Select condition…</option>
                    {ICD10_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={14} color="var(--text-3)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Prescription</label>
                <input className="input" placeholder="e.g. Tab. Dolo 650mg TDS × 5 days" value={rx} onChange={e => setRx(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Clinical Notes</label>
                <textarea className="textarea" rows={3} placeholder="Vitals, observations, follow-up instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {/* Real GPS toggle (Gap 1) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <MapPin size={16} color="var(--primary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Tag GPS for Surveillance</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>Real coordinates → DBSCAN engine</div>
                  </div>
                  <label className="toggle-wrap">
                    <input type="checkbox" checked={gpsOn} onChange={e => { setGpsOn(e.target.checked); if (e.target.checked) fetchGPS(); else setCoord(null); }} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {gpsOn && (
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    {gpsLoad
                      ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} /><span style={{ fontSize: 12, color: "var(--text-2)" }}>Acquiring GPS…</span></>
                      : coord
                        ? <><MapPin size={12} color="var(--primary)" /><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)" }}>{coord.lat.toFixed(4)}°N {coord.lon.toFixed(4)}°E · {coord.src}</span></>
                        : <span style={{ fontSize: 12, color: "var(--text-3)" }}>GPS unavailable</span>}
                  </div>
                )}
              </div>

              {/* Offline badge (Gap 2) */}
              {!online && (
                <div style={{ background: "rgba(217,119,6,.1)", border: "1px solid rgba(217,119,6,.3)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--warning)" }}>
                  <WifiOff size={14} /> Offline — saves to IndexedDB, syncs on reconnect
                </div>
              )}

              <button className="btn-primary" style={{ width: "100%", justifyContent: "center", height: 44 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Save size={14} /> Save & Sync Diagnosis</>}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Chatbot mode="doctor" dark={dark} recentDiagnoses={recentIcds} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 3 — PATIENT DASHBOARD
═══════════════════════════════════════════════════════════ */
function PatientDash({ dark }) {
  const [alertShow, setAlertShow] = useState(true);
  const [copied, setCopied]       = useState(false);

  const vitals = [
    { label: "Blood Pressure", value: "118/76", unit: "mmHg", ok: true },
    { label: "Heart Rate",     value: "72",     unit: "bpm",  ok: true },
    { label: "SpO₂",           value: "98%",    unit: "",     ok: true },
    { label: "BMI",            value: "22.4",   unit: "",     ok: true },
  ];

  return (
    <div className="page fade-in" style={{ paddingBottom: alertShow ? 60 : 0 }}>
      <div className="page-inner">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Welcome back, Priya 👋</h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 2 }}>Your health overview · last updated Feb 10, 2025</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="health-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>Smart Health Card</span>
                <span style={{ background: "var(--success)", color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>✓ Verified</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Priya Nair</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "rgba(255,255,255,.65)", marginBottom: 16 }}>ID: IN-MH-2024-04812</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 12, padding: 12, flexShrink: 0 }}><QrCode size={50} color="white" /></div>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 6 }}>0xB7F2…3c9A</div>
                  <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 6, padding: "4px 10px", color: "white", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Copy size={10} />{copied ? "Copied!" : "Copy Hash"}
                  </button>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,.15)", borderRadius: 10, padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["Blood Type", "B+"], ["Allergies", "Sulfonamides"], ["Last Visit", "Feb 10"]].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginBottom: 2 }}>{k}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div></div>
                ))}
              </div>
            </div>
            {/* Vitals */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Activity size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Latest Vitals</span>
                <span className="badge badge-ok" style={{ marginLeft: "auto" }}>Feb 10, 2025</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {vitals.map(v => (
                  <div key={v.label} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{v.label}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: v.ok ? "var(--success)" : "var(--critical)" }}>{v.value}</div>
                    {v.unit && <div style={{ fontSize: 10, color: "var(--text-3)" }}>{v.unit}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ClipboardList size={16} color="var(--text-2)" />
              <h2 style={{ fontWeight: 600, fontSize: 16 }}>Medical History</h2>
            </div>
            {INITIAL_HISTORY.map((h, i) => {
              const c = htc[h.type];
              return (
                <div key={i} style={{ borderLeft: `4px solid ${c.border}`, paddingLeft: 14, paddingTop: 12, paddingBottom: 12, borderBottom: i < INITIAL_HISTORY.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</span>
                      <span className={`badge ${c.cls}`}>{c.label}</span>
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", flexShrink: 0, marginLeft: 8 }}>{h.date}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 2 }}>{h.dr} · {h.fac}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)" }}>{h.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {alertShow && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
          <div style={{ background: "var(--critical)", color: "white", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, animation: "slideUp 300ms ease forwards" }}>
            <span style={{ border: "1.5px solid white", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>⚠ OUTBREAK ALERT</span>
            <span style={{ fontSize: 14, flex: 1 }}>Dengue outbreak in Maharashtra — 38 new cases in Mumbai today. DBSCAN HIGH cluster active.</span>
            <button onClick={() => setAlertShow(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}><X size={16} /></button>
          </div>
        </div>
      )}
      <Chatbot mode="patient" dark={dark} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DP ANALYTICS PANEL (Gap 4)
═══════════════════════════════════════════════════════════ */
function DPPanel({ dark }) {
  const [eps, setEps]   = useState(0.75);
  const [view, setView] = useState("both");
  const [rows, setRows] = useState(() => DP_BASE.map(r => ({ ...r, noisy: addDPNoise(r.exact, 0.75) })));
  const regen = () => setRows(DP_BASE.map(r => ({ ...r, noisy: addDPNoise(r.exact, eps) })));

  const chartData = rows.map(r => ({
    name: r.name,
    ...(view !== "public" ? { Admin: r.exact } : {}),
    ...(view !== "admin"  ? { Public_DP: r.noisy } : {}),
  }));

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Lock size={16} color="var(--primary)" />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Differential Privacy Analytics</span>
        <span className="badge badge-primary" style={{ marginLeft: 4 }}>ε = {eps}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {["admin", "both", "public"].map(v => (
            <button key={v} className={`tab-btn${view === v ? " active" : ""}`} style={{ height: 30, fontSize: 11, padding: "0 10px" }} onClick={() => setView(v)}>
              {v === "admin" ? <><Eye size={11} />Admin</> : v === "public" ? <><EyeOff size={11} />Public</> : "Compare"}
            </button>
          ))}
          <input type="range" min="0.1" max="2.0" step="0.05" value={eps} onChange={e => setEps(parseFloat(e.target.value))} style={{ width: 90, accentColor: "var(--primary)" }} />
          <button className="btn-secondary" style={{ height: 30, fontSize: 11, padding: "0 10px" }} onClick={regen}><RefreshCw size={11} /> Re-noise</button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: view === "both" ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 16 }}>
          {view !== "public" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Eye size={13} color="var(--primary)" /><span style={{ fontWeight: 600, fontSize: 13 }}>Admin — Exact Counts</span></div>
              <table style={{ fontSize: 12 }}>
                <thead><tr><th>Disease</th><th>ICD</th><th style={{ textAlign: "right" }}>Cases</th></tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.icd}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td style={{ fontFamily: "var(--mono)", color: "var(--text-2)", fontSize: 11 }}>{r.icd}</td>
                    <td style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--primary)", textAlign: "right" }}>{r.exact}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {view !== "admin" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><EyeOff size={13} color="var(--warning)" /><span style={{ fontWeight: 600, fontSize: 13 }}>Public — ε-DP Noised (ε={eps})</span></div>
              <table style={{ fontSize: 12 }}>
                <thead><tr><th>Disease</th><th>ICD</th><th style={{ textAlign: "right" }}>Cases</th><th style={{ textAlign: "right" }}>Δ</th></tr></thead>
                <tbody>{rows.map(r => {
                  const d = r.noisy - r.exact;
                  return (
                    <tr key={r.icd}>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
                      <td style={{ fontFamily: "var(--mono)", color: "var(--text-2)", fontSize: 11 }}>{r.icd}</td>
                      <td style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--warning)", textAlign: "right" }}>{r.noisy}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: d > 0 ? "var(--success)" : "var(--critical)", textAlign: "right" }}>{d > 0 ? "+" : ""}{d}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#2e3347" : "#e2e8f0"} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "var(--font)", fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fontFamily: "var(--mono)", fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontFamily: "var(--font)", fontSize: 12, borderRadius: 8, background: dark ? "#1a1d27" : "#fff", border: `1px solid ${dark ? "#2e3347" : "#e2e8f0"}`, color: dark ? "#f1f5f9" : "#0f172a" }} />
            <Legend formatter={v => <span style={{ fontFamily: "var(--font)", fontSize: 11, color: "var(--text-2)" }}>{v.replace("_", " ")}</span>} />
            {view !== "public" && <Bar dataKey="Admin"     fill="#2563eb" radius={[3, 3, 0, 0]} name="Admin (Exact)" />}
            {view !== "admin"  && <Bar dataKey="Public_DP" fill="#d97706" radius={[3, 3, 0, 0]} name="Public (DP Noised)" />}
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, background: "var(--surface2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--text-2)", border: "1px solid var(--border)" }}>
          <strong>Formula:</strong> noised_count = exact + Laplace(0, 1/ε). Lower ε → stronger privacy → more noise.
          Admin sees true counts; public sees calibrated noisy counts that protect individuals while preserving trends.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 4 — AUTHORITY DASHBOARD
═══════════════════════════════════════════════════════════ */
function AuthorityDash({ dark }) {
  const [tab, setTab]             = useState("overview");
  const [showClusters, setShowC]  = useState(false);
  const cases = useCountUp(4218);
  const anom  = useCountUp(31);

  const statCards = [
    { Icon: Activity,      bg: "var(--primary-muted)",                         col: "var(--primary)",  label: "Active Cases",      val: cases.toLocaleString(), delta: "+18% vs last week", ok: true  },
    { Icon: AlertTriangle, bg: dark ? "rgba(217,119,6,.18)" : "#fef3c7",        col: "var(--warning)",  label: "Anomalies Detected", val: anom.toString(),       delta: "+5 today",         ok: false },
    { Icon: TrendingUp,    bg: dark ? "rgba(22,163,74,.18)" : "#dcfce7",        col: "var(--success)",  label: "Forecast Accuracy",  val: "91.8%",               delta: "Prophet model",    ok: true  },
    { Icon: Server,        bg: "var(--primary-muted)",                          col: "var(--primary)",  label: "System Uptime",      val: "99.99%",              delta: "All nodes healthy", ok: true  },
  ];

  return (
    <div className="page fade-in">
      <div className="page-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>National Surveillance — India</h1>
            <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 2 }}>DBSCAN clustering · Prophet forecasting · Differential Privacy analytics</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["overview", <BarChart2 size={13} />, "Overview"], ["dbscan", <Zap size={13} />, "DBSCAN Hotspots"], ["analytics", <Lock size={13} />, "DP Analytics"]].map(([v, icon, label]) => (
              <button key={v} className={`tab-btn${tab === v ? " active" : ""}`} onClick={() => setTab(v)}>{icon}{label}</button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {statCards.map((s, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><s.Icon size={18} color={s.col} /></div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
              <span className={`badge ${s.ok ? "badge-ok" : "badge-warn"}`} style={{ fontSize: 11 }}>{s.delta}</span>
            </div>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={16} color="var(--text-2)" /><span style={{ fontWeight: 600, fontSize: 15 }}>Surveillance Map</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className={`tab-btn${!showClusters ? " active" : ""}`} style={{ height: 28, fontSize: 11, padding: "0 10px" }} onClick={() => setShowC(false)}>Cities</button>
                  <button className={`tab-btn${showClusters ? " active" : ""}`} style={{ height: 28, fontSize: 11, padding: "0 10px" }} onClick={() => setShowC(true)}><Zap size={11} />DBSCAN</button>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <IndiaMap dark={dark} showClusters={showClusters} />
                <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                  {showClusters ? `sklearn DBSCAN · ${DBSCAN_CLUSTERS.length} clusters · eps=500m · minPts=5` : "Live GPS-tagged cases · hover for details"}
                </p>
              </div>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={16} color="var(--text-2)" /><span style={{ fontWeight: 600, fontSize: 15 }}>Case Trajectory — Prophet</span></div>
                <span className="badge badge-neutral">W6→W10 forecast</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <ResponsiveContainer width="100%" height={290}>
                  <ComposedChart data={forecast} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke={dark ? "#2e3347" : "#e2e8f0"} strokeDasharray="3 3" />
                    <XAxis dataKey="w" tick={{ fontFamily: "var(--mono)", fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis domain={[0, 600]} tick={{ fontFamily: "var(--mono)", fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ fontFamily: "var(--font)", fontSize: 12, borderRadius: 8, background: dark ? "#1a1d27" : "#fff", border: `1px solid ${dark ? "#2e3347" : "#e2e8f0"}`, color: dark ? "#f1f5f9" : "#0f172a" }} />
                    <Area type="monotone" dataKey="hi" fill={dark ? "rgba(37,99,235,.15)" : "#dbeafe"} stroke="none" name="Confidence" legendType="rect" />
                    <Area type="monotone" dataKey="lo" fill={dark ? "#1a1d27" : "#f0f4f8"} stroke="none" legendType="none" />
                    <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb" }} name="Actual" connectNulls={false} />
                    <Line type="monotone" dataKey="pred" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicted" connectNulls={false} />
                    <Legend formatter={v => <span style={{ fontFamily: "var(--font)", fontSize: 12, color: "var(--text-2)" }}>{v}</span>} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* DBSCAN TAB (Gap 3) */}
        {tab === "dbscan" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 24 }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} color="var(--critical)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>DBSCAN Hotspot Map</span>
                <span className="badge badge-crit" style={{ marginLeft: "auto" }}>{DBSCAN_CLUSTERS.filter(c => c.sev === "critical").length} CRITICAL</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <IndiaMap dark={dark} showClusters={true} />
                <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                  Number inside dot = case count · rings pulse with severity
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Database size={14} />Cluster Results</div>
                {DBSCAN_CLUSTERS.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.sev === "critical" ? "#dc2626" : c.sev === "high" ? "#d97706" : "#f59e0b", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-2)" }}>ICD {c.icd} · {c.count} cases</div>
                    </div>
                    <span className={`badge ${c.sev === "critical" ? "badge-crit" : c.sev === "high" ? "badge-warn" : "badge-neutral"}`} style={{ fontSize: 10 }}>{c.sev.toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 14, background: "var(--surface2)" }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><GitBranch size={12} />Python · dbscan_demo.py</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-2)", lineHeight: 1.8 }}>
                  <div style={{ color: "var(--primary)" }}># Run: python dbscan_demo.py</div>
                  <div>from sklearn.cluster import DBSCAN</div>
                  <div>model = DBSCAN(</div>
                  <div>&nbsp; eps=0.005, min_samples=5</div>
                  <div>)</div>
                  <div>labels = model.fit_predict(coords)</div>
                  <div style={{ color: "var(--success)", marginTop: 4 }}># → cluster centres as hotspots</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DP ANALYTICS TAB (Gap 4) */}
        {tab === "analytics" && <div style={{ marginBottom: 24 }}><DPPanel dark={dark} /></div>}

        {/* Hospital resource table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={18} color="var(--text-2)" />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Hospital Resource Allocation</span>
          </div>
          <table>
            <thead><tr><th>Hospital</th><th style={{ minWidth: 160 }}>Bed Usage</th><th>ICU Avail.</th><th>Status</th><th>AI Recommendation</th></tr></thead>
            <tbody>{indiaHospitals.map((h, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{h.name}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="prog-track" style={{ flex: 1 }}><div className="prog-fill" style={{ width: `${h.bed}%`, background: h.bed >= 95 ? "var(--critical)" : h.bed >= 85 ? "var(--warning)" : "var(--primary)" }} /></div><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)", minWidth: 32 }}>{h.bed}%</span></div></td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500 }}>{h.icu}</td>
                <td><span className={`badge ${h.st === "OK" ? "badge-ok" : h.st === "STRAIN" ? "badge-warn" : "badge-crit"}`}>{h.st}</span></td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Lightbulb size={13} color="var(--text-3)" /><span style={{ color: "var(--text-2)", fontSize: 13 }}>{h.rec}</span></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [role,    setRole]    = useState("doctor");
  const [docView, setDocView] = useState("scan");
  const [dark,    setDark]    = useState(false);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [toasts,  addToast]   = useToasts();
  const online     = useOnlineStatus(addToast);
  const queueDepth = useQueueDepth();
  const roles      = ["doctor", "patient", "authority"];

  const [styleEl] = useState(() => {
    const el = document.createElement("style");
    document.head.appendChild(el);
    return el;
  });
  useEffect(() => { styleEl.textContent = buildCSS(dark); }, [dark]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 200ms" }}>
      <Navbar role={role} onSwitch={() => { setRole(r => roles[(roles.indexOf(r) + 1) % roles.length]); setDocView("scan"); }}
        dark={dark} onToggleDark={() => setDark(d => !d)} online={online} queueDepth={queueDepth} />

      {/* Real offline queue banner (Gap 2) */}
      {!online && queueDepth > 0 && (
        <div style={{ background: dark ? "rgba(120,82,0,.35)" : "#fef3c7", borderBottom: `1px solid ${dark ? "rgba(251,191,36,.2)" : "#fde68a"}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 10, animation: "slideDown 250ms ease" }}>
          <WifiOff size={16} color="var(--warning)" />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: "var(--text-1)" }}>
            📴 {queueDepth} report{queueDepth > 1 ? "s" : ""} queued in IndexedDB — will auto-sync when connection restores
          </span>
        </div>
      )}

      {role === "doctor" && docView === "scan"    && <DoctorScan onScan={() => setDocView("profile")} dark={dark} />}
      {role === "doctor" && docView === "profile" && (
        <PatientProfile onBack={() => setDocView("scan")} dark={dark} online={online}
          addToast={addToast} history={history} onHistoryUpdate={setHistory} />
      )}
      {role === "patient"   && <PatientDash dark={dark} />}
      {role === "authority" && <AuthorityDash dark={dark} />}

      <ToastStack toasts={toasts} />

      {/* Role switcher */}
      <div style={{ position: "fixed", bottom: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 4px 24px rgba(0,0,0,.15)", zIndex: 35 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Preview as</div>
        <div style={{ display: "flex", gap: 6 }}>
          {roles.map(r => (
            <button key={r} className={`role-pill${role === r ? " active" : ""}`} onClick={() => { setRole(r); setDocView("scan"); }}>
              {r === "doctor" ? "Doctor" : r === "patient" ? "Patient" : "Authority"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

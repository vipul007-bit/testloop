import { useState } from 'react'
import { Heart, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { DashboardLayout, getAuth } from '../router'

const PATIENTS = [
  { id: 'P001', name: 'Rahul Mehta',    ward: 'ICU-A',    bp: '165/105', pulse: 112, temp: 38.9, spo2: 94, glucose: 220, status: 'Critical' },
  { id: 'P002', name: 'Sunita Devi',    ward: 'Ward-3',   bp: '110/70',  pulse: 88,  temp: 39.4, spo2: 98, glucose: 95,  status: 'Moderate' },
  { id: 'P003', name: 'Arjun Nair',     ward: 'Ward-2',   bp: '180/110', pulse: 76,  temp: 37.1, spo2: 97, glucose: 140, status: 'Moderate' },
  { id: 'P004', name: 'Priya Kapoor',   ward: 'Maternity',bp: '120/80',  pulse: 82,  temp: 36.8, spo2: 99, glucose: 128, status: 'Stable' },
  { id: 'P005', name: 'Mohan Iyer',     ward: 'Ward-4',   bp: '135/88',  pulse: 94,  temp: 38.2, spo2: 96, glucose: 310, status: 'Moderate' },
]

const TASKS = [
  { id: 'T1', task: 'Medication due — Insulin 10U (Rahul Mehta)',  time: '11:30 AM', priority: 'high',   done: false },
  { id: 'T2', task: 'Vitals check — ICU-A (Rahul Mehta)',          time: '12:00 PM', priority: 'high',   done: false },
  { id: 'T3', task: 'Dressing change — Ward-4 (Mohan Iyer)',       time: '12:30 PM', priority: 'medium', done: false },
  { id: 'T4', task: 'IV fluids replacement — Ward-3 (Sunita)',     time: '01:00 PM', priority: 'medium', done: true },
  { id: 'T5', task: 'Morning medications dispensed — Ward-2',       time: '10:00 AM', priority: 'low',    done: true },
]

const ALERTS = [
  { patient: 'Rahul Mehta',  param: 'SpO2',   value: '94%',     threshold: '< 95%',    level: 'critical' },
  { patient: 'Rahul Mehta',  param: 'Glucose', value: '220 mg/dL', threshold: '> 180', level: 'high' },
  { patient: 'Arjun Nair',   param: 'BP',      value: '180/110', threshold: '> 160/100', level: 'high' },
  { patient: 'Mohan Iyer',   param: 'Glucose', value: '310 mg/dL', threshold: '> 250', level: 'critical' },
]

export default function NurseDashboard() {
  const auth = getAuth()
  const dark = document.documentElement.classList.contains('dark')

  // Vitals form state
  const [vForm, setVForm] = useState({ patientId: 'P001', systolic: '', diastolic: '', pulse: '', temp: '', spo2: '', glucose: '' })
  const [submitted, setSubmitted] = useState(false)
  const [tasks, setTasks] = useState(TASKS)

  function submitVitals(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const statusBadge = (s: string) => ({
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    Moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    Stable:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  }[s] ?? 'bg-gray-100 text-gray-600')

  return (
    <DashboardLayout title="Nurse Dashboard">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome, {auth?.name ?? 'Nurse'} 👋</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Shift overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      {/* Alerts */}
      {ALERTS.length > 0 && (
        <div className={`rounded-xl border p-4 mb-6 ${dark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className={`font-semibold text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>Abnormal Vitals — Immediate Attention</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {ALERTS.map((a, i) => (
              <div key={i} className={`rounded-lg p-3 border ${a.level === 'critical'
                ? dark ? 'bg-red-900/40 border-red-700' : 'bg-red-100 border-red-300'
                : dark ? 'bg-amber-900/40 border-amber-700' : 'bg-amber-100 border-amber-300'}`}>
                <div className={`text-xs font-bold ${a.level === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {a.level === 'critical' ? '🔴 CRITICAL' : '🟠 HIGH'}
                </div>
                <div className={`font-semibold text-sm mt-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{a.patient}</div>
                <div className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{a.param}: <strong>{a.value}</strong> (threshold {a.threshold})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Vitals form + Patient table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vitals logging form */}
          <div className={`rounded-2xl border p-6 shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="w-4 h-4 text-blue-500" /> Log Vitals
            </h2>
            {submitted && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Vitals saved and synced successfully!
              </div>
            )}
            <form onSubmit={submitVitals} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Patient</label>
                <select value={vForm.patientId} onChange={e => setVForm(f => ({ ...f, patientId: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.ward})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'systolic',  label: 'Systolic (mmHg)',  placeholder: '120' },
                  { key: 'diastolic', label: 'Diastolic (mmHg)', placeholder: '80' },
                  { key: 'pulse',     label: 'Pulse (bpm)',       placeholder: '72' },
                  { key: 'temp',      label: 'Temp (°C)',         placeholder: '37.0' },
                  { key: 'spo2',      label: 'SpO₂ (%)',          placeholder: '98' },
                  { key: 'glucose',   label: 'Glucose (mg/dL)',   placeholder: '100' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{f.label}</label>
                    <input type="number" placeholder={f.placeholder}
                      value={vForm[f.key as keyof typeof vForm]}
                      onChange={e => setVForm(form => ({ ...form, [f.key]: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm shadow transition-all">
                Save & Sync Vitals
              </button>
            </form>
          </div>

          {/* Patient monitoring table */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
              <Heart className="w-4 h-4 text-pink-500" /> Patient Monitoring
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    {['Patient', 'Ward', 'BP', 'Pulse', 'Temp', 'SpO₂', 'Glucose', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {PATIENTS.map(p => (
                    <tr key={p.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</td>
                      <td className={`px-4 py-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{p.ward}</td>
                      <td className={`px-4 py-3 font-mono text-xs ${parseInt(p.bp) > 160 ? 'text-red-500 font-bold' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.bp}</td>
                      <td className={`px-4 py-3 ${p.pulse > 100 ? 'text-amber-500 font-bold' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.pulse}</td>
                      <td className={`px-4 py-3 ${p.temp > 38.5 ? 'text-red-500 font-bold' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.temp}°C</td>
                      <td className={`px-4 py-3 ${p.spo2 < 95 ? 'text-red-500 font-bold' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.spo2}%</td>
                      <td className={`px-4 py-3 ${p.glucose > 200 ? 'text-red-500 font-bold' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.glucose}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Task queue */}
        <div className={`rounded-2xl border shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
            <Clock className="w-4 h-4 text-blue-500" /> Task Queue
          </div>
          <div className="p-4 space-y-2.5">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${t.done
                ? dark ? 'bg-gray-800/30 border-gray-700 opacity-60' : 'bg-gray-50 border-gray-100 opacity-60'
                : t.priority === 'high'
                  ? dark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                  : dark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <button onClick={() => setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${t.done ? 'border-green-500 bg-green-500' : t.priority === 'high' ? 'border-red-400' : 'border-gray-300'}`}>
                  {t.done && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${t.done ? 'line-through' : ''} ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{t.task}</div>
                  <div className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

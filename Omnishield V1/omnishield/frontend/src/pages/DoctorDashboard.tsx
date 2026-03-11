import { useState, useEffect } from 'react'
import { Users, ClipboardList, Pill, Activity, Brain, ChevronRight, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { DashboardLayout, getAuth } from '../router'

const PATIENTS = [
  { id: 'P001', name: 'Rahul Mehta',    age: 45, complaint: 'Chest pain & breathlessness', status: 'Critical', vitals: 'abnormal' },
  { id: 'P002', name: 'Sunita Devi',    age: 32, complaint: 'Fever with chills (5 days)',  status: 'Stable',   vitals: 'normal' },
  { id: 'P003', name: 'Arjun Nair',     age: 67, complaint: 'Uncontrolled hypertension',   status: 'Moderate', vitals: 'watch' },
  { id: 'P004', name: 'Priya Kapoor',   age: 28, complaint: 'Gestational diabetes follow-up', status: 'Stable', vitals: 'normal' },
  { id: 'P005', name: 'Mohan Iyer',     age: 55, complaint: 'Diabetic foot ulcer (grade 3)', status: 'Moderate', vitals: 'watch' },
]

const CDSS_RECS = [
  {
    patient: 'Rahul Mehta (P001)',
    symptoms: ['Acute chest pain', 'Dyspnoea', 'Diaphoresis', 'ECG changes'],
    diagnosis: 'STEMI — ST-Elevation Myocardial Infarction',
    confidence: 94,
    interactions: ['Aspirin + Clopidogrel: safe at standard dose', 'Atorvastatin: no conflict'],
    tests: ['Troponin I (STAT)', '12-lead ECG repeat', 'Chest X-ray PA', 'Echocardiography'],
    alert: 'high',
  },
  {
    patient: 'Sunita Devi (P002)',
    symptoms: ['High-grade fever', 'Rigors', 'Hepatomegaly', 'Travel history: Odisha'],
    diagnosis: 'Falciparum Malaria (P. falciparum)',
    confidence: 87,
    interactions: ['Artemether: check G6PD before Primaquine', 'No major drug interactions noted'],
    tests: ['Peripheral smear', 'RDT Malaria Ag', 'CBC + LFT', 'Blood culture'],
    alert: 'medium',
  },
  {
    patient: 'Mohan Iyer (P005)',
    symptoms: ['Diabetic foot', 'Wound discharge', 'Fever', 'HbA1c: 11.2%'],
    diagnosis: 'Infected Diabetic Foot Ulcer — Sepsis risk',
    confidence: 79,
    interactions: ['Metformin: hold if contrast planned', 'Ciprofloxacin: QT prolongation watch'],
    tests: ['Wound culture & sensitivity', 'X-ray foot', 'Doppler lower limb', 'HbA1c + FBS'],
    alert: 'medium',
  },
]

const PRESCRIPTIONS = [
  { id: 'RX001', patient: 'Rahul Mehta',  drugs: 'Aspirin 325mg, Clopidogrel 75mg, Atorvastatin 80mg', status: 'Pending' },
  { id: 'RX002', patient: 'Sunita Devi',  drugs: 'Artemether-Lumefantrine 80/480mg (ACT)', status: 'Pending' },
  { id: 'RX003', patient: 'Arjun Nair',   drugs: 'Amlodipine 10mg, Telmisartan 40mg', status: 'Approved' },
  { id: 'RX004', patient: 'Priya Kapoor', drugs: 'Metformin 500mg BD, Folic Acid 5mg', status: 'Approved' },
]

type Tab = 'patients' | 'cdss' | 'prescriptions' | 'history'

export default function DoctorDashboard() {
  const auth = getAuth()
  const [tab, setTab] = useState<Tab>('patients')
  const [time, setTime] = useState(new Date())
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dark = document.documentElement.classList.contains('dark')

  const statCards = [
    { label: 'Active Patients',      value: '5',  icon: <Users className="w-5 h-5" />,        color: 'from-blue-500 to-blue-600',    sub: '+2 since yesterday' },
    { label: 'Pending Diagnoses',    value: '3',  icon: <ClipboardList className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', sub: '1 critical' },
    { label: 'Prescriptions Today',  value: '4',  icon: <Pill className="w-5 h-5" />,          color: 'from-emerald-500 to-teal-500', sub: '2 pending approval' },
    { label: 'CDSS Alerts',          value: '3',  icon: <Brain className="w-5 h-5" />,         color: 'from-violet-500 to-purple-600',sub: '1 high confidence' },
  ]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'patients',      label: 'Patient List' },
    { id: 'cdss',          label: 'CDSS Recommendations' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'history',       label: 'Case History' },
  ]

  function simulateSync() {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 1800)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      Moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      Stable:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    }
    return map[status] ?? 'bg-gray-100 text-gray-700'
  }

  return (
    <DashboardLayout title="Doctor Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
            Welcome, {auth?.name ?? 'Doctor'} 👋
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            {time.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <button onClick={simulateSync}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-sm font-medium transition-colors">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Records'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
              {s.icon}
            </div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            <div className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{s.label}</div>
            <div className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`flex border-b overflow-x-auto ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${tab === t.id
                  ? 'border-blue-500 text-blue-500'
                  : `border-transparent ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Patient List */}
          {tab === 'patients' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${dark ? 'text-gray-400' : 'text-gray-500'} text-xs uppercase tracking-wide`}>
                    <th className="text-left pb-3 font-semibold">Patient</th>
                    <th className="text-left pb-3 font-semibold">Age</th>
                    <th className="text-left pb-3 font-semibold">Chief Complaint</th>
                    <th className="text-left pb-3 font-semibold">Status</th>
                    <th className="text-left pb-3 font-semibold">Vitals</th>
                    <th className="text-left pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {PATIENTS.map(p => (
                    <tr key={p.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</div>
                            <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.age}y</td>
                      <td className={`py-3 max-w-xs ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{p.complaint}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${p.vitals === 'normal' ? 'bg-green-500' : p.vitals === 'watch' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <span className={`text-xs capitalize ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{p.vitals}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium">
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CDSS */}
          {tab === 'cdss' && (
            <div className="space-y-4">
              {CDSS_RECS.map((rec, i) => (
                <div key={i} className={`rounded-xl border p-4 ${rec.alert === 'high'
                  ? dark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                  : dark ? 'border-amber-800 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <div className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{rec.patient}</div>
                      <div className={`text-sm font-bold mt-0.5 ${rec.alert === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        🎯 {rec.diagnosis}
                      </div>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1 rounded-full ${rec.confidence >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {rec.confidence}% confidence
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className={`font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Symptoms</div>
                      {rec.symptoms.map((s, j) => <div key={j} className={dark ? 'text-gray-400' : 'text-gray-600'}>• {s}</div>)}
                    </div>
                    <div>
                      <div className={`font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Drug Interactions</div>
                      {rec.interactions.map((s, j) => <div key={j} className={dark ? 'text-gray-400' : 'text-gray-600'}>• {s}</div>)}
                    </div>
                    <div>
                      <div className={`font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Recommended Tests</div>
                      {rec.tests.map((s, j) => <div key={j} className={dark ? 'text-gray-400' : 'text-gray-600'}>• {s}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prescriptions */}
          {tab === 'prescriptions' && (
            <div className="space-y-3">
              {PRESCRIPTIONS.map(rx => (
                <div key={rx.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rx.status === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                      {rx.status === 'Pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-medium text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{rx.patient} <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>({rx.id})</span></div>
                      <div className={`text-xs mt-0.5 truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{rx.drugs}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${rx.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>{rx.status}</span>
                    {rx.status === 'Pending' && <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">Approve</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Case History */}
          {tab === 'history' && (
            <div className={`flex flex-col items-center justify-center py-16 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Activity className="w-12 h-12 mb-3 opacity-40" />
              <div className="font-semibold">Case History</div>
              <div className="text-sm mt-1">Select a patient to view their longitudinal case history</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

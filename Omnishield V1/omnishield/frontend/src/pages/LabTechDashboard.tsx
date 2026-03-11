import React, { useState } from 'react'
import { FlaskConical, CheckCircle, Clock, AlertTriangle, Upload, Activity } from 'lucide-react'
import { DashboardLayout, getAuth } from '../router'

const PENDING_ORDERS = [
  { id: 'LO001', patient: 'Rahul Mehta',   test: 'Troponin I (STAT)',          priority: 'STAT',    ordered: '11:20 AM', doctor: 'Dr. Sharma' },
  { id: 'LO002', patient: 'Sunita Devi',   test: 'Peripheral Smear + RDT',     priority: 'Urgent',  ordered: '11:35 AM', doctor: 'Dr. Sharma' },
  { id: 'LO003', patient: 'Mohan Iyer',    test: 'Wound Culture & Sensitivity',priority: 'Routine', ordered: '10:50 AM', doctor: 'Dr. Pillai' },
  { id: 'LO004', patient: 'Arjun Nair',    test: 'Lipid Profile + HbA1c',      priority: 'Routine', ordered: '09:30 AM', doctor: 'Dr. Pillai' },
  { id: 'LO005', patient: 'Priya Kapoor',  test: 'Oral GTT (75g)',              priority: 'Routine', ordered: '08:15 AM', doctor: 'Dr. Meena' },
]

const COMPLETED = [
  { id: 'LC001', patient: 'Arjun Nair',  test: 'CBC + ESR',   result: 'WBC 11.2, Hb 13.4, ESR 42',    flag: 'Abnormal', time: '09:45 AM' },
  { id: 'LC002', patient: 'Mohan Iyer',  test: 'HbA1c',       result: '11.2%',                          flag: 'Critical',  time: '10:10 AM' },
  { id: 'LC003', patient: 'Priya Kapoor',test: 'FBS',          result: '128 mg/dL',                      flag: 'Normal',    time: '08:30 AM' },
  { id: 'LC004', patient: 'Rahul Mehta', test: 'ABG',          result: 'pH 7.32, PaO2 68, PCO2 48',     flag: 'Critical',  time: '11:10 AM' },
]

const FLAG_COLORS: Record<string, string> = {
  Normal:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Abnormal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  STAT:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Urgent:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Routine: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

export default function LabTechDashboard() {
  const auth = getAuth()
  const dark = document.documentElement.classList.contains('dark')

  const [rForm, setRForm] = useState({ orderId: 'LO001', testName: '', patientId: '', value: '', unit: '', refRange: '', flag: 'Normal' as string })
  const [saved, setSaved] = useState(false)

  const stats = [
    { label: 'Pending Orders',    value: '5',  icon: <Clock className="w-5 h-5" />,         color: 'from-amber-500 to-orange-500' },
    { label: 'Completed Today',   value: '4',  icon: <CheckCircle className="w-5 h-5" />,    color: 'from-green-500 to-emerald-500' },
    { label: 'Critical Results',  value: '2',  icon: <AlertTriangle className="w-5 h-5" />,  color: 'from-red-500 to-rose-500' },
    { label: 'Average TAT',       value: '28m',icon: <Activity className="w-5 h-5" />,       color: 'from-blue-500 to-indigo-500' },
  ]

  function submitResult(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <DashboardLayout title="Lab Dashboard">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome, {auth?.name ?? 'Lab Tech'} 🔬</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Laboratory Information System — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending orders */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
            <FlaskConical className="w-4 h-4 text-blue-500" /> Pending Test Orders
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                  {['Order ID', 'Patient', 'Test', 'Priority', 'Ordered', 'Doctor'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {PENDING_ORDERS.map(o => (
                  <tr key={o.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{o.id}</td>
                    <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{o.patient}</td>
                    <td className={`px-4 py-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{o.test}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[o.priority]}`}>{o.priority}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{o.ordered}</td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{o.doctor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results entry form */}
        <div className={`rounded-2xl border shadow-sm p-5 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
            <CheckCircle className="w-4 h-4 text-green-500" /> Enter Test Results
          </h2>
          {saved && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Result saved and sent to EMR.
            </div>
          )}
          <form onSubmit={submitResult} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Order ID</label>
                <select value={rForm.orderId} onChange={e => setRForm(f => ({ ...f, orderId: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {PENDING_ORDERS.map(o => <option key={o.id} value={o.id}>{o.id} — {o.patient}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Test Name</label>
                <input type="text" placeholder="e.g. Troponin I" value={rForm.testName} onChange={e => setRForm(f => ({ ...f, testName: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Result Value</label>
                <input type="text" placeholder="e.g. 0.45" value={rForm.value} onChange={e => setRForm(f => ({ ...f, value: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Unit</label>
                <input type="text" placeholder="ng/mL" value={rForm.unit} onChange={e => setRForm(f => ({ ...f, unit: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Reference Range</label>
                <input type="text" placeholder="0.00 – 0.04 ng/mL" value={rForm.refRange} onChange={e => setRForm(f => ({ ...f, refRange: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Flag</label>
                <select value={rForm.flag} onChange={e => setRForm(f => ({ ...f, flag: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option>Normal</option>
                  <option>Abnormal</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow transition-all">
              Submit Result to EMR
            </button>
          </form>
        </div>
      </div>

      {/* Completed tests */}
      <div className={`mt-6 rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
          <CheckCircle className="w-4 h-4 text-green-500" /> Completed Tests
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                {['ID', 'Patient', 'Test', 'Result', 'Flag', 'Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {COMPLETED.map(c => (
                <tr key={c.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{c.id}</td>
                  <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{c.patient}</td>
                  <td className={`px-4 py-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{c.test}</td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{c.result}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${FLAG_COLORS[c.flag]}`}>{c.flag}</span></td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DICOM placeholder */}
      <div className={`mt-6 rounded-2xl border p-6 shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <Upload className="w-4 h-4 text-blue-500" /> DICOM Viewer
        </h2>
        <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 ${dark ? 'border-gray-700 bg-gray-800/30 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>
          <div className="text-4xl mb-3">🔬</div>
          <div className={`font-semibold ${dark ? 'text-gray-400' : 'text-gray-600'}`}>DICOM Viewer — Upload or connect to PACS</div>
          <div className={`text-sm mt-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Supports DICOM 3.0 · Orthanc PACS integration · Series viewer</div>
          <button className="mt-4 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
            Upload DICOM File
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

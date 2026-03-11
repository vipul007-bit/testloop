import { useState } from 'react'
import { Pill, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react'
import { DashboardLayout, getAuth } from '../router'

const PRESCRIPTIONS = [
  { id: 'RX001', patient: 'Rahul Mehta',   doctor: 'Dr. Sharma',  drugs: 'Aspirin 325mg × 1', qty: 1,  status: 'Pending', time: '11:25 AM' },
  { id: 'RX002', patient: 'Sunita Devi',   doctor: 'Dr. Sharma',  drugs: 'Artemether-Lumefantrine 80/480mg × 6 tabs', qty: 6, status: 'Pending', time: '11:40 AM' },
  { id: 'RX003', patient: 'Arjun Nair',    doctor: 'Dr. Pillai',  drugs: 'Amlodipine 10mg × 30', qty: 30, status: 'Ready',   time: '10:00 AM' },
  { id: 'RX004', patient: 'Priya Kapoor',  doctor: 'Dr. Meena',   drugs: 'Metformin 500mg × 60', qty: 60, status: 'Dispensed', time: '09:15 AM' },
  { id: 'RX005', patient: 'Mohan Iyer',    doctor: 'Dr. Pillai',  drugs: 'Ciprofloxacin 500mg × 14', qty: 14, status: 'Pending', time: '10:55 AM' },
]

const INTERACTIONS = [
  {
    drugs: 'Warfarin + Aspirin',
    risk: 'HIGH',
    description: 'Increased bleeding risk. Concurrent use significantly elevates haemorrhagic risk. Monitor INR closely.',
    recommendation: 'Avoid concurrent use or reduce Aspirin dose to < 100mg; monitor INR every 3 days.',
  },
  {
    drugs: 'Ciprofloxacin + NSAIDs',
    risk: 'MEDIUM',
    description: 'Combination may lower seizure threshold. Central nervous system effects possible.',
    recommendation: 'Use with caution; prefer paracetamol for pain relief in patients on Ciprofloxacin.',
  },
]

const STOCK = [
  { drug: 'Aspirin 325mg',           stock: 840,  max: 1000, status: 'adequate' },
  { drug: 'Metformin 500mg',         stock: 320,  max: 1000, status: 'adequate' },
  { drug: 'Amlodipine 10mg',         stock: 145,  max: 500,  status: 'low' },
  { drug: 'Artemether-Lumefantrine', stock: 42,   max: 200,  status: 'critical' },
  { drug: 'Ciprofloxacin 500mg',     stock: 210,  max: 400,  status: 'adequate' },
]

const DISPENSED_LOG = [
  { rx: 'RX004', patient: 'Priya Kapoor',  drug: 'Metformin 500mg × 60', dispenser: 'Deepa Nair',  time: '09:15 AM' },
  { rx: 'RX003', patient: 'Arjun Nair',    drug: 'Amlodipine 10mg × 30', dispenser: 'Deepa Nair',  time: '10:05 AM' },
]

const STATUS_COLORS: Record<string, string> = {
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Ready:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Dispensed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

export default function PharmacistDashboard() {
  const auth = getAuth()
  const dark = document.documentElement.classList.contains('dark')
  const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS)

  function dispense(id: string) {
    setPrescriptions(ps => ps.map(p => p.id === id ? { ...p, status: 'Dispensed' } : p))
  }

  const stockColor = (s: string) => ({
    adequate: 'bg-green-500',
    low:      'bg-amber-500',
    critical: 'bg-red-500',
  }[s] ?? 'bg-gray-400')

  const stockPct = (stock: number, max: number) => Math.round((stock / max) * 100)

  return (
    <DashboardLayout title="Pharmacy Dashboard">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome, {auth?.name ?? 'Pharmacist'} 💊</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Pharmacy Management System — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Rx',      value: String(prescriptions.filter(p => p.status === 'Pending').length),  color: 'from-amber-500 to-orange-500', icon: <Clock className="w-5 h-5" /> },
          { label: 'Dispensed Today', value: String(prescriptions.filter(p => p.status === 'Dispensed').length), color: 'from-green-500 to-emerald-500', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Drug Alerts',     value: '2',  color: 'from-red-500 to-rose-500',    icon: <AlertTriangle className="w-5 h-5" /> },
          { label: 'Low Stock Items', value: String(STOCK.filter(s => s.status !== 'adequate').length), color: 'from-blue-500 to-indigo-500', icon: <Package className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Drug interaction alerts */}
      <div className={`rounded-2xl border p-5 mb-6 ${dark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
        <h2 className={`font-bold mb-3 flex items-center gap-2 ${dark ? 'text-red-400' : 'text-red-700'}`}>
          <AlertTriangle className="w-4 h-4" /> Drug Interaction Alerts
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {INTERACTIONS.map((alert, i) => (
            <div key={i} className={`rounded-xl p-4 border ${alert.risk === 'HIGH'
              ? dark ? 'bg-red-900/40 border-red-700' : 'bg-red-100 border-red-300'
              : dark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.risk === 'HIGH' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{alert.risk}</span>
                <span className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{alert.drugs}</span>
              </div>
              <p className={`text-xs mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{alert.description}</p>
              <p className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>💡 {alert.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Prescription queue */}
        <div className={`lg:col-span-2 rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
            <Pill className="w-4 h-4 text-blue-500" /> Prescription Queue
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                  {['Rx ID', 'Patient', 'Doctor', 'Drug / Qty', 'Status', 'Time', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {prescriptions.map(rx => (
                  <tr key={rx.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{rx.id}</td>
                    <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{rx.patient}</td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{rx.doctor}</td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{rx.drugs}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[rx.status]}`}>{rx.status}</span></td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{rx.time}</td>
                    <td className="px-4 py-3">
                      {rx.status === 'Pending' && (
                        <button onClick={() => dispense(rx.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
                          Dispense
                        </button>
                      )}
                      {rx.status === 'Dispensed' && <span className="text-xs text-green-500 font-medium">✓ Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock levels */}
        <div className={`rounded-2xl border shadow-sm p-5 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
            <Package className="w-4 h-4 text-blue-500" /> Stock Levels
          </h2>
          <div className="space-y-4">
            {STOCK.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{s.drug}</span>
                  <span className={`text-xs ${s.status === 'critical' ? 'text-red-500 font-bold' : s.status === 'low' ? 'text-amber-500 font-medium' : dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {s.stock}/{s.max}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${stockColor(s.status)}`}
                    style={{ width: `${stockPct(s.stock, s.max)}%` }}
                  />
                </div>
                {s.status !== 'adequate' && (
                  <div className={`text-xs mt-0.5 ${s.status === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                    {s.status === 'critical' ? '⚠ Critically low — reorder now' : '⚡ Low stock — reorder soon'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispensing log */}
      <div className={`mt-6 rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
          <CheckCircle className="w-4 h-4 text-green-500" /> Dispensing Log
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                {['Rx', 'Patient', 'Drug', 'Dispensed By', 'Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {DISPENSED_LOG.map((d, i) => (
                <tr key={i} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{d.rx}</td>
                  <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{d.patient}</td>
                  <td className={`px-4 py-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{d.drug}</td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{d.dispenser}</td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{d.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

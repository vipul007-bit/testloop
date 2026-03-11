import { Users, Shield, Activity, CheckCircle, Server, Database, Wifi } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DashboardLayout, getAuth } from '../router'

const USERS = [
  { id: 'U001', name: 'Dr. Priya Sharma',  role: 'Doctor',        email: 'dr.sharma@omnishield.in',    status: 'Active',   lastLogin: '5 min ago' },
  { id: 'U002', name: 'Anita Verma',        role: 'Nurse',         email: 'nurse.anita@omnishield.in',  status: 'Active',   lastLogin: '2 min ago' },
  { id: 'U003', name: 'Ravi Kumar',         role: 'LabTechnician', email: 'lab.ravi@omnishield.in',     status: 'Active',   lastLogin: '8 min ago' },
  { id: 'U004', name: 'Deepa Nair',         role: 'Pharmacist',    email: 'pharma.deepa@omnishield.in', status: 'Active',   lastLogin: '12 min ago' },
  { id: 'U005', name: 'Dr. S. Menon',       role: 'Authority',     email: 'authority@mohfw.gov.in',     status: 'Active',   lastLogin: '1 hr ago' },
  { id: 'U006', name: 'Dr. Venkat Pillai',  role: 'Doctor',        email: 'dr.pillai@omnishield.in',    status: 'Inactive', lastLogin: '3 days ago' },
]

const AUDIT_LOG = [
  { action: 'Patient record accessed',       user: 'Dr. Priya Sharma', timestamp: '11:42:18 AM', ip: '10.0.0.12', level: 'info' },
  { action: 'Prescription approved (RX003)', user: 'Dr. Priya Sharma', timestamp: '11:38:55 AM', ip: '10.0.0.12', level: 'info' },
  { action: 'CDSS recommendation generated', user: 'System/AI',        timestamp: '11:35:02 AM', ip: '10.0.1.1',  level: 'info' },
  { action: 'Lab result critical flag sent', user: 'Ravi Kumar',        timestamp: '11:10:44 AM', ip: '10.0.0.31', level: 'warning' },
  { action: 'User login (Admin)',            user: 'Admin User',        timestamp: '10:50:30 AM', ip: '10.0.0.5',  level: 'info' },
]

const BED_DATA = [
  { dept: 'ICU',       total: 20, occupied: 17 },
  { dept: 'General',   total: 80, occupied: 62 },
  { dept: 'Maternity', total: 30, occupied: 24 },
  { dept: 'Paediatric',total: 25, occupied: 18 },
  { dept: 'Ortho',     total: 20, occupied: 11 },
]

const ROLE_COLORS: Record<string, string> = {
  Doctor:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Nurse:         'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  LabTechnician: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Pharmacist:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Authority:     'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
  HospitalAdmin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
}

export default function AdminDashboard() {
  const auth = getAuth()
  const dark = document.documentElement.classList.contains('dark')

  const services = [
    { name: 'API Server',       status: 'Operational', uptime: '99.97%', icon: <Server className="w-4 h-4" /> },
    { name: 'PostgreSQL DB',    status: 'Operational', uptime: '99.99%', icon: <Database className="w-4 h-4" /> },
    { name: 'WebSocket Server', status: 'Operational', uptime: '99.95%', icon: <Wifi className="w-4 h-4" /> },
    { name: 'FHIR Service',     status: 'Operational', uptime: '99.90%', icon: <Activity className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome, {auth?.name ?? 'Admin'} 🛡️</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Hospital Administration Console — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',         value: '6',      color: 'from-blue-500 to-indigo-600',   icon: <Users className="w-5 h-5" /> },
          { label: 'Active Sessions',     value: '4',      color: 'from-emerald-500 to-teal-500',  icon: <Activity className="w-5 h-5" /> },
          { label: 'Audit Events Today',  value: '47',     color: 'from-amber-500 to-orange-500',  icon: <Shield className="w-5 h-5" /> },
          { label: 'System Uptime',       value: '99.97%', color: 'from-violet-500 to-purple-600', icon: <CheckCircle className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* System health */}
      <div className={`rounded-2xl border p-5 mb-6 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="w-4 h-4 text-green-500" /> System Health
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((svc, i) => (
            <div key={i} className={`rounded-xl p-4 border ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                  {svc.icon}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{svc.name}</div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">{svc.status}</div>
              <div className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Uptime: {svc.uptime}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User management */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
            <Users className="w-4 h-4 text-blue-500" /> User Management
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                  {['User', 'Role', 'Status', 'Last Login'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {USERS.map(u => (
                  <tr key={u.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className={`font-medium text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{u.name}</div>
                      <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{u.email}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? ''}`}>{u.role}</span></td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${u.status === 'Active' ? 'text-green-500' : dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit log */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b font-bold flex items-center gap-2 ${dark ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
            <Shield className="w-4 h-4 text-violet-500" /> Audit Log
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {AUDIT_LOG.map((e, i) => (
              <div key={i} className={`px-4 py-3 flex items-start gap-3 ${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{e.action}</div>
                  <div className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{e.user} · {e.timestamp} · {e.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bed occupancy chart */}
      <div className={`rounded-2xl border shadow-sm p-6 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`font-bold mb-6 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="w-4 h-4 text-blue-500" /> Hospital Bed Occupancy by Department
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={BED_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
            <XAxis dataKey="dept" tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="total"    name="Total Beds"    fill="#e0e7ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="occupied" name="Occupied"      fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  )
}

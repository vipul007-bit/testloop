import React, { useState } from 'react'
import { Shield, Activity, BarChart2, Map, FlaskConical } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { DashboardLayout, getAuth } from '../router'

// ── SIR model ──────────────────────────────────────────────────────────────────
function runSIR(N: number, R0: number, gamma: number, days: number) {
  const beta = R0 * gamma
  let S = N - 10, I = 10, R = 0
  const data = []
  for (let d = 0; d <= days; d++) {
    data.push({ day: d, S: Math.round(S), I: Math.round(I), R: Math.round(R) })
    const dS = -(beta * S * I) / N
    const dI = (beta * S * I) / N - gamma * I
    const dR = gamma * I
    S += dS; I += dI; R += dR
    if (I < 1) break
  }
  return data
}

const DISTRICTS = [
  { name: 'Mumbai',    pop: '2.06Cr', R0: 2.4, active: 1420, predicted7d: 2100, risk: 'High' },
  { name: 'Delhi',     pop: '3.20Cr', R0: 2.1, active: 980,  predicted7d: 1300, risk: 'High' },
  { name: 'Bengaluru', pop: '1.35Cr', R0: 1.6, active: 310,  predicted7d: 380,  risk: 'Medium' },
  { name: 'Chennai',   pop: '0.88Cr', R0: 1.4, active: 185,  predicted7d: 210,  risk: 'Medium' },
  { name: 'Kolkata',   pop: '1.45Cr', R0: 1.2, active: 95,   predicted7d: 100,  risk: 'Low' },
]

const CLUSTERS = [
  { id: 'C001', district: 'Mumbai Central',  h3Index: '8a2a100dfffffff', cases: 312, density: 'Very High', type: 'Respiratory' },
  { id: 'C002', district: 'North Delhi',      h3Index: '8a2a1072bffffff', cases: 188, density: 'High',      type: 'Gastrointestinal' },
  { id: 'C003', district: 'Whitefield, BLR',  h3Index: '8a2a1057bffffff', cases: 94,  density: 'Medium',    type: 'Vector-borne' },
]

const DP_QUERIES = [
  { query: 'District-level case count',    epsilon: 0.5,  noise: 'Laplace(0, 2.0)', result: '1420 ± 4',  time: '11:30 AM' },
  { query: 'Age-group mortality rate',     epsilon: 1.0,  noise: 'Laplace(0, 1.0)', result: '2.3% ± 0.1', time: '10:55 AM' },
  { query: 'Vaccination coverage',         epsilon: 0.25, noise: 'Laplace(0, 4.0)', result: '71% ± 2',   time: '10:20 AM' },
]

const DISEASE_TRENDS = [
  { month: 'Jan', dengue: 420, malaria: 310, TB: 180, cholera: 45 },
  { month: 'Feb', dengue: 380, malaria: 290, TB: 175, cholera: 38 },
  { month: 'Mar', dengue: 350, malaria: 320, TB: 160, cholera: 42 },
  { month: 'Apr', dengue: 410, malaria: 480, TB: 155, cholera: 55 },
  { month: 'May', dengue: 520, malaria: 620, TB: 170, cholera: 70 },
  { month: 'Jun', dengue: 680, malaria: 890, TB: 190, cholera: 88 },
]

type Tab = 'surveillance' | 'seir' | 'dp' | 'population'

const RISK_COLORS: Record<string, string> = {
  High:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Low:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

export default function AuthorityDashboard() {
  const auth = getAuth()
  const dark = document.documentElement.classList.contains('dark')
  const [tab, setTab] = useState<Tab>('surveillance')

  // SIR params
  const [sirParams, setSirParams] = useState({ N: 1000000, R0: 2.4, gamma: 0.1, days: 90 })
  const sirData = runSIR(sirParams.N, sirParams.R0, sirParams.gamma, sirParams.days)

  // DP budget
  const totalEpsilon = 5.0
  const usedEpsilon = DP_QUERIES.reduce((acc, q) => acc + q.epsilon, 0)
  const epsilonPct = Math.round((usedEpsilon / totalEpsilon) * 100)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'surveillance', label: 'Surveillance Map',  icon: <Map className="w-4 h-4" /> },
    { id: 'seir',         label: 'SIR/SEIR Models',   icon: <Activity className="w-4 h-4" /> },
    { id: 'dp',           label: 'DP Analytics',      icon: <Shield className="w-4 h-4" /> },
    { id: 'population',   label: 'Population Health', icon: <BarChart2 className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout title="Authority Dashboard">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome, {auth?.name ?? 'Authority'} 🏛️</h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Public Health Surveillance & Epidemiology — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Clusters',   value: '3',     color: 'from-red-500 to-rose-500',    icon: <Map className="w-5 h-5" /> },
          { label: 'Districts Monitored', value: '28', color: 'from-blue-500 to-indigo-600',  icon: <Activity className="w-5 h-5" /> },
          { label: 'Privacy Budget Used', value: `ε=${usedEpsilon.toFixed(2)}`, color: 'from-violet-500 to-purple-600', icon: <Shield className="w-5 h-5" /> },
          { label: 'Avg R₀ (National)',  value: '1.8',  color: 'from-amber-500 to-orange-500',icon: <FlaskConical className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border shadow-sm ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`flex border-b overflow-x-auto ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${tab === t.id
                  ? 'border-blue-500 text-blue-500'
                  : `border-transparent ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Surveillance Map */}
          {tab === 'surveillance' && (
            <div className="space-y-6">
              <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 ${dark ? 'border-gray-700 bg-gray-800/30 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>
                <div className="text-5xl mb-3">🗺️</div>
                <div className={`font-semibold text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Map Loading…</div>
                <div className={`text-sm mt-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>PostGIS + H3 clusters active · Leaflet.js integration ready</div>
                <div className="flex gap-2 mt-4">
                  {['H3 Resolution: 8', 'CRS: EPSG:4326', 'Tiles: OSM'].map(b => (
                    <span key={b} className={`text-xs px-2.5 py-1 rounded-full border ${dark ? 'border-gray-700 text-gray-400 bg-gray-800' : 'border-gray-300 text-gray-500 bg-white'}`}>{b}</span>
                  ))}
                </div>
              </div>
              <div className={`rounded-xl border overflow-hidden ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className={`px-4 py-3 font-bold text-sm border-b ${dark ? 'text-white border-gray-800 bg-gray-800/50' : 'text-gray-900 border-gray-200 bg-gray-50'}`}>Active Clusters</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {['Cluster ID', 'District', 'H3 Index', 'Cases', 'Density', 'Type'].map(h => (
                        <th key={h} className={`text-left px-4 py-2.5 font-semibold ${dark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {CLUSTERS.map(c => (
                      <tr key={c.id} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{c.id}</td>
                        <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{c.district}</td>
                        <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{c.h3Index}</td>
                        <td className={`px-4 py-3 font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{c.cases}</td>
                        <td className={`px-4 py-3 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{c.density}</td>
                        <td className={`px-4 py-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{c.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SIR/SEIR */}
          {tab === 'seir' && (
            <div className="space-y-6">
              {/* Parameter inputs */}
              <div className={`rounded-xl border p-4 ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold text-sm mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>SIR Model Parameters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'N',    label: 'Population (N)', step: 100000 },
                    { key: 'R0',   label: 'R₀ (Basic Reproduction)', step: 0.1 },
                    { key: 'gamma',label: 'γ (Recovery Rate)', step: 0.01 },
                    { key: 'days', label: 'Days to Simulate', step: 10 },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{f.label}</label>
                      <input
                        type="number" step={f.step}
                        value={sirParams[f.key as keyof typeof sirParams]}
                        onChange={e => setSirParams(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  ))}
                </div>
                <div className={`mt-3 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  β = R₀ × γ = {(sirParams.R0 * sirParams.gamma).toFixed(4)} · Peak infected day ≈ {sirData.reduce((m, d, i) => d.I > sirData[m].I ? i : m, 0)}
                </div>
              </div>

              {/* SIR Chart */}
              <div>
                <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Epidemic Curve (SIR Model)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={sirData.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -2 }} tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                    <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="S" stroke="#3b82f6" name="Susceptible" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="I" stroke="#ef4444" name="Infected"    dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="R" stroke="#10b981" name="Recovered"  dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* District predictions */}
              <div>
                <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>District-Level 7-Day Predictions</h3>
                <div className={`rounded-xl border overflow-hidden ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                        {['District', 'Population', 'R₀', 'Active Cases', '7-Day Forecast', 'Risk Level'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {DISTRICTS.map(d => (
                        <tr key={d.name} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{d.name}</td>
                          <td className={`px-4 py-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{d.pop}</td>
                          <td className={`px-4 py-3 font-mono ${d.R0 >= 2 ? 'text-red-500 font-bold' : d.R0 >= 1.5 ? 'text-amber-500' : dark ? 'text-gray-300' : 'text-gray-700'}`}>{d.R0}</td>
                          <td className={`px-4 py-3 font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{d.active.toLocaleString()}</td>
                          <td className={`px-4 py-3 ${d.predicted7d > d.active ? 'text-red-500 font-semibold' : 'text-green-500'}`}>
                            {d.predicted7d.toLocaleString()} {d.predicted7d > d.active ? '↑' : '↓'}
                          </td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RISK_COLORS[d.risk]}`}>{d.risk}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DP Analytics */}
          {tab === 'dp' && (
            <div className="space-y-6">
              {/* Privacy budget meter */}
              <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                  <Shield className="w-4 h-4 text-violet-500" /> Privacy Budget Meter (ε-Differential Privacy)
                </h3>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className={`w-full h-4 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className={`h-4 rounded-full transition-all ${epsilonPct > 80 ? 'bg-red-500' : epsilonPct > 50 ? 'bg-amber-500' : 'bg-violet-500'}`} style={{ width: `${epsilonPct}%` }} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>ε {usedEpsilon.toFixed(2)} / {totalEpsilon.toFixed(1)}</span>
                </div>
                <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {epsilonPct}% of privacy budget consumed · Remaining: ε {(totalEpsilon - usedEpsilon).toFixed(2)} · Mechanism: Laplace
                </div>
                <div className={`mt-3 grid grid-cols-3 gap-2 text-center text-xs`}>
                  {[
                    { label: 'Used', value: `ε${usedEpsilon.toFixed(2)}`, color: 'text-violet-500' },
                    { label: 'Remaining', value: `ε${(totalEpsilon - usedEpsilon).toFixed(2)}`, color: 'text-green-500' },
                    { label: 'Total Budget', value: `ε${totalEpsilon}`, color: dark ? 'text-gray-300' : 'text-gray-700' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-lg p-2 ${dark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                      <div className={`font-bold text-base ${s.color}`}>{s.value}</div>
                      <div className={dark ? 'text-gray-400' : 'text-gray-500'}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Query log */}
              <div>
                <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>DP Query Log</h3>
                <div className={`rounded-xl border overflow-hidden ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                        {['Query', 'ε Used', 'Noise Mechanism', 'Result', 'Time'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {DP_QUERIES.map((q, i) => (
                        <tr key={i} className={`${dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{q.query}</td>
                          <td className={`px-4 py-3 font-mono font-bold text-violet-500`}>ε{q.epsilon}</td>
                          <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{q.noise}</td>
                          <td className={`px-4 py-3 font-semibold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{q.result}</td>
                          <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{q.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Population Health */}
          {tab === 'population' && (
            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Disease Trend (Jan–Jun 2024)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={DISEASE_TRENDS} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="month" tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="dengue"  stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Dengue" />
                    <Line type="monotone" dataKey="malaria" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Malaria" />
                    <Line type="monotone" dataKey="TB"      stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="TB" />
                    <Line type="monotone" dataKey="cholera" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Cholera" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Seasonal heatmap table */}
              <div>
                <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Seasonal Outbreak Heatmap (Cases per 1L population)</h3>
                <div className={`rounded-xl border overflow-hidden ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs ${dark ? 'text-gray-500 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                        <th className="text-left px-4 py-3 font-semibold">Disease</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                          <th key={m} className="text-center px-3 py-3 font-semibold">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries({ Dengue: [20, 18, 17, 20, 25, 33], Malaria: [15, 14, 16, 23, 30, 43], TB: [9, 9, 8, 8, 8, 9], Cholera: [2, 2, 2, 3, 3, 4] }).map(([disease, vals]) => (
                        <tr key={disease} className={dark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{disease}</td>
                          {vals.map((v, i) => {
                            const max = Math.max(...vals)
                            const intensity = Math.round((v / max) * 100)
                            const bg = intensity > 80 ? 'bg-red-500 text-white' : intensity > 50 ? 'bg-amber-400 text-white' : intensity > 30 ? 'bg-yellow-200 text-gray-800' : dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                            return <td key={i} className={`px-3 py-3 text-center text-xs font-semibold ${bg} rounded-sm`}>{v}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Shield, Mail, Lock, Eye, EyeOff, User, Building2, FlaskConical,
  Pill, Heart, Stethoscope, CheckCircle, AlertCircle, Sun, Moon,
  ChevronRight, Loader2, Fingerprint, QrCode,
} from 'lucide-react'
import { type UserRole, getRoleDashboard } from '../router'

const ROLES: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Doctor',       label: 'Doctor',         icon: <Stethoscope className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
  { id: 'Nurse',        label: 'Nurse',           icon: <Heart className="w-5 h-5" />,       color: 'from-pink-500 to-rose-500' },
  { id: 'LabTechnician',label: 'Lab Technician',  icon: <FlaskConical className="w-5 h-5" />,color: 'from-emerald-500 to-teal-500' },
  { id: 'Pharmacist',   label: 'Pharmacist',      icon: <Pill className="w-5 h-5" />,        color: 'from-amber-500 to-orange-500' },
  { id: 'HospitalAdmin',label: 'Hospital Admin',  icon: <Building2 className="w-5 h-5" />,   color: 'from-violet-500 to-purple-600' },
  { id: 'Authority',    label: 'Authority',       icon: <Shield className="w-5 h-5" />,      color: 'from-slate-500 to-gray-600' },
]

const DEMO_USERS: Record<UserRole, { email: string; password: string; name: string }> = {
  Doctor:        { email: 'dr.sharma@omnishield.in',  password: 'Demo@1234', name: 'Dr. Priya Sharma' },
  Nurse:         { email: 'nurse.anita@omnishield.in', password: 'Demo@1234', name: 'Anita Verma' },
  LabTechnician: { email: 'lab.ravi@omnishield.in',    password: 'Demo@1234', name: 'Ravi Kumar' },
  Pharmacist:    { email: 'pharma.deepa@omnishield.in',password: 'Demo@1234', name: 'Deepa Nair' },
  HospitalAdmin: { email: 'admin@omnishield.in',       password: 'Demo@1234', name: 'Admin User' },
  Authority:     { email: 'authority@mohfw.gov.in',    password: 'Demo@1234', name: 'Dr. S. Menon' },
}

type Tab = 'login' | 'register'
type Toast = { type: 'success' | 'error'; message: string } | null

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [dark, setDark] = useState(() => localStorage.getItem('omnishield_theme') === 'dark')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('Doctor')
  const [abhaId, setAbhaId] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [mfa, setMfa] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [remember, setRemember] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('omnishield_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { showToast('error', 'Please fill in all required fields.'); return }
    setLoading(true)
    try {
      const endpoint = tab === 'login'
        ? 'http://localhost:4000/api/v1/auth/login'
        : 'http://localhost:4000/api/v1/auth/register'
      const payload = tab === 'login'
        ? { email, password, mfaCode: mfa ? totpCode : undefined }
        : { email, password, name, role, abhaId }

      const res = await axios.post(endpoint, payload, { timeout: 5000 })
      const authData = { token: res.data.token, role: res.data.role as UserRole, email, name: res.data.name ?? name }
      localStorage.setItem('omnishield_auth', JSON.stringify(authData))
      showToast('success', 'Authenticated! Redirecting…')
      setTimeout(() => navigate(getRoleDashboard(authData.role)), 800)
    } catch {
      // Demo fallback
      performDemoLogin(role, email, password)
    } finally {
      setLoading(false)
    }
  }

  function performDemoLogin(selectedRole: UserRole, loginEmail?: string, loginPassword?: string) {
    const user = DEMO_USERS[selectedRole]
    const matchEmail = loginEmail ?? user.email
    const matchPassword = loginPassword ?? user.password
    if (matchEmail !== user.email || matchPassword !== user.password) {
      showToast('error', 'Invalid credentials. Try a Demo Login button below.')
      return
    }
    const authData = { token: `demo-token-${Date.now()}`, role: selectedRole, email: user.email, name: user.name }
    localStorage.setItem('omnishield_auth', JSON.stringify(authData))
    showToast('success', `Welcome, ${user.name}! Redirecting…`)
    setTimeout(() => navigate(getRoleDashboard(selectedRole)), 900)
  }

  function handleDemoLogin(selectedRole: UserRole) {
    const user = DEMO_USERS[selectedRole]
    setEmail(user.email)
    setPassword(user.password)
    setName(user.name)
    setRole(selectedRole)
    setLoading(true)
    setTimeout(() => {
      const authData = { token: `demo-token-${Date.now()}`, role: selectedRole, email: user.email, name: user.name }
      localStorage.setItem('omnishield_auth', JSON.stringify(authData))
      setLoading(false)
      showToast('success', `Demo: Welcome, ${user.name}!`)
      setTimeout(() => navigate(getRoleDashboard(selectedRole)), 700)
    }, 800)
  }

  return (
    <div className={`min-h-screen flex ${dark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 animate-fade-in
          ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={() => setDark(d => !d)}
        className={`fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-md transition-colors
          ${dark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">OmniShield</h1>
          <p className="text-blue-200 text-lg mb-2 font-medium">v2.0 — Multi-Role Healthcare Platform</p>
          <p className="text-blue-100/80 text-sm mb-10 leading-relaxed">
            India's federated, privacy-first clinical intelligence system. ABDM-compliant, FHIR R4 ready.
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              { icon: <Fingerprint className="w-5 h-5" />, title: 'ABHA-linked Identity', desc: 'Biometric + TOTP multi-factor authentication' },
              { icon: <Shield className="w-5 h-5" />, title: 'Differential Privacy', desc: 'ε-DP analytics with Laplace noise mechanisms' },
              { icon: <QrCode className="w-5 h-5" />, title: 'Offline-First PWA', desc: 'Dexie.js sync with conflict resolution' },
              { icon: <FlaskConical className="w-5 h-5" />, title: 'AI-Powered CDSS', desc: 'Clinical decision support with LLM integration' },
              { icon: <Stethoscope className="w-5 h-5" />, title: 'SIR/SEIR Epidemiology', desc: 'Real-time outbreak surveillance & H3 clusters' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{f.title}</div>
                  <div className="text-blue-200 text-xs mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-md rounded-2xl shadow-xl border p-8 animate-slide-up
          ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">OmniShield</span>
          </div>

          {/* Tabs */}
          <div className={`flex rounded-xl p-1 mb-6 ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                  ${tab === t
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <h2 className={`text-2xl font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            {tab === 'login' ? 'Sign in to your OmniShield account' : 'Join the healthcare network'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            {tab === 'register' && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Full Name"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hospital.in"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className={`block text-xs font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all duration-200
                      ${role === r.id
                        ? `bg-gradient-to-br ${r.color} text-white border-transparent shadow-md scale-105`
                        : dark
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                      }`}
                  >
                    {r.icon}
                    <span className="text-center leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ABHA ID */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                ABHA ID <span className={`font-normal ${dark ? 'text-gray-500' : 'text-gray-400'}`}>(optional)</span>
              </label>
              <div className="relative">
                <QrCode className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text" value={abhaId} onChange={e => setAbhaId(e.target.value)} placeholder="XX-XXXX-XXXX-XXXX"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>

            {/* MFA (login only) */}
            {tab === 'login' && (
              <div className={`rounded-xl p-3 border ${dark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={mfa} onChange={e => setMfa(e.target.checked)} className="sr-only" />
                    <div className={`w-9 h-5 rounded-full transition-colors ${mfa ? 'bg-blue-500' : dark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${mfa ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Enable MFA (TOTP)</span>
                </label>
                {mfa && (
                  <div className="mt-3">
                    <div className="relative">
                      <Fingerprint className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="6-digit TOTP code" maxLength={6}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Remember device */}
            {tab === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Remember this device for 30 days</span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
              ) : (
                <>{tab === 'login' ? 'Sign In' : 'Create Account'} <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo logins */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <span className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Quick Demo Login</span>
              <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleDemoLogin(r.id)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 hover:scale-105 disabled:opacity-50
                    ${dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${r.color} flex items-center justify-center text-white flex-shrink-0`}>
                    {React.cloneElement(r.icon as React.ReactElement, { className: 'w-3 h-3' })}
                  </span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Shield, Sun, Moon, LogOut, Activity } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — App.jsx is a legacy JS file without type declarations
import App from './App'
import LoginPage from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import NurseDashboard from './pages/NurseDashboard'
import LabTechDashboard from './pages/LabTechDashboard'
import PharmacistDashboard from './pages/PharmacistDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AuthorityDashboard from './pages/AuthorityDashboard'

export type UserRole = 'Doctor' | 'Nurse' | 'LabTechnician' | 'Pharmacist' | 'HospitalAdmin' | 'Authority'

export interface AuthData {
  token: string
  role: UserRole
  email: string
  name: string
}

export function getAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem('omnishield_auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getRoleDashboard(role: UserRole): string {
  const map: Record<UserRole, string> = {
    Doctor: '/dashboard/doctor',
    Nurse: '/dashboard/nurse',
    LabTechnician: '/dashboard/lab',
    Pharmacist: '/dashboard/pharmacist',
    HospitalAdmin: '/dashboard/admin',
    Authority: '/dashboard/authority',
  }
  return map[role] ?? '/login'
}

// ── Shared Dashboard Layout ────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const auth = getAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('omnishield_theme') === 'dark')
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('omnishield_theme', dark ? 'dark' : 'light')
  }, [dark])

  function logout() {
    localStorage.removeItem('omnishield_auth')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">OmniShield</span>
                {title && <span className={`ml-2 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>/ {title}</span>}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Online indicator */}
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${online ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                <Activity className="w-3 h-3" />
                {online ? 'Online' : 'Offline'}
              </span>

              {/* User info */}
              {auth && (
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {auth.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold">{auth.name}</div>
                    <div className={`${dark ? 'text-gray-400' : 'text-gray-500'}`}>{auth.role}</div>
                  </div>
                </div>
              )}

              {/* Theme toggle */}
              <button
                onClick={() => setDark(d => !d)}
                className={`p-2 rounded-lg transition-colors ${dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

// ── Protected Route ────────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole: UserRole
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = getAuth()

  if (!auth) return <Navigate to="/login" replace />

  if (auth.role !== requiredRole) {
    return <Navigate to={getRoleDashboard(auth.role)} replace />
  }

  return <>{children}</>
}

// ── Root redirect ──────────────────────────────────────────────────────────────
function RootRedirect() {
  const auth = getAuth()
  if (!auth) return <Navigate to="/login" replace />
  return <Navigate to={getRoleDashboard(auth.role)} replace />
}

// ── App Router ─────────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/dashboard/doctor" element={
        <ProtectedRoute requiredRole="Doctor"><DoctorDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/nurse" element={
        <ProtectedRoute requiredRole="Nurse"><NurseDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/lab" element={
        <ProtectedRoute requiredRole="LabTechnician"><LabTechDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist" element={
        <ProtectedRoute requiredRole="Pharmacist"><PharmacistDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute requiredRole="HospitalAdmin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/authority" element={
        <ProtectedRoute requiredRole="Authority"><AuthorityDashboard /></ProtectedRoute>
      } />

      <Route path="/app" element={<App />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

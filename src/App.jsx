// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Units from './pages/Units'
import Tenants from './pages/Tenants'
import Payments from './pages/Payments'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import Settings from './pages/Settings' // <--- Import this

const ProtectedRoute = ({ session }) => {
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute session={session} />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="units" element={<Units />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="payments" element={<Payments />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="reports" element={<Reports />} />
            {/* --- ADD THIS ROUTE --- */}
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
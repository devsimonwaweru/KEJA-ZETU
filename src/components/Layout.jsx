import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

import { 
  LayoutDashboard, 
  Building2, 
  Layers, 
  Users, 
  DollarSign, 
  Wrench, 
  FileText, 
  Settings, 
  Menu,
  LogOut 
} from 'lucide-react'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building2 },
    { name: 'Units', path: '/units', icon: Layers },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Rent & Payments', path: '/payments', icon: DollarSign },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <div className="app-container">
      <nav className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`nav-item ${isActive(item.path)}`}
              onClick={() => setIsMobileMenuOpen(false)} 
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
          <button 
            className="nav-item" 
            style={{ color: '#ef4444', marginTop: 'auto' }} 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: 'white', marginRight: '12px', cursor: 'pointer' }}
            >
              <Menu />
            </button>
            
            {/* SMALL LOGO IN TOPBAR */}
            <img 
              src="/keja-zetu-logo.png" 
              alt="Keja Zetu" 
              className="topbar-logo" 
            />
          </div>

          <h2>
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>

          <div className="user-profile" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Admin</span>
            <div style={{ width: '36px', height: '36px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
        </header>

        <div className="content-view">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
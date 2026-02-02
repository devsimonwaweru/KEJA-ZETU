import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Building2, Users, DollarSign, Plus } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    properties: 0,
    occupied: 0,
    collected: 0,
    arrears: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // 1. Properties Count
      const [propRes, occRes, payRes, tenRes] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
        supabase.from('payments').select('amount'),
        supabase.from('tenants').select('balance')
      ])

      const totalCollected = payRes.data ? payRes.data.reduce((sum, p) => sum + p.amount, 0) : 0
      const totalArrears = tenRes.data ? tenRes.data.reduce((sum, t) => sum + t.balance, 0) : 0 // Summing calculated balances

      setStats({
        properties: propRes.count || 0,
        occupied: occRes.count || 0,
        collected: totalCollected,
        arrears: totalArrears
      })
    } catch (error) {
      console.error('Error fetching stats:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 style={{marginBottom:'24px'}}>Dashboard Overview</h3>
      
      {loading ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'24px'}}>
           {[1,2,3,4].map(i => (
             <div key={i} className="stat-card skeleton" style={{aspectRatio:'1/1'}}></div>
           ))}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'24px', marginBottom:'32px'}}>
          <div className="stat-card">
            <div className="stat-label">Total Properties</div>
            <div className="stat-value">{stats.properties}</div>
          </div>          
          <div className="stat-card">
            <div className="stat-label">Occupied Units</div>
            <div className="stat-value">{stats.occupied}</div>
          </div>
          <div className="stat-card gold-accent">
            <div className="stat-label">Rent Collected</div>
            <div className="stat-value">KES {stats.collected.toLocaleString()}</div>
          </div>          
          <div className="stat-card danger">
            <div className="stat-label">Arrears</div>
            <div className="stat-value" style={{color:'#ef4444'}}>KES {stats.arrears.toLocaleString()}</div>
          </div>
        </div>
      )}

      <h4 style={{color:'#fff', marginBottom:'16px'}}>Quick Actions</h4>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
        
        <div className="stat-card" style={{cursor:'pointer', background:'#252525', padding:'20px'}} onClick={() => navigate('/properties')}>
          <Building2 size={40} color="var(--primary-green)" style={{marginBottom:'12px'}} />
          <div style={{color:'#fff', fontWeight:'600'}}>Add Property</div>
        </div>

        <div className="stat-card" style={{cursor:'pointer', background:'#252525', padding:'20px'}} onClick={() => navigate('/tenants')}>
          <Users size={40} color="var(--accent-gold)" style={{marginBottom:'12px'}} />
          <div style={{color:'#fff', fontWeight:'600'}}>Add Tenant</div>
        </div>

        <div className="stat-card" style={{cursor:'pointer', background:'#252525', padding:'20px'}} onClick={() => navigate('/payments')}>
          <DollarSign size={40} color="#fff" style={{marginBottom:'12px'}} />
          <div style={{color:'#fff', fontWeight:'600'}}>Record Payment</div>
        </div>
      </div>
    </div>
  )
}
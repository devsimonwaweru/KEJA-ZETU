import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Download, PieChart, Users, DollarSign, AlertTriangle } from 'lucide-react'

export default function Reports() {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [payRes, tenRes, unitsRes] = await Promise.all([
        supabase.from('payments').select('amount, payment_date'),
        supabase.from('tenants').select('name, balance, units(unit_number)'),
        supabase.from('units').select('status, rent_amount')
      ])

      if (payRes.data) setPayments(payRes.data || [])
      if (tenRes.data) setTenants(tenRes.data || [])
      if (unitsRes.data) setUnits(unitsRes.data || [])
    } catch (error) {
      alert('Error generating reports: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- ANALYTICS CALCULATIONS ---
  const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalArrears = tenants.reduce((sum, t) => sum + (t.balance || 0), 0)
  const totalUnitsCount = units.length
  const occupiedCount = units.filter(u => u.status === 'occupied').length
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedCount / totalUnitsCount) * 100) : 0

  // Monthly Report Data
  const monthlyReport = payments.reduce((acc, curr) => {
    const date = new Date(curr.payment_date)
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' })
    
    if (!acc[monthKey]) acc[monthKey] = { count: 0, total: 0 }
    acc[monthKey].count += 1
    acc[monthKey].total += curr.amount
    return acc
  }, {})

  const monthlyTableData = Object.keys(monthlyReport).map(key => ({
    Month: key,
    Transactions: monthlyReport[key].count,
    Amount: monthlyReport[key].total
  })).reverse()

  // Export Function
  const downloadCSV = (data, filename) => {
    if (data.length === 0) return alert("No data to export")
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(obj => Object.values(obj).join(",")).join("\n")
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Reports & Analytics</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>Business overview and financial summaries</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchAllData()}>
          Refresh Data
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          {/* --- SECTION 1: KEY METRICS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-label"><DollarSign size={14} style={{display:'inline', marginRight:'4px'}}/> Total Income</div>
              <div className="stat-value" style={{color:'var(--primary-green)'}}>KES {totalIncome.toLocaleString()}</div>
            </div>

            <div className="stat-card gold-accent">
              <div className="stat-label"><Users size={14} style={{display:'inline', marginRight:'4px'}}/> Occupancy Rate</div>
              <div className="stat-value">{occupancyRate}%</div>
              <div style={{fontSize:'0.8rem', color:'#666', marginTop:'4px'}}>
                {occupiedCount} / {totalUnitsCount} Units
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-label"><AlertTriangle size={14} style={{display:'inline', marginRight:'4px'}}/> Outstanding Arrears</div>
              <div className="stat-value" style={{color:'#ef4444'}}>KES {totalArrears.toLocaleString()}</div>
            </div>
          </div>

          {/* --- SECTION 2: MONTHLY COLLECTION REPORT --- */}
          <div className="stat-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>Monthly Collection Report</h4>
              <button className="btn btn-outline btn-sm" onClick={() => downloadCSV(monthlyTableData, 'keja_zetu_monthly_report.csv')}>
                <Download size={14} /> Export CSV
              </button>
            </div>
            
            <div className="data-table" style={{ padding: 0, border: '1px solid #333' }}>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Transactions</th>
                    <th>Collected (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTableData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{fontWeight:600}}>{row.Month}</td>
                      <td>{row.Transactions}</td>
                      <td style={{color:'var(--primary-green)', fontWeight:'700'}}>KES {row.Amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- SECTION 3: ARREARS REPORT --- */}
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>Top Debtors (Arrears Report)</h4>
              <button className="btn btn-outline btn-sm" onClick={() => {
                 const debtors = tenants
                    .filter(t => t.balance > 0)
                    .map(t => ({ Name: t.name, Unit: t.units?.unit_number || 'N/A', Arrears: t.balance }))
                 downloadCSV(debtors, 'keja_zetu_arrears_report.csv')
              }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
            
            <div className="data-table" style={{ padding: 0, border: '1px solid #333' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>Arrears Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.filter(t => t.balance > 0).sort((a,b) => b.balance - a.balance).map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.units?.unit_number}</td>
                      <td style={{color:'#ef4444', fontWeight:'700'}}>KES {t.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
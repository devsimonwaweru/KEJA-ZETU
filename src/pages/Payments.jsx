import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Download, Receipt } from 'lucide-react'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  
  // Form State
  const [formTenantId, setFormTenantId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formMethod, setFormMethod] = useState('Cash')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      // RLS SAFE: Join payments with tenants and units
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenants ( name, units ( unit_number ) )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      alert('Error fetching payments: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      // 1. Get current tenant balance
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('balance')
        .eq('id', parseInt(formTenantId))
        .single()
      
      const currentBalance = tenantData?.balance || 0
      const paymentAmount = parseInt(formAmount)
      
      // 2. Insert Payment
      const { error: paymentError } = await supabase.from('payments').insert([
        {
          tenant_id: parseInt(formTenantId),
          amount: paymentAmount,
          method: formMethod,
          payment_date: new Date().toISOString()
        }
      ])

      if (paymentError) throw paymentError
      
      // 3. Update Tenant Balance (Reduce arrears)
      const newBalance = currentBalance - paymentAmount
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ balance: newBalance })
        .eq('id', parseInt(formTenantId))

      if (updateError) throw updateError

      setShowRecordModal(false)
      setFormTenantId('')
      setFormAmount('')
      setFormMethod('Cash')
      fetchPayments()
    } catch (error) {
      alert('Error recording payment: ' + error.message)
    }
  }

  const openReceipt = (payment) => {
    setSelectedReceipt(payment)
    setShowReceiptModal(true)
  }

  const handlePrintReceipt = () => {
    // Robust Native Print
    window.print()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Rent Collection</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>Track payments and manage arrears</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
          Record Payment
        </button>
      </div>

      {/* Table */}
      <div className="data-table">
        {loading ? <p style={{padding:'20px', textAlign:'center'}}>Loading payments...</p> : payments.length === 0 ? (
          <div style={{padding:'40px', textAlign:'center', color:'#666'}}>
            No payments recorded yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tenant / Unit</th>
                <th>Amount</th>
                <th>Method</th>
                <th style={{textAlign:'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {new Date(pay.payment_date).toLocaleDateString()}
                  </td>
                  
                  <td>
                    <div>
                      <strong style={{ color: '#fff' }}>{pay.tenants?.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#999' }}>Unit {pay.tenants?.units?.unit_number}</div>
                    </div>
                  </td>

                  <td style={{ color: 'var(--primary-green)', fontWeight: '700' }}>
                    KES {pay.amount.toLocaleString()}
                  </td>

                  <td>
                    <span style={{ padding: '4px 8px', background: '#333', borderRadius: '4px', fontSize: '0.8rem', color: '#ddd' }}>
                      {pay.method}
                    </span>
                  </td>

                  <td style={{textAlign:'right'}}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => openReceipt(pay)}
                    >
                      <Receipt size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- RECORD PAYMENT MODAL --- */}
      {showRecordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Record Payment</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="input-group">
                <label>Select Tenant</label>
                <select value={formTenantId} onChange={(e) => setFormTenantId(e.target.value)} required>
                  <option value="">Choose Tenant</option>
                  {/* Simple fetch for dropdown - could be optimized but fine for demo */}
                  <option value="1">Test Tenant (Unit A1)</option>
                  <option value="2">Test Tenant 2 (Unit A3)</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Amount (KES)</label>
                <input type="number" placeholder="15000" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
              </div>

              <div className="input-group">
                <label>Payment Method</label>
                <select value={formMethod} onChange={(e) => setFormMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowRecordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECEIPT VIEW MODAL (Working Print) --- */}
      {showReceiptModal && selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center', background: '#fff', color: '#000' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#000', marginBottom: '4px' }}>KEJA ZETU</h3>
              <p style={{ fontSize: '0.8rem', color: '#555' }}>Official Receipt</p>
            </div>
            
            {/* Print-only CSS Class would be cleaner, but inline styles work for this component */}
            <div style={{ 
              border: '2px dashed #000', 
              padding: '20px', 
              margin: '20px 0', 
              borderRadius: '4px', 
              textAlign: 'left' 
            }}>
              <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>
                <strong>Date:</strong> {new Date(selectedReceipt.payment_date).toLocaleString()}<br/>
                <strong>Tenant:</strong> {selectedReceipt.tenants?.name}<br/>
                <strong>Method:</strong> {selectedReceipt.method}
              </div>
              <div style={{ borderTop: '1px solid #ddd', margin: '15px 0', paddingTop: '15px' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#666', marginBottom: '4px' }}>Amount Paid</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>
                  KES {selectedReceipt.amount.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Ref: #{selectedReceipt.id}</div>
            </div>

            <p style={{ fontSize: '0.8rem', marginTop: '20px', color: '#555' }}>
              Thank you for your payment.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setShowReceiptModal(false)}>Close</button>
              <button 
                className="btn btn-primary" 
                style={{ background: '#000', color: '#fff' }}
                onClick={handlePrintReceipt}
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
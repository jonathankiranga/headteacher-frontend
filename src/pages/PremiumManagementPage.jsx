import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import HelpPanel, { HelpSection, HelpStep, HelpTip } from '../components/HelpPanel.jsx';

export default function PremiumManagementPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const [settings, setSettings] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentModel, setPaymentModel] = useState('parent');
  const [feePerTerm, setFeePerTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [payPhone, setPayPhone] = useState(sessionStorage.getItem('teacher_phone') || '');
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const currentTerm = `Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!schoolId) return;
    loadData();
  }, [schoolId]);

  function loadData() {
    Promise.all([
      api.get(`/api/school-head/${schoolId}/premium-settings`),
      api.get(`/api/school-head/${schoolId}/premium/subscriptions`),
      api.get(`/api/school-head/${schoolId}/premium/payments`),
      api.get(`/api/school-head/${schoolId}/students`).then(r => setTotalStudents((r.data.students || []).length)).catch(() => {})
    ]).then(([s, subs, pays]) => {
      setSettings(s.data);
      setPaymentModel(s.data.premium_payment_model);
      setFeePerTerm(s.data.premium_fee_per_term?.toString() || '');
      setLocked(s.data.locked || false);
      setLockReason(s.data.lock_reason || '');
      setSubscriptions(subs.data.subscriptions || []);
      setPayments(pays.data.payments || []);
    }).catch(() => {});
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await api.put(`/api/school-head/${schoolId}/premium-settings`, {
        premium_payment_model: paymentModel,
        premium_fee_per_term: parseFloat(feePerTerm) || null
      });
      alert('Settings saved');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  }

  async function handlePayNow() {
    if (!payPhone) { setPayResult('Enter your M-Pesa phone number'); return; }
    setPaying(true);
    setPayResult('');
    try {
      const r = await api.post(`/api/school-head/${schoolId}/premium/pay`, { phone: payPhone });
      if (r.data.response_code === '0') {
        setPayResult(`STK push sent to ${payPhone}. Total: KES ${r.data.amount.toLocaleString()} for ${r.data.total_students} students. Enter PIN on your phone.`);
      } else {
        setPayResult(r.data.message || 'Payment initiation failed');
      }
      loadData();
    } catch (err) {
      setPayResult(err.response?.data?.error || 'Payment failed');
    }
    setPaying(false);
  }

  const totalFee = parseFloat(feePerTerm || settings?.premium_fee_per_term || 100) * totalStudents;

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Premium Management</h1>
          <button onClick={() => setShowHelp(true)} className="btn-ghost text-sm" aria-label="Help">❓</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Locked Warning */}
        {locked && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D' }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#E65100' }}>Payment Model Locked</p>
                <p className="text-xs mt-1" style={{ color: '#BF360C' }}>{lockReason}</p>
                <p className="text-xs mt-2" style={{ color: '#BF360C' }}>
                  {paymentModel === 'school' ? 'If payment has not been completed, teachers cannot post exam results until the school pays the premium.' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className="card p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: '#333' }}>Payment Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Who pays for premium? <span className="text-red-500 font-bold">*</span></label>
              <p className="text-xs mb-2" style={{ color: '#999' }}>
                {locked ? 'This setting is locked and cannot be changed until the term ends.' : 'Warning: Once set to "School pays", this cannot be changed until the term is over.'}
              </p>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer" style={{ opacity: locked && paymentModel === 'parent' ? 0.5 : 1 }}>
                  <input type="radio" name="pm" value="parent" checked={paymentModel === 'parent'}
                    onChange={e => setPaymentModel(e.target.value)} disabled={locked} />
                  <span className="text-sm">Parents pay individually</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" style={{ opacity: locked && paymentModel === 'school' ? 1 : 1 }}>
                  <input type="radio" name="pm" value="school" checked={paymentModel === 'school'}
                    onChange={e => setPaymentModel(e.target.value)} disabled={locked} />
                  <span className="text-sm">School pays one bulk amount</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Fee per student per term (KES)</label>
              <input type="number" value={feePerTerm} onChange={e => setFeePerTerm(e.target.value)}
                className="input-field" style={{ maxWidth: 200 }} min="0" step="10" />
            </div>
            <button onClick={handleSaveSettings} disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* School-pays: Pay Now via M-Pesa */}
        {paymentModel === 'school' && (
          <div className="card p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: '#333' }}>Pay Premium via M-Pesa</h2>
            <p className="text-xs mb-3" style={{ color: '#888' }}>
              One bulk payment covers all {totalStudents} active students for {currentTerm} {currentYear}.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#666' }}>Active students</span>
                <span className="font-semibold">{totalStudents}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: '#666' }}>Fee per student</span>
                <span className="font-semibold">KES {parseFloat(feePerTerm || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2" style={{ borderColor: '#E0E0E0' }}>
                <span>Total due</span>
                <span style={{ color: '#7B4F9B' }}>KES {totalFee.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>M-Pesa Phone Number</label>
                <input type="text" value={payPhone} onChange={e => setPayPhone(e.target.value)}
                  className="input-field" placeholder="254712345678" />
              </div>
              <button onClick={handlePayNow} disabled={paying}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#2E7D32' }}>
                {paying ? 'Sending STK...' : `Pay KES ${totalFee.toLocaleString()}`}
              </button>
            </div>
            {payResult && (
              <div className="text-sm mt-3 p-3 rounded" style={{
                backgroundColor: payResult.includes('Failed') || payResult.includes('failed') ? '#FFEBEE' : '#E8F5E9',
                color: payResult.includes('Failed') || payResult.includes('failed') ? '#C62828' : '#2E7D32'
              }}>{payResult}</div>
            )}
          </div>
        )}

        {/* Bulk Payment History */}
        {paymentModel === 'school' && payments.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: '#333' }}>Payment History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Term</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Amount</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Students</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Status</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.payment_id} style={{ borderBottom: i < payments.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-2.5 text-sm">{p.term} {p.year}</td>
                      <td className="px-3 py-2.5 text-right text-sm">KES {parseFloat(p.amount).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center text-sm">{p.total_students}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                          p.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{p.payment_status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs" style={{ color: '#888' }}>
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="card p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: '#333' }}>Subscriptions — {currentTerm} {currentYear}</h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm" style={{ color: '#888' }}>No subscriptions yet for this term.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Parent</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Children</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Paid By</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub, i) => (
                    <tr key={sub.subscription_id} style={{ borderBottom: i < subscriptions.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-2.5 text-sm">{sub.parent_phone}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#666' }}>{sub.children}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.payment_model === 'school' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {sub.payment_model === 'school' ? 'School' : 'Parent'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sub.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} title="Premium Management — Help">
        <HelpSection icon="🔑" title="What is premium?">
          The EduApp is free for schools. <strong>Premium</strong> is an optional
          subscription that unlocks WhatsApp alerts for parents — they receive
          notifications when their child is absent, and when CAT results are published.
        </HelpSection>
        <HelpSection icon="💳" title="Two payment models">
          <div style={{ marginBottom: 8 }}>
            <strong>Parents pay individually</strong> — each parent subscribes and pays
            directly through their own app. The school does not handle money.
          </div>
          <div>
            <strong>School pays in bulk</strong> — the headteacher pays one lump sum via
            M-Pesa to cover all active students. Teachers cannot post CAT results until
            this payment is completed each term.
          </div>
        </HelpSection>
        <HelpSection icon="📱" title="Paying via M-Pesa (school model)">
          <HelpStep n={1}>Select <strong>School pays</strong> and save settings.</HelpStep>
          <HelpStep n={2}>Confirm the per-student fee and total shown.</HelpStep>
          <HelpStep n={3}>Enter your M-Pesa phone number and tap <strong>Pay</strong>.</HelpStep>
          <HelpStep n={4}>An STK push is sent to your phone — enter your PIN to complete payment.</HelpStep>
        </HelpSection>
        <HelpSection icon="👨‍👩‍👧" title="What parents get">
          Subscribed parents receive a WhatsApp message when their child is marked absent,
          when CAT results are available, and for any school broadcasts the headteacher sends.
        </HelpSection>
        <HelpSection icon="⚠️" title="Locked setting">
          Once you switch to <em>School pays</em> and pay, the model cannot be changed
          until the term ends. This prevents disruption mid-term. Plan ahead before
          switching.
        </HelpSection>
        <HelpTip>The Subscriptions table at the bottom shows which parents are currently active for the term and whether they paid individually or via the school.</HelpTip>
      </HelpPanel>
    </div>
  );
}

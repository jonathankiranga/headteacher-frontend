import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../components/Dropdown.jsx';
import api from '../utils/api.js';

export default function FeesPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role');
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeTerm, setFeeTerm] = useState('Term 1');
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());
  const [feeOptional, setFeeOptional] = useState(false);
  const [assignFee, setAssignFee] = useState(null);
  const [assignClass, setAssignClass] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!schoolId || role !== 'head') navigate('/home', { replace: true });
  }, [schoolId, role, navigate]);

  async function load() {
    if (!schoolId) return;
    setLoading(true);
    try {
      const d = await api.get('/api/fees', { params: { school_id: schoolId } });
      setFees(d.data.fees || []);
      const c = await api.get('/api/fees/classes', { params: { school_id: schoolId } });
      setClasses((c.data.classes || []).map(x => ({ value: x.class_id, label: x.class_name })));
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [schoolId]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/api/fees', { school_id: schoolId, fee_name: feeName, amount: feeAmount, term: feeTerm, academic_year: feeYear, is_optional: feeOptional });
      setMsg(`${feeName} created`);
      setFeeName(''); setFeeAmount(''); setShowForm(false);
      load();
    } catch (err) { setMsg('Failed to create'); }
  }

  async function handleDelete(feeId) {
    if (!window.confirm('Delete this fee item?')) return;
    try { await api.delete(`/api/fees/${feeId}`); load(); } catch (e) { /* ignore */ }
  }

  async function handleAssign(e) {
    e.preventDefault();
    try {
      await api.post('/api/fees/assign', { fee_id: assignFee, class_id: assignClass || null });
      setMsg('Assigned');
      setAssignFee(null); setAssignClass('');
      load();
    } catch (err) { setMsg('Failed to assign'); }
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Fee Structure</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-sm">{showForm ? 'Cancel' : '+ New Fee'}</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {showForm && (
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#333' }}>New Fee Item</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Fee Name</label>
                <input value={feeName} onChange={e => setFeeName(e.target.value)} className="input-field" placeholder="e.g. Tuition" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Amount (KSh)</label>
                <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Term</label>
                <select value={feeTerm} onChange={e => setFeeTerm(e.target.value)} className="input-field">
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Year</label>
                <input type="number" value={feeYear} onChange={e => setFeeYear(e.target.value)} className="input-field" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
                  <input type="checkbox" checked={feeOptional} onChange={e => setFeeOptional(e.target.checked)} />
                  Optional fee
                </label>
              </div>
              <button type="submit" className="btn-primary col-span-2">Create Fee Item</button>
            </form>
          </div>
        )}

        {assignFee && (
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#333' }}>Assign Fee to Class</h2>
            <form onSubmit={handleAssign} className="space-y-3">
              <Dropdown label="Assign to Class" options={classes} value={assignClass} onChange={setAssignClass} placeholder="Select class (optional)" />
              <button type="submit" className="btn-primary">Assign</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} /></div>
        ) : fees.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-sm" style={{ color: '#888' }}>No fee items. Create one above.</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Fee Name</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Term</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Year</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Optional</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f, i) => (
                  <tr key={f.fee_id} style={{ borderBottom: i < fees.length-1 ? '1px solid #F0F0F0' : 'none' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#333' }}>{f.fee_name}</td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#333' }}>KSh {parseFloat(f.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: '#666' }}>{f.term}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: '#666' }}>{f.academic_year}</td>
                    <td className="px-4 py-3 text-center">{f.is_optional ? <span className="badge-premium">Optional</span> : <span className="text-xs" style={{ color: '#aaa' }}>—</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setAssignFee(f.fee_id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Assign</button>
                        <button onClick={() => handleDelete(f.fee_id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {msg && <div className="text-sm text-center py-2 rounded-lg" style={{ backgroundColor: msg.includes('Failed') ? '#FFEBEE' : '#E8F5E9', color: msg.includes('Failed') ? '#C62828' : '#2E7D32' }}>{msg}</div>}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchTeachers, addTeacher, deleteTeacher } from '../utils/api.js';

function BroadcastModal({ schoolId, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult('');
    try {
      const r = await api.post(`/api/school-head/${schoolId}/broadcast`, { message });
      setResult(`Sent to ${r.data.sent} premium parents`);
    } catch (err) {
      setResult(err.response?.data?.error || 'Failed');
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>Broadcast to Parents</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#888' }}>✕</button>
        </div>
        <p className="text-xs mb-3" style={{ color: '#888' }}>Message will be sent via WhatsApp to all premium parents in your school.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          className="input-field" rows={4} placeholder="Type your message here..."
          style={{ resize: 'vertical' }} />
        {result && <div className="text-sm mt-2 p-2 rounded" style={{ backgroundColor: result.includes('Failed') ? '#FFEBEE' : '#E8F5E9', color: result.includes('Failed') ? '#C62828' : '#2E7D32' }}>{result}</div>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !message.trim()}
            className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTeacherModal({ schoolId, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addTeacher(schoolId, { full_name: name, phone });
      onAdded(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#333' }}>New Teacher</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Jane Mwangi" required />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="254712345678" required />
          </div>
          {error && <p className="text-xs mb-3" style={{ color: '#C62828' }}>{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportCsvModal({ schoolId, onClose, onAdded }) {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    api.get(`/api/school-head?school_id=${schoolId}/classes`).catch(() => {});
    api.get(`/api/fees/classes?school_id=${schoolId}`).then(r => setClasses(r.data.classes || [])).catch(() => {});
  }, [schoolId]);

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsv(ev.target.result);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!classId || !csv.trim()) { setResult('Select a class and upload a CSV file'); return; }
    setLoading(true);
    try {
      const r = await api.post(`/api/school-head/${schoolId}/students/import`, { class_id: classId, csv });
      setResult(`Imported ${r.data.imported} students${r.data.errors ? ', ' + r.data.errors + ' errors' : ''}`);
      if (r.data.imported > 0) onAdded();
    } catch (err) { setResult(err.response?.data?.error || 'Import failed'); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>Import Students (CSV)</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#888' }}>✕</button>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Class</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
            <option value="">— Select Class —</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>CSV File</label>
          <p className="text-xs mb-1" style={{ color: '#888' }}>File format: one <code>student_id,full_name</code> per line</p>
          <input type="file" accept=".csv" onChange={handleFileSelect}
            className="input-field" style={{ padding: '8px 12px', fontSize: 13 }} />
          {fileName && <p className="text-xs mt-1" style={{ color: '#2E7D32' }}>Selected: {fileName}</p>}
        </div>
        {result && <div className="text-sm mb-3 p-2 rounded" style={{ backgroundColor: result.includes('Failed') || result.includes('Select') ? '#FFEBEE' : '#E8F5E9', color: result.includes('Failed') || result.includes('Select') ? '#C62828' : '#2E7D32' }}>{result}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
          <button onClick={handleImport} disabled={loading || !csv.trim()} className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>{loading ? 'Importing...' : 'Import'}</button>
        </div>
      </div>
    </div>
  );
}

export default function SchoolHeadDashboard() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!teacherId || role !== 'head') navigate('/teacher/login', { replace: true });
  }, [teacherId, role, navigate]);

  async function loadTeachers() {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await fetchTeachers(schoolId);
      setTeachers(data.teachers || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadTeachers(); }, [schoolId]);

  async function handleDelete(tid) {
    if (!window.confirm('Remove this teacher?')) return;
    setDeleting(tid);
    try { await deleteTeacher(schoolId, tid); loadTeachers(); } catch (e) { /* ignore */ }
    setDeleting(null);
  }

  return (
    <div style={{
      minHeight: '100vh', paddingBottom: 70,
      backgroundImage: 'url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80)',
      backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold" style={{ color: '#333' }}>Teachers</h1>
              <p className="text-xs" style={{ color: '#888' }}>{teachers.length} records</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBroadcast(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(255,179,0,0.12)', color: '#B8860B' }}>Broadcast</button>
              <button onClick={() => navigate('/analytics')} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Analytics</button>
              <button onClick={() => setShowCsv(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(46,125,50,0.08)', color: '#2E7D32' }}>Import CSV</button>
              <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">+ New</button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
            </div>
          ) : teachers.length === 0 ? (
            <div className="bg-white rounded-card p-12 text-center border border-gray-200">
              <p className="text-sm" style={{ color: '#888' }}>No teachers yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-card overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase hidden sm:table-cell" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase hidden sm:table-cell" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Role</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, i) => (
                    <tr key={t.teacher_id} style={{ borderBottom: i < teachers.length - 1 ? '1px solid #F0F0F0' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: t.role === 'head' ? '#5C3D76' : '#9B6FB8' }}>
                            {t.full_name ? t.full_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#333' }}>{t.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm hidden sm:table-cell" style={{ color: '#666' }}>{t.phone}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {t.role === 'head' ? <span className="badge-premium">Head</span> : <span className="text-sm" style={{ color: '#888' }}>Teacher</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { sessionStorage.setItem('teacher_id', t.teacher_id); navigate('/exams'); }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Exams</button>
                          {t.role !== 'head' && (
                            <button onClick={() => handleDelete(t.teacher_id)} disabled={deleting === t.teacher_id}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
                              {deleting === t.teacher_id ? '...' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showModal && <AddTeacherModal schoolId={schoolId} onClose={() => setShowModal(false)} onAdded={loadTeachers} />}
      {showCsv && <ImportCsvModal schoolId={schoolId} onClose={() => setShowCsv(false)} onAdded={loadTeachers} />}
      {showBroadcast && <BroadcastModal schoolId={schoolId} onClose={() => setShowBroadcast(false)} />}
    </div>
  );
}

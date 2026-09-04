import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchTeachers, addTeacher, deleteTeacher, setTeacherActive, getAssignments, updateAssignments } from '../utils/api.js';
import HelpPanel, { HelpSection, HelpStep, HelpTip } from '../components/HelpPanel.jsx';

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
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addTeacher(schoolId, { full_name: name, phone, email, role: newRole });
      onAdded(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#333' }}>New Staff</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Jane Mwangi" required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="254712345678" required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Email (for login)</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-field" placeholder="jane@school.co.ke" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field">
              <option value="teacher">Teacher</option>
              <option value="bursar">Bursar</option>
            </select>
            {newRole === 'bursar' && (
              <p className="text-xs mt-1" style={{ color: '#7B4F9B' }}>Bursar signs into Bazar Pay to manage school fees.</p>
            )}
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

function AssignClassesModal({ schoolId, teacher, allClasses, onClose, onSaved }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  async function handleSave() {
    setSaving(true);
    setResult('');
    try {
      await updateAssignments(schoolId, teacher.teacher_id, selectedIds);
      setResult(`Assigned ${selectedIds.length} class${selectedIds.length === 1 ? '' : 'es'}`);
      onSaved();
    } catch (err) {
      setResult(err.response?.data?.error || 'Failed');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>Assign Classes — {teacher.full_name}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#888' }}>✕</button>
        </div>
        <p className="text-xs mb-3" style={{ color: '#888' }}>Check the classes this teacher teaches. Uncheck to remove assignment.</p>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {allClasses.map(c => (
            <label key={c.class_id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={selectedIds.includes(c.class_id)} onChange={e => e.target.checked ? setSelectedIds([...selectedIds, c.class_id]) : setSelectedIds(selectedIds.filter(id => id !== c.class_id))} />
              <span style={{ color: '#333' }}>{c.class_name}</span>
            </label>
          ))}
          {allClasses.length === 0 && <p className="text-sm" style={{ color: '#888' }}>No classes available</p>}
        </div>
        {result && <div className="text-sm mt-3 p-2 rounded" style={{ backgroundColor: result.includes('Failed') ? '#FFEBEE' : '#E8F5E9', color: result.includes('Failed') ? '#C62828' : '#2E7D32' }}>{result}</div>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
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

  function downloadCsvTemplate() {
    const content = `student_id,full_name
STU001,Jane Wanjiku
STU002,Peter Kamau,254712345678
STU003,Grace Akinyi,254722998877,Mary Akinyi
`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadExcelTemplate() {
    const XLSX = await import('xlsx');
    const data = [
      { student_id: 'STU001', full_name: 'Jane Wanjiku', parent_phone: '', parent_name: '' },
      { student_id: 'STU002', full_name: 'Peter Kamau', parent_phone: '254712345678', parent_name: '' },
      { student_id: 'STU003', full_name: 'Grace Akinyi', parent_phone: '254722998877', parent_name: 'Mary Akinyi' },
    ];
    const ws = XLSX.utils.json_to_sheet(data, { header: ['student_id', 'full_name', 'parent_phone', 'parent_name'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student-import-template.xlsx');
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
          <p className="text-xs mb-1" style={{ color: '#888' }}>Format per line: <code>student_id,full_name</code> — optionally add <code>,parent_phone,parent_name</code> to link a parent.</p>
          <input type="file" accept=".csv" onChange={handleFileSelect}
            className="input-field" style={{ padding: '8px 12px', fontSize: 13 }} />
          {fileName && <p className="text-xs mt-1" style={{ color: '#2E7D32' }}>Selected: {fileName}</p>}
        </div>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={downloadCsvTemplate} className="btn-secondary !px-3 !py-1.5 text-xs">Download CSV Template</button>
          <button type="button" onClick={downloadExcelTemplate} className="btn-secondary !px-3 !py-1.5 text-xs">Download Excel Template</button>
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
  const [showAssign, setShowAssign] = useState(false);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [premiumWarning, setPremiumWarning] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Check premium payment status
  useEffect(() => {
    if (!schoolId) return;
    api.get('/api/exam-sessions/premium-status', { params: { school_id: schoolId } })
      .then(r => {
        if (r.data.blocked) {
          setPremiumWarning('Premium payment required. Teachers cannot post exam results until the school pays for this term. Go to Premium Management to pay.');
        } else {
          setPremiumWarning('');
        }
      })
      .catch(() => {});
  }, [schoolId]);

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

  // Load all classes for the assign modal
  useEffect(() => {
    if (!schoolId) return;
    api.get(`/api/fees/classes?school_id=${schoolId}`).then(r => setAllClasses(r.data.classes || [])).catch(() => {});
  }, [schoolId]);

  async function handleDelete(tid) {
    if (!window.confirm('Remove this teacher?')) return;
    setDeleting(tid);
    try { await deleteTeacher(schoolId, tid); loadTeachers(); } catch (e) { /* ignore */ }
    setDeleting(null);
  }

  async function handleToggleActive(t) {
    setDeleting(t.teacher_id);
    try { await setTeacherActive(schoolId, t.teacher_id, t.active === 0); loadTeachers(); } catch (e) { /* ignore */ }
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
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button onClick={() => navigate('/students')} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Students</button>
              <button onClick={() => navigate('/classes')} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Classes</button>
              <button onClick={() => navigate('/promotion')} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(255,179,0,0.12)', color: '#B8860B' }}>Promotion</button>
              <button onClick={() => navigate('/premium')} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(46,125,50,0.08)', color: '#2E7D32' }}>Premium</button>
              <button onClick={() => setShowBroadcast(true)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(255,179,0,0.12)', color: '#B8860B' }}>Broadcast</button>
              <button onClick={() => navigate('/analytics')} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Analytics</button>
              <button onClick={() => setShowCsv(true)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(46,125,50,0.08)', color: '#2E7D32' }}>CSV</button>
              <button onClick={() => setShowHelp(true)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }} aria-label="Help">❓ Help</button>
              <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">+ Teacher</button>
            </div>
          </div>
        </div>

          {premiumWarning && (
            <div className="max-w-3xl mx-auto px-4 pt-4">
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' }}>
                <strong>⚠️ Premium Payment Due:</strong> {premiumWarning}
              </div>
            </div>
          )}

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
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: t.role === 'head' ? '#5C3D76' : t.role === 'bursar' ? '#B8860B' : '#9B6FB8' }}>
                            {t.full_name ? t.full_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#333' }}>{t.full_name}</span>
                          {t.active === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Inactive</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm hidden sm:table-cell" style={{ color: '#666' }}>{t.phone}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {t.role === 'head' ? <span className="badge-premium">Head</span> : t.role === 'bursar' ? <span className="badge-premium">Bursar</span> : <span className="text-sm" style={{ color: '#888' }}>Teacher</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { sessionStorage.setItem('teacher_id', t.teacher_id); navigate('/exams'); }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Exams</button>
                          <button onClick={() => { setAssignTeacher(t); setShowAssign(true); }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(46,125,50,0.08)', color: '#2E7D32' }}>Classes</button>
                          {t.role !== 'head' && (
                            <>
                              <button onClick={() => handleToggleActive(t)} disabled={deleting === t.teacher_id}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ backgroundColor: t.active === 0 ? 'rgba(46,125,50,0.08)' : 'rgba(255,235,238,1)', color: t.active === 0 ? '#2E7D32' : '#C62828' }}>
                                {deleting === t.teacher_id ? '...' : (t.active === 0 ? 'Activate' : 'Deactivate')}
                              </button>
                              <button onClick={() => handleDelete(t.teacher_id)} disabled={deleting === t.teacher_id}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
                                {deleting === t.teacher_id ? '...' : 'Remove'}
                              </button>
                            </>
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
      {showAssign && assignTeacher && <AssignClassesModal schoolId={schoolId} teacher={assignTeacher} allClasses={allClasses} onClose={() => setShowAssign(false)} onSaved={loadTeachers} />}

      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} title="Staff — Help">
        <HelpSection icon="👥" title="What is this screen?">
          The Staff page is where you manage everyone who works at the school —
          teachers, bursars, and the headteacher. Each person needs an account here
          before they can log in to the app.
        </HelpSection>
        <HelpSection icon="➕" title="Adding a staff member">
          <HelpStep n={1}>Tap <strong>+ Teacher</strong>.</HelpStep>
          <HelpStep n={2}>Enter their full name, phone number (for OTP login), and optionally an email address.</HelpStep>
          <HelpStep n={3}>Choose their <strong>role</strong>: Teacher (takes attendance, enters scores) or Bursar (manages fees in Bazar Pay).</HelpStep>
          <HelpStep n={4}>Tap <strong>Add</strong>. They can now log in using the OTP sent to their phone.</HelpStep>
        </HelpSection>
        <HelpSection icon="🏫" title="Assigning classes">
          Tap <strong>Classes</strong> next to a teacher to choose which classes they
          teach. A teacher only sees the students in their assigned classes when taking
          attendance or entering scores.
        </HelpSection>
        <HelpSection icon="📢" title="Broadcast to parents">
          Tap <strong>Broadcast</strong> to send a WhatsApp message to all
          premium-subscribed parents in the school — useful for school notices,
          fee reminders, or emergency updates.
        </HelpSection>
        <HelpSection icon="🔒" title="Deactivating a teacher">
          Use <strong>Deactivate</strong> to temporarily block a teacher from logging in
          without deleting their account and history. Use <strong>Remove</strong> to
          permanently delete them.
        </HelpSection>
        <HelpTip>Import students via CSV (CSV button) to quickly bulk-enrol an entire class — you don't need to add students one by one.</HelpTip>
      </HelpPanel>
    </div>
  );
}

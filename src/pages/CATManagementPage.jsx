import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudents, getLearningAreas, getExamSessions, createExamSession, updateExamSessionStatus, deleteExamSession, getLearningAreasWithSubAreas, createSubLearningArea, deleteSubLearningArea } from '../utils/api.js';

export default function CATManagementPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role');

  const [classes, setClasses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('Term 1');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // New session form
  const [form, setForm] = useState({ class_id: '', term: 'Term 1', academic_year: new Date().getFullYear(), exam_name: '', exam_type: 'CAT 1', open_date: '', close_date: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  // New sub-area form
  const [subForm, setSubForm] = useState({ area_id: '', sub_area_name: '' });
  const [creatingSub, setCreatingSub] = useState(false);

  useEffect(() => {
    if (role !== 'head') { navigate('/home', { replace: true }); return; }
    if (!teacherId) { navigate('/teacher/login', { replace: true }); return; }
  }, [role, teacherId, navigate]);

  // Load classes
  useEffect(() => {
    if (!teacherId) return;
    fetchStudents(teacherId).then(data => {
      const list = data.students || [];
      const classMap = {};
      list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
      setClasses(Object.entries(classMap).map(([id, name]) => ({ value: id, label: name })));
    }).catch(() => {});
  }, [teacherId]);

  // Load learning areas
  useEffect(() => {
    if (!schoolId) return;
    getLearningAreas(schoolId, '').then(d => setAreas(d.areas || [])).catch(() => {});
    loadSubAreas();
  }, [schoolId]);

  // Load sessions
  const loadSessions = () => {
    if (!schoolId) return;
    getExamSessions({ school_id: schoolId, class_id: filterClass || undefined, term: filterTerm, year: filterYear })
      .then(d => setSessions(d.sessions || [])).catch(() => {});
  };
  useEffect(() => { loadSessions(); }, [schoolId, filterClass, filterTerm, filterYear]);

  const loadSubAreas = () => {
    if (!schoolId) return;
    getLearningAreasWithSubAreas(schoolId).then(d => setSubAreas(d.sub_areas || [])).catch(() => {});
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.exam_name) return;
    setCreating(true);
    try {
      await createExamSession({ ...form, school_id: schoolId, created_by: teacherId });
      setForm({ ...form, exam_name: '', open_date: '', close_date: '' });
      loadSessions();
      setMsg('CAT session created');
    } catch (err) { setMsg('Failed: ' + err.message); }
    setCreating(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const next = currentStatus === 'Open' ? 'Closed' : currentStatus === 'Scheduled' ? 'Open' : 'Scheduled';
    try {
      await updateExamSessionStatus(id, next);
      loadSessions();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this CAT session and all its results?')) return;
    try {
      await deleteExamSession(id);
      loadSessions();
    } catch (err) { alert(err.message); }
  };

  const handleCreateSubArea = async (e) => {
    e.preventDefault();
    if (!subForm.area_id || !subForm.sub_area_name) return;
    setCreatingSub(true);
    try {
      await createSubLearningArea(subForm);
      setSubForm({ area_id: '', sub_area_name: '' });
      loadSubAreas();
      setMsg('Sub-learning area created');
    } catch (err) { setMsg('Failed: ' + err.message); }
    setCreatingSub(false);
  };

  const handleDeleteSubArea = async (id) => {
    if (!window.confirm('Delete this sub-learning area?')) return;
    try {
      await deleteSubLearningArea(id);
      loadSubAreas();
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>CAT Sessions Manager</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* ─── Create Session ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#1a1a6c' }}>Create New CAT Session</h2>
          <form onSubmit={handleCreateSession} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} className="input-field text-sm" required>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} className="input-field text-sm">
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
              <input type="number" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} className="input-field text-sm" placeholder="Year" />
              <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })} className="input-field text-sm">
                <option>CAT 1</option><option>CAT 2</option><option>CAT 3</option><option>Mid Term</option><option>End Term</option><option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} className="input-field text-sm" placeholder="Session name (e.g. CAT 1 2026)" required />
              <input type="date" value={form.open_date} onChange={e => setForm({ ...form, open_date: e.target.value })} className="input-field text-sm" placeholder="Open date" />
              <input type="date" value={form.close_date} onChange={e => setForm({ ...form, close_date: e.target.value })} className="input-field text-sm" placeholder="Close date" />
            </div>
            <button type="submit" disabled={creating} className="btn-primary !w-auto px-6 !py-2 !text-sm">{creating ? 'Creating...' : 'Create Session'}</button>
          </form>
        </div>

        {/* ─── Existing Sessions ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#1a1a6c' }}>Existing Sessions</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input-field text-sm">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="input-field text-sm">
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
            <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} className="input-field text-sm" />
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs" style={{ color: '#888' }}>No sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.session_id} className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid #E0E0E0' }}>
                  <div className="flex-1">
                    <span className="font-bold text-sm">{s.exam_type}: {s.exam_name}</span>
                    <span className="text-xs ml-2" style={{ color: '#888' }}>{s.term} {s.academic_year}</span>
                    <div className="text-xs" style={{ color: '#999' }}>
                      {s.open_date ? `Open: ${s.open_date}` : ''}{s.close_date ? ` | Close: ${s.close_date}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      s.status === 'Open' ? 'bg-green-100 text-green-700' :
                      s.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{s.status}</span>
                    <button
                      onClick={() => handleToggleStatus(s.session_id, s.status)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ border: '1px solid #ccc', background: '#fff' }}
                    >
                      {s.status === 'Open' ? 'Close' : s.status === 'Scheduled' ? 'Open' : 'Reopen'}
                    </button>
                    <button
                      onClick={() => handleDelete(s.session_id)}
                      className="text-xs px-2 py-1 rounded text-red-600"
                      style={{ border: '1px solid #fca5a5', background: '#fff' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sub-Learning Areas ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#1a1a6c' }}>Sub-Learning Areas</h2>
          <p className="text-xs mb-3" style={{ color: '#888' }}>Sub-learning areas break a subject into assessable parts (e.g. English = Language, Composition, Reading).</p>

          <form onSubmit={handleCreateSubArea} className="flex gap-2 mb-4">
            <select value={subForm.area_id} onChange={e => setSubForm({ ...subForm, area_id: e.target.value })} className="input-field text-sm flex-1" required>
              <option value="">Select Learning Area</option>
              {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
            </select>
            <input type="text" value={subForm.sub_area_name} onChange={e => setSubForm({ ...subForm, sub_area_name: e.target.value })} className="input-field text-sm flex-1" placeholder="e.g. Language" required />
            <button type="submit" disabled={creatingSub} className="btn-primary !w-auto px-4 !py-1 !text-xs">{creatingSub ? '...' : 'Add'}</button>
          </form>

          {areas.length > 0 ? areas.map(area => {
            const areaSubs = subAreas.filter(sa => sa.area_id === area.area_id);
            if (areaSubs.length === 0) return null;
            return (
              <div key={area.area_id} className="mb-3">
                <h3 className="text-sm font-bold mb-1" style={{ color: '#1a1a6c' }}>{area.area_name}</h3>
                <div className="flex flex-wrap gap-2">
                  {areaSubs.map(sa => (
                    <span key={sa.sub_area_id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
                      {sa.sub_area_name}
                      <button onClick={() => handleDeleteSubArea(sa.sub_area_id)} className="text-red-500 hover:text-red-700" style={{ lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            );
          }) : <p className="text-xs" style={{ color: '#888' }}>No learning areas configured. Add them first.</p>}
        </div>

        {msg && (
          <div className="text-sm text-center py-2 rounded-lg" style={{
            backgroundColor: msg.includes('Failed') ? '#FFEBEE' : '#E8F5E9',
            color: msg.includes('Failed') ? '#C62828' : '#2E7D32'
          }}>{msg}</div>
        )}
      </div>
    </div>
  );
}

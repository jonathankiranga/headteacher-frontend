import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearningAreas, getExamSessions, createExamSession, updateExamSessionStatus, deleteExamSession, getLearningAreasWithSubAreas, createSubLearningArea, deleteSubLearningArea, getClasses, createLearningArea, updateLearningArea, deleteLearningArea } from '../utils/api.js';
import api from '../utils/api.js';

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
  const [subForm, setSubForm] = useState({ area_id: '', sub_area_name: '', display_order: '' });
  const [creatingSub, setCreatingSub] = useState(false);
  // Inline editing state for sub-areas
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubOrder, setEditSubOrder] = useState('');

  // ── Subjects (learning areas) CRUD ──────────────────────────────
  const [subjectForm, setSubjectForm] = useState({ area_name: '', level_name: '' });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaLevel, setEditAreaLevel] = useState('');

  useEffect(() => {
    if (role !== 'head') { navigate('/home', { replace: true }); return; }
    if (!teacherId) { navigate('/teacher/login', { replace: true }); return; }
  }, [role, teacherId, navigate]);

  // Load classes
  useEffect(() => {
    if (!schoolId) return;
    getClasses(schoolId).then(d => {
      setClasses((d.classes || []).map(c => ({ value: c.class_id, label: c.class_name })));
    }).catch(() => {});
  }, [schoolId]);

  // Load learning areas
  useEffect(() => {
    if (!schoolId) return;
    getLearningAreas(schoolId, '').then(d => setAreas(d.areas || [])).catch(() => {});
    loadSubAreas();
  }, [schoolId]);

  const loadAreas = () => {
    if (!schoolId) return;
    getLearningAreas(schoolId, '').then(d => setAreas(d.areas || [])).catch(() => {});
  };

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
      await createSubLearningArea({
        area_id: subForm.area_id,
        sub_area_name: subForm.sub_area_name,
        display_order: subForm.display_order ? parseInt(subForm.display_order) : 0
      });
      setSubForm({ area_id: subForm.area_id, sub_area_name: '', display_order: '' });
      loadSubAreas();
      setMsg('Sub-learning area added');
    } catch (err) { setMsg('Failed: ' + err.message); }
    setCreatingSub(false);
  };

  const handleDeleteSubArea = async (id) => {
    if (!window.confirm('Delete this sub-learning area? This will also remove any exam results recorded against it.')) return;
    try {
      await deleteSubLearningArea(id);
      loadSubAreas();
    } catch (err) { alert(err.message); }
  };

  const startEditSub = (sa) => {
    setEditingSubId(sa.sub_area_id);
    setEditSubName(sa.sub_area_name);
    setEditSubOrder(sa.display_order ?? '');
  };

  const handleSaveEditSub = async (id) => {
    if (!editSubName.trim()) return;
    try {
      await api.put(`/api/exam-sessions/sub-learning-areas/${id}`, {
        sub_area_name: editSubName.trim(),
        display_order: editSubOrder !== '' ? parseInt(editSubOrder) : undefined
      });
      setEditingSubId(null);
      loadSubAreas();
      setMsg('Sub-area updated');
    } catch (err) { setMsg('Failed: ' + err.message); }
  };

  // ── Subjects handlers ────────────────────────────────────────────
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.area_name.trim()) return;
    setCreatingSubject(true);
    try {
      await createLearningArea({
        school_id: schoolId,
        area_name: subjectForm.area_name.trim(),
        level_name: subjectForm.level_name.trim() || null,
        teacher_id: teacherId
      });
      setSubjectForm({ area_name: '', level_name: '' });
      loadAreas();
      setMsg('Subject added');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
    setCreatingSubject(false);
  };

  const startEditArea = (area) => {
    setEditingAreaId(area.area_id);
    setEditAreaName(area.area_name);
    setEditAreaLevel(area.level_name || '');
  };

  const handleSaveEditArea = async (id) => {
    if (!editAreaName.trim()) return;
    try {
      await updateLearningArea(id, {
        area_name: editAreaName.trim(),
        level_name: editAreaLevel.trim() || null,
        teacher_id: teacherId
      });
      setEditingAreaId(null);
      loadAreas();
      setMsg('Subject updated');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
  };

  const handleDeleteArea = async (area) => {
    if (!window.confirm(`Delete subject "${area.area_name}"?`)) return;
    try {
      await deleteLearningArea(area.area_id, teacherId);
      loadAreas();
      setMsg(`"${area.area_name}" deleted`);
    } catch (err) {
      const d = err.response?.data;
      if (d?.error === 'in_use') {
        setMsg(`Cannot delete: ${d.message}`);
      } else {
        setMsg('Failed: ' + (d?.error || err.message));
      }
    }
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

        {/* ─── Subjects (Learning Areas) ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-1" style={{ color: '#1a1a6c' }}>Subjects (Learning Areas)</h2>
          <p className="text-xs mb-3" style={{ color: '#888' }}>
            Each subject (e.g. English, Mathematics) can be broken into sub-areas for CAT scoring or strands for formative assessment.
            Deleting is blocked if the subject has results linked to it.
          </p>

          {/* Add form */}
          <form onSubmit={handleCreateSubject} className="flex gap-2 mb-4 flex-wrap">
            <input
              type="text" value={subjectForm.area_name}
              onChange={e => setSubjectForm(f => ({ ...f, area_name: e.target.value }))}
              className="input-field text-sm" style={{ flex: '2 1 160px', minWidth: 0 }}
              placeholder="Subject name (e.g. English)" required
            />
            <input
              type="text" value={subjectForm.level_name}
              onChange={e => setSubjectForm(f => ({ ...f, level_name: e.target.value }))}
              className="input-field text-sm" style={{ flex: '1 1 120px', minWidth: 0 }}
              placeholder="Grade level (e.g. Grade 4)"
            />
            <button type="submit" disabled={creatingSubject}
              className="btn-primary !w-auto px-4 !py-2 !text-sm" style={{ flexShrink: 0 }}>
              {creatingSubject ? '...' : '+ Add'}
            </button>
          </form>

          {/* List */}
          {areas.length === 0 ? (
            <p className="text-xs" style={{ color: '#bbb' }}>No subjects yet. Add one above.</p>
          ) : (
            <div className="space-y-1">
              {areas.map(area => (
                <div key={area.area_id} className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA' }}>
                  {editingAreaId === area.area_id ? (
                    <>
                      <input
                        type="text" value={editAreaName}
                        onChange={e => setEditAreaName(e.target.value)}
                        className="input-field text-sm" style={{ flex: 2, padding: '4px 8px' }}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEditArea(area.area_id); if (e.key === 'Escape') setEditingAreaId(null); }}
                      />
                      <input
                        type="text" value={editAreaLevel}
                        onChange={e => setEditAreaLevel(e.target.value)}
                        className="input-field text-sm" style={{ flex: 1, padding: '4px 8px' }}
                        placeholder="Grade level"
                      />
                      <button onClick={() => handleSaveEditArea(area.area_id)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#7B4F9B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingAreaId(null)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#333', flex: 1 }}>{area.area_name}</span>
                      {area.level_name && (
                        <span style={{ fontSize: 11, color: '#7B4F9B', backgroundColor: '#F3E7FA', padding: '2px 8px', borderRadius: 10 }}>
                          {area.level_name}
                        </span>
                      )}
                      <button onClick={() => startEditArea(area)}
                        style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#555', fontSize: 11, cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteArea(area)}
                        style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5', color: '#C62828', fontSize: 11, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sub-Learning Areas ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-1" style={{ color: '#1a1a6c' }}>Sub-Learning Areas</h2>
          <p className="text-xs mb-3" style={{ color: '#888' }}>
            Break each subject into assessable parts (e.g. English → Language, Composition, Reading).
            Use "Order" to control how sub-areas appear in the score entry table.
          </p>

          {/* Add form */}
          <form onSubmit={handleCreateSubArea} className="flex gap-2 mb-5 flex-wrap">
            <select value={subForm.area_id} onChange={e => setSubForm({ ...subForm, area_id: e.target.value })}
              className="input-field text-sm" style={{ flex: '1 1 140px', minWidth: 0 }} required>
              <option value="">Select Subject</option>
              {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
            </select>
            <input type="text" value={subForm.sub_area_name} onChange={e => setSubForm({ ...subForm, sub_area_name: e.target.value })}
              className="input-field text-sm" style={{ flex: '2 1 160px', minWidth: 0 }} placeholder="Sub-area name (e.g. Language)" required />
            <input type="number" min="0" value={subForm.display_order} onChange={e => setSubForm({ ...subForm, display_order: e.target.value })}
              className="input-field text-sm" style={{ flex: '0 0 72px' }} placeholder="Order" title="Display order (lower = first)" />
            <button type="submit" disabled={creatingSub}
              className="btn-primary !w-auto px-4 !py-2 !text-sm" style={{ flexShrink: 0 }}>
              {creatingSub ? '...' : '+ Add'}
            </button>
          </form>

          {/* List grouped by area */}
          {areas.length === 0 ? (
            <p className="text-xs" style={{ color: '#888' }}>No learning areas configured yet.</p>
          ) : areas.map(area => {
            const areaSubs = [...subAreas.filter(sa => sa.area_id === area.area_id)]
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
            return (
              <div key={area.area_id} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#7B4F9B' }}>
                  {area.area_name}
                  <span className="ml-2 font-normal text-gray-400">({areaSubs.length} sub-area{areaSubs.length !== 1 ? 's' : ''})</span>
                </h3>
                {areaSubs.length === 0 ? (
                  <p className="text-xs" style={{ color: '#bbb' }}>No sub-areas yet.</p>
                ) : (
                  <div className="space-y-1">
                    {areaSubs.map(sa => (
                      <div key={sa.sub_area_id} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA' }}>
                        {editingSubId === sa.sub_area_id ? (
                          <>
                            <input
                              type="text" value={editSubName} onChange={e => setEditSubName(e.target.value)}
                              className="input-field text-sm" style={{ flex: 1, padding: '4px 8px' }}
                              autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveEditSub(sa.sub_area_id); if (e.key === 'Escape') setEditingSubId(null); }}
                            />
                            <input
                              type="number" min="0" value={editSubOrder} onChange={e => setEditSubOrder(e.target.value)}
                              className="input-field text-sm" style={{ width: 64, padding: '4px 6px' }} placeholder="Order"
                            />
                            <button onClick={() => handleSaveEditSub(sa.sub_area_id)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#7B4F9B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Save
                            </button>
                            <button onClick={() => setEditingSubId(null)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 12, color: '#444', flex: 1 }}>{sa.sub_area_name}</span>
                            {sa.display_order != null && (
                              <span style={{ fontSize: 10, color: '#BBB', minWidth: 40 }}>#{sa.display_order}</span>
                            )}
                            <button onClick={() => startEditSub(sa)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#555', fontSize: 11, cursor: 'pointer' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteSubArea(sa.sub_area_id)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5', color: '#C62828', fontSize: 11, cursor: 'pointer' }}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

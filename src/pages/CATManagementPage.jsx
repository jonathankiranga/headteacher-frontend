import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearningAreas, getLearningAreasByClass, getExamSessions, createExamSession, updateExamSessionStatus, deleteExamSession, getLearningAreasWithSubAreas, createStrand, updateStrand, deleteStrand, createSubStrand, updateSubStrand, deleteSubStrand, getClasses, createLearningArea, updateLearningArea, deleteLearningArea } from '../utils/api.js';
import api from '../utils/api.js';
import HelpPanel, { HelpSection, HelpStep, HelpTip } from '../components/HelpPanel.jsx';

export default function CATManagementPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role');

  const [classes, setClasses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [strandTree, setStrandTree] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // New session form
  const [form, setForm] = useState({ class_id: '', term: 'Term 1', academic_year: new Date().getFullYear(), exam_name: '', exam_type: 'CAT 1', open_date: '', close_date: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  // New strand form
  const [strandForm, setStrandForm] = useState({ area_id: '', strand_name: '', term: 'Term 1' });
  const [creatingStrand, setCreatingStrand] = useState(false);

  // New sub-strand form
  const [subStrandForm, setSubStrandForm] = useState({ area_id: '', strand_id: '', sub_strand_name: '' });
  const [creatingSubStrand, setCreatingSubStrand] = useState(false);

  // Inline edit state for strands + sub-strands
  const [editingStrandId, setEditingStrandId] = useState(null);
  const [editStrandName, setEditStrandName] = useState('');
  const [editStrandTerm, setEditStrandTerm] = useState('Term 1');
  const [editingSubStrandId, setEditingSubStrandId] = useState(null);
  const [editSubStrandName, setEditSubStrandName] = useState('');

  // ── Subjects (learning areas) CRUD ──────────────────────────────
  const [subjectForm, setSubjectForm] = useState({ area_name: '', level_name: '' });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaLevel, setEditAreaLevel] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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
    if (filterClass) {
      getLearningAreasByClass(schoolId, filterClass).then(d => setAreas(d.areas || [])).catch(() => {});
    } else {
      setAreas([]);
    }
    loadStrandTree();
  }, [schoolId, filterClass]);

  const loadAreas = () => {
    if (!schoolId) return;
    if (filterClass) {
      getLearningAreasByClass(schoolId, filterClass).then(d => setAreas(d.areas || [])).catch(() => {});
    } else {
      setAreas([]);
    }
  };

  // Load sessions
  const loadSessions = () => {
    if (!schoolId) return;
    getExamSessions({ school_id: schoolId, class_id: filterClass || undefined, term: filterTerm, year: filterYear })
      .then(d => setSessions(d.sessions || [])).catch(() => {});
  };
  useEffect(() => { loadSessions(); }, [schoolId, filterClass, filterTerm, filterYear]);

  // Load the KICD strand tree for the filtered class level
  const loadStrandTree = () => {
    if (!schoolId) return;
    if (filterClass) {
      getLearningAreasWithSubAreas(schoolId, filterClass).then(d => {
        setStrandTree((d.areas || [])
          .map(a => ({ ...a, strands: (a.strands || []).filter(s => (s.sub_strands || []).length > 0) }))
          .filter(a => a.strands.length > 0));
      }).catch(() => {});
    } else {
      setStrandTree([]);
    }
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

  // ── Strand handlers ────────────────────────────────────────────
  const handleCreateStrand = async (e) => {
    e.preventDefault();
    if (!strandForm.area_id || !strandForm.strand_name.trim()) return;
    setCreatingStrand(true);
    try {
      await createStrand({
        area_id: strandForm.area_id,
        strand_name: strandForm.strand_name.trim(),
        term: strandForm.term,
        teacher_id: teacherId
      });
      setStrandForm({ area_id: strandForm.area_id, strand_name: '', term: strandForm.term });
      loadStrandTree();
      setMsg('Strand added');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
    setCreatingStrand(false);
  };

  const startEditStrand = (st) => {
    setEditingStrandId(st.strand_id);
    setEditStrandName(st.strand_name);
    setEditStrandTerm(st.term || 'Term 1');
  };

  const handleSaveEditStrand = async (id) => {
    if (!editStrandName.trim()) return;
    try {
      await updateStrand(id, { strand_name: editStrandName.trim(), term: editStrandTerm, teacher_id: teacherId });
      setEditingStrandId(null);
      loadStrandTree();
      setMsg('Strand updated');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
  };

  const handleDeleteStrand = async (st) => {
    if (!window.confirm(`Delete strand "${st.strand_name}" and all its sub-strands?`)) return;
    try {
      await deleteStrand(st.strand_id, teacherId);
      loadStrandTree();
      setMsg(`Strand "${st.strand_name}" deleted`);
    } catch (err) {
      const d = err.response?.data;
      setMsg(d?.message || ('Failed: ' + (d?.error || err.message)));
    }
  };

  // ── Sub-strand handlers ────────────────────────────────────────
  const selectableStrands = strandTree
    .flatMap(a => (a.strands || []).map(st => ({ ...st, area_id: a.area_id })))
    .filter(st => !subStrandForm.area_id || String(st.area_id) === String(subStrandForm.area_id));

  const handleCreateSubStrand = async (e) => {
    e.preventDefault();
    if (!subStrandForm.strand_id || !subStrandForm.sub_strand_name.trim()) return;
    setCreatingSubStrand(true);
    try {
      await createSubStrand({
        strand_id: subStrandForm.strand_id,
        sub_strand_name: subStrandForm.sub_strand_name.trim(),
        teacher_id: teacherId
      });
      setSubStrandForm({ area_id: subStrandForm.area_id, strand_id: '', sub_strand_name: '' });
      loadStrandTree();
      setMsg('Sub-strand added');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
    setCreatingSubStrand(false);
  };

  const startEditSubStrand = (ss) => {
    setEditingSubStrandId(ss.sub_strand_id);
    setEditSubStrandName(ss.sub_strand_name);
  };

  const handleSaveEditSubStrand = async (id) => {
    if (!editSubStrandName.trim()) return;
    try {
      await updateSubStrand(id, { sub_strand_name: editSubStrandName.trim(), teacher_id: teacherId });
      setEditingSubStrandId(null);
      loadStrandTree();
      setMsg('Sub-strand updated');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
  };

  const handleDeleteSubStrand = async (ss) => {
    if (!window.confirm(`Delete sub-strand "${ss.sub_strand_name}"?`)) return;
    try {
      await deleteSubStrand(ss.sub_strand_id, teacherId);
      loadStrandTree();
      setMsg(`Sub-strand "${ss.sub_strand_name}" deleted`);
    } catch (err) {
      const d = err.response?.data;
      setMsg(d?.message || ('Failed: ' + (d?.error || err.message)));
    }
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
      loadStrandTree();
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
      loadStrandTree();
      setMsg('Subject updated');
    } catch (err) { setMsg('Failed: ' + (err.response?.data?.error || err.message)); }
  };

  const handleDeleteArea = async (area) => {
    if (!window.confirm(`Delete subject "${area.area_name}"?`)) return;
    try {
      await deleteLearningArea(area.area_id, teacherId);
      loadAreas();
      loadStrandTree();
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
          <button onClick={() => setShowHelp(true)} className="btn-ghost text-sm" aria-label="Help">❓</button>
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
              <option value="">All Classes (choose Grade for strands)</option>
              {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="input-field text-sm">
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="input-field text-sm">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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
            Each subject (e.g. English, Mathematics) is broken into KICD Strands, then Sub-strands — the same ladder used for lesson plans and CAT scoring.
            Deleting is blocked if the subject has results linked to it.
          </p>

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

          {areas.length === 0 ? (
            <p className="text-xs" style={{ color: '#bbb' }}>No subjects yet for the selected grade. Add one above.</p>
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

        {/* ─── Strands (KICD) ─── */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-1" style={{ color: '#1a1a6c' }}>Strands &amp; Sub-strands (KICD)</h2>
          <p className="text-xs mb-3" style={{ color: '#888' }}>
            Learning Area → Strand → Sub-strand. Pick a <strong>Grade</strong> above (or in the session filter) to manage this grade's strands.
            Strands appear in the CAT score grid and lesson plans.
          </p>

          {/* Add strand form */}
          <form onSubmit={handleCreateStrand} className="flex gap-2 mb-5 flex-wrap">
            <select value={strandForm.area_id} onChange={e => setStrandForm({ ...strandForm, area_id: e.target.value })}
              className="input-field text-sm" style={{ flex: '1 1 140px', minWidth: 0 }} required>
              <option value="">Select Subject</option>
              {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
            </select>
            <input type="text" value={strandForm.strand_name} onChange={e => setStrandForm({ ...strandForm, strand_name: e.target.value })}
              className="input-field text-sm" style={{ flex: '2 1 160px', minWidth: 0 }} placeholder="Strand name (e.g. Reading)" required />
            <select value={strandForm.term} onChange={e => setStrandForm({ ...strandForm, term: e.target.value })}
              className="input-field text-sm" style={{ flex: '0 1 110px' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
            <button type="submit" disabled={creatingStrand}
              className="btn-primary !w-auto px-4 !py-2 !text-sm" style={{ flexShrink: 0 }}>
              {creatingStrand ? '...' : '+ Add Strand'}
            </button>
          </form>

          {/* Add sub-strand form */}
          <form onSubmit={handleCreateSubStrand} className="flex gap-2 mb-5 flex-wrap">
            <select value={subStrandForm.area_id} onChange={e => setSubStrandForm({ area_id: e.target.value, strand_id: '' })}
              className="input-field text-sm" style={{ flex: '1 1 140px', minWidth: 0 }}>
              <option value="">All Subjects</option>
              {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
            </select>
            <select value={subStrandForm.strand_id} onChange={e => setSubStrandForm({ ...subStrandForm, strand_id: e.target.value })}
              className="input-field text-sm" style={{ flex: '1 1 160px', minWidth: 0 }} required>
              <option value="">Select Strand</option>
              {selectableStrands.map(st => <option key={st.strand_id} value={st.strand_id}>{st.strand_name}</option>)}
            </select>
            <input type="text" value={subStrandForm.sub_strand_name} onChange={e => setSubStrandForm({ ...subStrandForm, sub_strand_name: e.target.value })}
              className="input-field text-sm" style={{ flex: '1 1 140px', minWidth: 0 }} placeholder="Sub-strand name" required />
            <button type="submit" disabled={creatingSubStrand}
              className="btn-primary !w-auto px-4 !py-2 !text-sm" style={{ flexShrink: 0 }}>
              {creatingSubStrand ? '...' : '+ Add Sub-strand'}
            </button>
          </form>

          {/* Tree grouped by subject → strand → sub-strand */}
          {strandTree.length === 0 ? (
            <p className="text-xs" style={{ color: '#888' }}>
              No strands for the selected grade. Add a strand above, or pick a grade in the session filter.
            </p>
          ) : strandTree.map(area => (
            <div key={area.area_id} className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#7B4F9B' }}>
                {area.area_name}
                <span className="ml-2 font-normal text-gray-400">
                  ({area.strands.length} strand{area.strands.length !== 1 ? 's' : ''} · {area.strands.reduce((n, s) => n + (s.sub_strands || []).length, 0)} sub-strand{area.strands.reduce((n, s) => n + (s.sub_strands || []).length, 0) !== 1 ? 's' : ''})
                </span>
              </h3>
              {area.strands.length === 0 ? (
                <p className="text-xs" style={{ color: '#bbb' }}>No strands yet for this subject.</p>
              ) : (
                <div className="space-y-2">
                  {area.strands.map(st => (
                    <div key={st.strand_id} style={{ border: '1px solid #EEEEEE', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8 }}>
                      <div className="flex items-center gap-2">
                        {editingStrandId === st.strand_id ? (
                          <>
                            <input type="text" value={editStrandName} onChange={e => setEditStrandName(e.target.value)}
                              className="input-field text-sm" style={{ flex: 1, padding: '4px 8px', fontWeight: 600 }}
                              autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveEditStrand(st.strand_id); if (e.key === 'Escape') setEditingStrandId(null); }} />
                            <select value={editStrandTerm} onChange={e => setEditStrandTerm(e.target.value)} className="input-field text-sm" style={{ width: 110, padding: '4px 6px' }}>
                              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                            </select>
                            <button onClick={() => handleSaveEditStrand(st.strand_id)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#7B4F9B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                            <button onClick={() => setEditingStrandId(null)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#333', flex: 1 }}>{st.strand_name}</span>
                            {st.term && (
                              <span style={{ fontSize: 10, color: '#7B4F9B', backgroundColor: '#F3E7FA', padding: '2px 8px', borderRadius: 10 }}>{st.term}</span>
                            )}
                            <button onClick={() => startEditStrand(st)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#555', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDeleteStrand(st)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5', color: '#C62828', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                          </>
                        )}
                      </div>
                      {(st.sub_strands || []).length === 0 ? (
                        <p className="text-xs mt-2" style={{ color: '#bbb' }}>No sub-strands yet.</p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {st.sub_strands.map(ss => (
                            <div key={ss.sub_strand_id} className="flex items-center gap-2 pl-3 py-1"
                              style={{ borderLeft: '2px solid #E9D8F5' }}>
                              {editingSubStrandId === ss.sub_strand_id ? (
                                <>
                                  <input type="text" value={editSubStrandName} onChange={e => setEditSubStrandName(e.target.value)}
                                    className="input-field text-sm" style={{ flex: 1, padding: '3px 8px' }}
                                    autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveEditSubStrand(ss.sub_strand_id); if (e.key === 'Escape') setEditingSubStrandId(null); }} />
                                  <button onClick={() => handleSaveEditSubStrand(ss.sub_strand_id)}
                                    style={{ padding: '3px 10px', borderRadius: 6, border: 'none', backgroundColor: '#7B4F9B', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                  <button onClick={() => setEditingSubStrandId(null)}
                                    style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#666', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: 12, color: '#444', flex: 1 }}>{ss.sub_strand_name}</span>
                                  <button onClick={() => startEditSubStrand(ss)}
                                    style={{ padding: '2px 9px', borderRadius: 6, border: '1px solid #DDD', backgroundColor: '#fff', color: '#555', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => handleDeleteSubStrand(ss)}
                                    style={{ padding: '2px 9px', borderRadius: 6, border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5', color: '#C62828', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {msg && (
          <div className="text-sm text-center py-2 rounded-lg" style={{
            backgroundColor: msg.includes('Failed') || msg.includes('Cannot') ? '#FFEBEE' : '#E8F5E9',
            color: msg.includes('Failed') || msg.includes('Cannot') ? '#C62828' : '#2E7D32'
          }}>{msg}</div>
        )}
      </div>

      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} title="CAT Sessions Manager — Help">
        <HelpSection icon="🗂️" title="What is this screen?">
          This is the headteacher's control centre for assessments. Before teachers can
          enter CAT scores, this screen must be set up. It has three sections:
          <strong> Sessions</strong>, <strong>Subjects</strong>, and
          <strong> Strands (KICD)</strong>.
        </HelpSection>
        <HelpSection icon="📅" title="Sessions">
          A session is one instance of an assessment (e.g. "CAT 1 Term 1 2026" for
          Grade 4). Creating a session opens it for teachers to enter scores.
          <HelpStep n={1}>Select the <strong>Class, Term, Year</strong>, and <strong>Type</strong> (CAT 1, Mid Term, End Term, etc.).</HelpStep>
          <HelpStep n={2}>Give it a descriptive <strong>name</strong> and optional open/close dates.</HelpStep>
          <HelpStep n={3}>Tap <strong>Create Session</strong>. The session starts as <em>Scheduled</em>.</HelpStep>
          <HelpStep n={4}>Toggle it to <strong>Open</strong> when teachers should start entering scores. Set it to <strong>Closed</strong> when done — this locks results and triggers parent notifications.</HelpStep>
        </HelpSection>
        <HelpSection icon="📚" title="Subjects (Learning Areas)">
          Subjects are the top-level learning areas (e.g. English, Mathematics, Science
          and Technology). Add all subjects taught at your school here. You can
          optionally tag each subject with a grade level.
        </HelpSection>
        <HelpSection icon="🧬" title="Strands & Sub-strands (KICD)">
          Following the KICD curriculum, each subject is divided into
          <strong> Strands</strong> (e.g. English → Reading) and each strand into
          <strong> Sub-strands</strong> (e.g. Reading → Comprehension). These appear as
          the score columns in the CAT grid and as the drill-down in lesson plans.
          Pick a grade in the session filter to manage that grade's strands.
        </HelpSection>
        <HelpTip>Strands are seeded automatically from the KICD catalog when a school is set up. You can add, rename, or delete strands here anytime.</HelpTip>
      </HelpPanel>
    </div>
  );
}
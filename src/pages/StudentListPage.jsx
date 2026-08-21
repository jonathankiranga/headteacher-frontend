import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function StudentFormModal({ schoolId, student, classes, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: student?.full_name || '',
    class_id: student?.class_id || '',
    gender: student?.gender || '',
    date_of_birth: student?.date_of_birth || '',
    admission_number: student?.admission_number || '',
    admission_date: student?.admission_date || '',
    guardian_name: student?.guardian_name || '',
    guardian_phone: student?.guardian_phone || '',
    guardian_relationship: student?.guardian_relationship || '',
    address: student?.address || '',
    religion: student?.religion || '',
    nationality: student?.nationality || '',
    medical_notes: student?.medical_notes || '',
    special_needs: student?.special_needs || '',
    previous_school: student?.previous_school || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (student) {
        await api.put(`/api/school-head/${schoolId}/students/${student.student_id}`, form);
      } else {
        await api.post(`/api/school-head/${schoolId}/students`, form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>{student ? 'Edit Student' : 'New Student'}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#888' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Class *</label>
              <select name="class_id" value={form.class_id} onChange={handleChange} className="input-field" required>
                <option value="">— Select —</option>
                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Date of Birth</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Admission Number</label>
              <input name="admission_number" value={form.admission_number} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Admission Date</label>
              <input name="admission_date" type="date" value={form.admission_date} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Religion</label>
              <input name="religion" value={form.religion} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Nationality</label>
              <input name="nationality" value={form.nationality} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Previous School</label>
              <input name="previous_school" value={form.previous_school} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#555' }}>Guardian / Parent</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Name</label>
                <input name="guardian_name" value={form.guardian_name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Phone</label>
                <input name="guardian_phone" value={form.guardian_phone} onChange={handleChange} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Relationship</label>
                <input name="guardian_relationship" value={form.guardian_relationship} onChange={handleChange} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Address</label>
                <input name="address" value={form.address} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>
          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#555' }}>Medical</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Medical Notes</label>
                <textarea name="medical_notes" value={form.medical_notes} onChange={handleChange} className="input-field" rows={2} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Special Needs</label>
                <textarea name="special_needs" value={form.special_needs} onChange={handleChange} className="input-field" rows={2} />
              </div>
            </div>
          </div>
          {error && <p className="text-xs" style={{ color: '#C62828' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>
              {saving ? 'Saving...' : student ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CsvImportModal({ schoolId, classes, onClose, onAdded }) {
  const [classId, setClassId] = useState('');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target.result);
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
          <p className="text-xs mb-1" style={{ color: '#888' }}>Format: <code>student_id,full_name,gender,date_of_birth,guardian_name,guardian_phone</code> — only full_name required</p>
          <input type="file" accept=".csv" onChange={handleFile} className="input-field" style={{ padding: '8px 12px', fontSize: 13 }} />
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

export default function StudentListPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!schoolId) return;
    api.get(`/api/fees/classes?school_id=${schoolId}`)
      .then(c => setClasses(c.data.classes || []))
      .catch(() => {});
    loadStudents();
  }, [schoolId]);

  function loadStudents() {
    setLoading(true);
    api.get(`/api/school-head/${schoolId}/students`)
      .then(s => setStudents(s.data.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const filtered = students.filter(s => {
    if (classFilter && String(s.class_id) !== String(classFilter)) return false;
    if (search && !s.full_name.toLowerCase().includes(search.toLowerCase()) && !s.student_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.student_id)));
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this student? This cannot be undone.')) return;
    await api.delete(`/api/school-head/${schoolId}/students/${id}`).catch(() => {});
    setStudents(students.filter(s => s.student_id !== id));
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="sticky top-0 z-40" style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base font-bold" style={{ color: '#333' }}>Students</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowCsv(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(46,125,50,0.08)', color: '#2E7D32' }}>Import CSV</button>
              <button onClick={() => { setEditStudent(null); setShowForm(true); }} className="btn-secondary text-sm">+ Add</button>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or ID..." className="input-field flex-1" />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field text-sm" style={{ maxWidth: 180 }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-card p-12 text-center border border-gray-200">
            <p className="text-sm" style={{ color: '#888' }}>No students found.</p>
          </div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded-card border">
                <span className="text-xs font-medium" style={{ color: '#666' }}>{selected.size} selected</span>
                <button onClick={() => navigate('/promotion', { state: { studentIds: [...selected], classId: classFilter } })}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Promote</button>
                <button onClick={() => { setSelected(new Set()); }} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#888' }}>Clear</button>
              </div>
            )}
            <div className="bg-white rounded-card overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="px-3 py-3 w-8">
                      <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={selectAll} />
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>ID</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Name</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold uppercase hidden sm:table-cell" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Class</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold uppercase hidden sm:table-cell" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Gender</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.student_id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.has(s.student_id)} onChange={() => toggleSelect(s.student_id)} />
                      </td>
                      <td className="px-3 py-3 text-xs font-mono" style={{ color: '#888' }}>{s.student_id}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => { setEditStudent(s); setShowForm(true); }} className="text-sm font-medium text-left hover:underline" style={{ color: '#333' }}>{s.full_name}</button>
                      </td>
                      <td className="px-3 py-3 text-sm hidden sm:table-cell" style={{ color: '#666' }}>{s.class_name}</td>
                      <td className="px-3 py-3 text-sm hidden sm:table-cell" style={{ color: '#666' }}>{s.gender || '-'}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/exams/report/${s.student_id}`)}
                            className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Report</button>
                          <button onClick={() => handleDelete(s.student_id)}
                            className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showForm && <StudentFormModal schoolId={schoolId} student={editStudent} classes={classes} onClose={() => { setShowForm(false); setEditStudent(null); }} onSaved={() => loadStudents()} />}
      {showCsv && <CsvImportModal schoolId={schoolId} classes={classes} onClose={() => setShowCsv(false)} onAdded={() => loadStudents()} />}
    </div>
  );
}

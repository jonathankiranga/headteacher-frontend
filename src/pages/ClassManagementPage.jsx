import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

export default function ClassManagementPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [newStreamName, setNewStreamName] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    loadData();
  }, [schoolId]);

  function loadData() {
    setLoading(true);
    api.get(`/api/school-head/${schoolId}/classes`)
      .then(c => setClasses(c.data.classes || []))
      .catch(() => {});
    api.get(`/api/school-head/${schoolId}/streams`)
      .then(s => setStreams(s.data.streams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleCreateClass(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post(`/api/school-head/${schoolId}/classes`, {
        class_name: fd.get('class_name'),
        academic_year: fd.get('academic_year'),
        stream: fd.get('stream') || null,
        level_name: fd.get('level_name') || null
      });
      setShowClassForm(false);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function handleUpdateClass(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.put(`/api/school-head/${schoolId}/classes/${editClass.class_id}`, {
        level_name: fd.get('level_name'),
        stream: fd.get('stream') || null,
        academic_year: fd.get('academic_year')
      });
      setShowEditForm(false);
      setEditClass(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function handleDeleteClass(id) {
    if (!window.confirm('Delete this class?')) return;
    try {
      await api.delete(`/api/school-head/${schoolId}/classes/${id}`);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function handleAddStream() {
    if (!newStreamName.trim()) return;
    try {
      await api.post(`/api/school-head/${schoolId}/streams`, { stream_name: newStreamName.trim() });
      setNewStreamName('');
      setShowStreamForm(false);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function handleDeleteStream(id) {
    if (!window.confirm('Delete this stream?')) return;
    try {
      await api.delete(`/api/school-head/${schoolId}/streams/${id}`);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  const levels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9'];

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Classes & Streams</h1>
          <button onClick={() => setShowClassForm(true)} className="btn-secondary text-sm">+ Class</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Streams */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#333' }}>Streams</h2>
            <button onClick={() => setShowStreamForm(!showStreamForm)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>+ Add Stream</button>
          </div>
          {showStreamForm && (
            <div className="flex gap-2 mb-3">
              <input value={newStreamName} onChange={e => setNewStreamName(e.target.value)}
                placeholder="Stream name (e.g. East)" className="input-field flex-1" />
              <button onClick={handleAddStream} className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#7B4F9B' }}>Add</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {streams.length === 0 ? (
              <p className="text-sm" style={{ color: '#888' }}>No streams defined. Defaults: East, West, North, South</p>
            ) : streams.map(s => (
              <span key={s.stream_id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#F0E6F6', color: '#7B4F9B' }}>
                {s.stream_name}
                <button onClick={() => handleDeleteStream(s.stream_id)} className="text-xs hover:text-red-600" style={{ color: '#999' }}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Classes */}
        <div className="card p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: '#333' }}>Classes</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
            </div>
          ) : classes.length === 0 ? (
            <p className="text-sm" style={{ color: '#888' }}>No classes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Class Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Stream</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Year</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c, i) => (
                    <tr key={c.class_id} style={{ borderBottom: i < classes.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-2.5 text-sm font-medium" style={{ color: '#333' }}>{c.class_name}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: '#666' }}>{c.level_name || '-'}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: '#666' }}>{c.stream || '-'}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: '#666' }}>{c.academic_year}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditClass(c); setShowEditForm(true); }} className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Edit</button>
                          <button onClick={() => handleDeleteClass(c.class_id)} className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Class Form Modal */}
          {showEditForm && editClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold" style={{ color: '#333' }}>Edit Class</h3>
                  <button onClick={() => { setShowEditForm(false); setEditClass(null); }} className="text-sm" style={{ color: '#888' }}>✕</button>
                </div>
                <p className="text-xs mb-4" style={{ color: '#888' }}>Current: {editClass.class_name}</p>
                <form onSubmit={handleUpdateClass} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Grade Level</label>
                    <select name="level_name" className="input-field" defaultValue={editClass.level_name || ''} required>
                      <option value="">— Select —</option>
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Stream</label>
                    <select name="stream" className="input-field" defaultValue={editClass.stream || ''}>
                      <option value="">— No stream —</option>
                      {streams.map(s => <option key={s.stream_id} value={s.stream_name}>{s.stream_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Academic Year</label>
                    <input name="academic_year" className="input-field" defaultValue={editClass.academic_year} required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowEditForm(false); setEditClass(null); }}
                      className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
                    <button type="submit" className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create Class Form Modal */}
          {showClassForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold" style={{ color: '#333' }}>New Class</h3>
                  <button onClick={() => setShowClassForm(false)} className="text-sm" style={{ color: '#888' }}>✕</button>
                </div>
                <form onSubmit={handleCreateClass} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Grade Level</label>
                    <select name="level_name" className="input-field" required>
                      <option value="">— Select —</option>
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Stream <span className="text-gray-400">(optional)</span></label>
                    <select name="stream" className="input-field">
                      <option value="">— No stream —</option>
                      {streams.map(s => <option key={s.stream_id} value={s.stream_name}>{s.stream_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Academic Year</label>
                    <input name="academic_year" className="input-field" defaultValue={new Date().getFullYear()} required />
                  </div>
                  <input name="class_name" type="hidden" value="auto" />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowClassForm(false)}
                      className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
                    <button type="submit" className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

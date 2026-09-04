import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchoolTerms, createSchoolTerm, updateSchoolTerm, deleteSchoolTerm } from '../utils/api.js';

const TERM_NAMES = ['Term 1', 'Term 2', 'Term 3'];

function fmtDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isoDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const emptyForm = { term_name: 'Term 1', start_date: '', end_date: '', academic_year: new Date().getFullYear() };

export default function SchoolTermsPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role') || 'teacher';

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Edit / add state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = new
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Year filter
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);

  useEffect(() => {
    if (!schoolId) { navigate('/teacher/login', { replace: true }); return; }
    load();
  }, [schoolId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getSchoolTerms(schoolId);
      setTerms(data.terms || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load terms');
    }
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, academic_year: filterYear });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(term) {
    setEditingId(term.term_id);
    setForm({
      term_name: term.term_name,
      start_date: isoDate(term.start_date),
      end_date: isoDate(term.end_date),
      academic_year: term.academic_year,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.term_name || !form.start_date || !form.end_date || !form.academic_year) {
      setFormError('All fields are required'); return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setFormError('End date must be after start date'); return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        const updated = await updateSchoolTerm(schoolId, editingId, form);
        setTerms(prev => prev.map(t => t.term_id === editingId ? { ...t, ...updated } : t));
        setMsg('Term updated');
      } else {
        const created = await createSchoolTerm(schoolId, form);
        setTerms(prev => [...prev, created].sort((a, b) => b.academic_year - a.academic_year || new Date(a.start_date) - new Date(b.start_date)));
        setMsg('Term added');
        setFilterYear(Number(form.academic_year));
      }
      setShowForm(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  }

  async function handleDelete(term) {
    if (!window.confirm(`Delete "${term.term_name} ${term.academic_year}"? This affects subscription expiry calculations.`)) return;
    try {
      await deleteSchoolTerm(schoolId, term.term_id);
      setTerms(prev => prev.filter(t => t.term_id !== term.term_id));
      setMsg('Term deleted');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  }

  // Copy previous year's terms into the new year as a quick-start
  async function handleCopyYear(fromYear) {
    const toYear = fromYear + 1;
    if (!window.confirm(`Copy ${fromYear} term dates into ${toYear}?`)) return;
    const source = terms.filter(t => Number(t.academic_year) === fromYear);
    if (source.length === 0) { setError(`No terms found for ${fromYear}`); return; }
    setSaving(true);
    let added = 0;
    for (const t of source) {
      // Shift dates by exactly 1 year
      const newStart = new Date(t.start_date);
      const newEnd = new Date(t.end_date);
      newStart.setFullYear(toYear);
      newEnd.setFullYear(toYear);
      try {
        const created = await createSchoolTerm(schoolId, {
          term_name: t.term_name,
          start_date: newStart.toISOString().slice(0, 10),
          end_date: newEnd.toISOString().slice(0, 10),
          academic_year: toYear,
        });
        setTerms(prev => [...prev, created]);
        added++;
      } catch { /* skip duplicates */ }
    }
    setTerms(prev => [...prev].sort((a, b) => b.academic_year - a.academic_year || new Date(a.start_date) - new Date(b.start_date)));
    setMsg(`Copied ${added} term${added === 1 ? '' : 's'} into ${toYear}`);
    setFilterYear(toYear);
    setTimeout(() => setMsg(''), 4000);
    setSaving(false);
  }

  const years = [...new Set(terms.map(t => Number(t.academic_year)))].sort((a, b) => b - a);
  const filteredTerms = terms.filter(t => Number(t.academic_year) === filterYear);
  const isHead = role === 'head';

  // Determine if any previous year is available to copy from
  const prevYearAvailable = years.includes(filterYear - 1);
  const nextYearAlreadyHasTerms = years.includes(filterYear + 1);

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ backgroundColor: '#7B4F9B', padding: '20px 16px 16px', color: '#fff' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/home')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>
              ← Back
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>School Terms</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Set term dates for subscription &amp; report accuracy</div>
            </div>
          </div>
          {isHead && (
            <button onClick={openNew}
              style={{ backgroundColor: '#fff', color: '#7B4F9B', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Add Term
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px' }}>
        {/* Success / error banners */}
        {msg && (
          <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
            ✓ {msg}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Inline add/edit form */}
        {showForm && isHead && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 14 }}>
              {editingId ? 'Edit Term' : 'New Term'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Term Name</label>
                <select value={form.term_name} onChange={e => setForm(f => ({ ...f, term_name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, backgroundColor: '#FAFAFA' }}>
                  {TERM_NAMES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Year</label>
                <input type="number" value={form.academic_year}
                  onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, backgroundColor: '#FAFAFA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Start Date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, backgroundColor: '#FAFAFA' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>End Date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, backgroundColor: '#FAFAFA' }} />
              </div>
            </div>

            {formError && (
              <div style={{ color: '#C62828', fontSize: 12, marginBottom: 10 }}>{formError}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, backgroundColor: '#7B4F9B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Term'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '10px 16px', backgroundColor: '#F5F5F5', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Year selector tabs */}
        {years.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {years.map(y => (
              <button key={y} onClick={() => setFilterYear(y)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: filterYear === y ? 700 : 500,
                  border: filterYear === y ? '2px solid #7B4F9B' : '2px solid #E0E0E0',
                  backgroundColor: filterYear === y ? '#F3E7FA' : '#fff',
                  color: filterYear === y ? '#7B4F9B' : '#555', cursor: 'pointer',
                }}>
                {y}
              </button>
            ))}
            {/* Add next year shortcut */}
            {isHead && years.length > 0 && !years.includes(filterYear + 1) && (
              <button onClick={() => setFilterYear(filterYear + 1)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '2px dashed #CCC', backgroundColor: '#FAFAFA', color: '#AAA', cursor: 'pointer' }}>
                + {filterYear + 1}
              </button>
            )}
          </div>
        )}

        {/* Copy from previous year shortcut */}
        {isHead && filteredTerms.length === 0 && prevYearAvailable && !loading && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, border: '1px dashed #7B4F9B20', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 10 }}>
              No terms for {filterYear} yet.
            </p>
            <button onClick={() => handleCopyYear(filterYear - 1)} disabled={saving}
              style={{ backgroundColor: '#7B4F9B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Copy {filterYear - 1} dates into {filterYear}
            </button>
            <p style={{ color: '#aaa', fontSize: 11, marginTop: 8 }}>
              Dates will be shifted by one year. You can edit them after.
            </p>
          </div>
        )}

        {/* Terms list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #7B4F9B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredTerms.length === 0 && !showForm ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#999', fontSize: 13 }}>
            {isHead ? 'No terms for this year. Tap "+ Add Term" to get started.' : 'No terms configured for this year.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredTerms.map(term => {
              const now = new Date();
              const start = new Date(term.start_date);
              const end = new Date(term.end_date);
              const isCurrent = now >= start && now <= end;
              const isUpcoming = now < start;
              const isPast = now > end;
              return (
                <div key={term.term_id}
                  style={{
                    backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    borderLeft: `4px solid ${isCurrent ? '#2E7D32' : isUpcoming ? '#7B4F9B' : '#DDD'}`,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{term.term_name}</span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: 10, padding: '2px 8px' }}>
                            CURRENT
                          </span>
                        )}
                        {isUpcoming && (
                          <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#F3E7FA', color: '#7B4F9B', borderRadius: 10, padding: '2px 8px' }}>
                            UPCOMING
                          </span>
                        )}
                        {isPast && (
                          <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: '#F5F5F5', color: '#AAA', borderRadius: 10, padding: '2px 8px' }}>
                            PAST
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                        {fmtDate(term.start_date)} — {fmtDate(term.end_date)}
                      </div>
                    </div>
                    {isHead && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEdit(term)}
                          style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', backgroundColor: '#FAFAFA', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(term)}
                          style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #FFCDD2', backgroundColor: '#FFF5F5', fontSize: 12, cursor: 'pointer', color: '#C62828' }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tip */}
        {!loading && terms.length > 0 && (
          <div style={{ marginTop: 20, padding: '12px 14px', backgroundColor: '#F3E7FA', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: '#7B4F9B', margin: 0, lineHeight: 1.5 }}>
              <strong>Why this matters:</strong> Term dates control when parent subscriptions expire and when the "current term" is shown on reports. Keep them updated at the start of each year.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

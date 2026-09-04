import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api.js';
import { getYearEndStatus } from '../utils/api.js';

export default function PromotionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const schoolId = sessionStorage.getItem('school_id');
  const preselected = location.state?.studentIds || [];
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fromClassId, setFromClassId] = useState(location.state?.classId || '');
  const [selected, setSelected] = useState(new Set(preselected));
  const [preview, setPreview] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState('');
  const [nextClassMap, setNextClassMap] = useState({});
  const [closeYear, setCloseYear] = useState(new Date().getFullYear());
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState(null);
  const [yearEndStatus, setYearEndStatus] = useState(null);

  // Load year-end status to pre-fill the closing year and show context
  useEffect(() => {
    if (!schoolId) return;
    getYearEndStatus(schoolId).then(s => {
      setYearEndStatus(s);
      if (s?.needs_close && s.year) setCloseYear(s.year);
    }).catch(() => {});
  }, [schoolId]);

  async function handleYearEndClose() {
    if (!window.confirm(
      `End of Year Close (${closeYear})\n\nEvery active student moves up one class level (same stream where possible). Students in the highest level will be marked Graduated.\n\nThis cannot be undone. Continue?`
    )) return;
    setClosing(true);
    setCloseResult(null);
    try {
      const r = await api.post(`/api/school-head/${schoolId}/academic-year/close`, { from_year: closeYear });
      setCloseResult(r.data);
      // Clear the session banner dismiss flag so the banner won't re-show
      // (year-end is now done, backend will return needs_close: false)
      sessionStorage.removeItem('yearEndBannerDismissed');
    } catch (err) {
      setCloseResult({ error: err.response?.data?.error || 'Year-end close failed' });
    }
    setClosing(false);
  }

  useEffect(() => {
    if (!schoolId) return;
    api.get(`/api/school-head/${schoolId}/classes`).then(c => {
      const cl = c.data.classes || [];
      setClasses(cl);
      // Build class_rank -> class mapping
      if (fromClassId) {
        const current = cl.find(c => String(c.class_id) === String(fromClassId));
        if (current) {
          const nextRank = null; // We need class_rank, which may not exist
          // Since classes don't have class_rank, we infer from level_name
          const levels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
            'Grade 7', 'Grade 8', 'Grade 9'];
          const curLevel = current.level_name;
          const idx = levels.indexOf(curLevel);
          if (idx >= 0 && idx < levels.length - 1) {
            const nextLevel = levels[idx + 1];
            const nextClasses = cl.filter(c => c.level_name === nextLevel);
            const map = {};
            for (const s of students) {
              map[s.student_id] = nextClasses[0] || null;
            }
            setNextClassMap(map);
          }
        }
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !fromClassId) return;
    api.get(`/api/school-head/${schoolId}/students`, { params: { class_id: fromClassId } })
      .then(s => setStudents(s.data.students || []))
      .catch(() => {});
  }, [schoolId, fromClassId]);

  function toggleSelect(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.student_id)));
  }

  function getNextClass(studentId) {
    return nextClassMap[studentId] || null;
  }

  function buildPreview() {
    const selectedStudents = students.filter(s => selected.has(s.student_id));
    const levels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9'];
    const current = classes.find(c => String(c.class_id) === String(fromClassId));
    const curLevel = current?.level_name;
    const idx = levels.indexOf(curLevel);
    const nextLevel = (idx >= 0 && idx < levels.length - 1) ? levels[idx + 1] : null;
    const nextClasses = nextLevel ? classes.filter(c => c.level_name === nextLevel) : [];

    const rows = selectedStudents.map(s => {
      const nextCls = nextClasses[0] || null;
      return {
        student_id: s.student_id,
        full_name: s.full_name,
        current_class: current?.class_name || '',
        next_class: nextCls?.class_name || null,
        next_class_id: nextCls?.class_id || null,
        action: nextCls ? 'Promote' : 'Graduate'
      };
    });
    setPreview(rows);
  }

  async function handleCommit() {
    if (!preview || preview.length === 0) return;
    setCommitting(true);
    setResult('');
    const promote = preview.filter(p => p.next_class_id);
    const graduate = preview.filter(p => !p.next_class_id);

    try {
      if (promote.length > 0) {
        await api.post(`/api/school-head/${schoolId}/students/promote`, {
          student_ids: promote.map(p => p.student_id),
          to_class_id: promote[0].next_class_id,
          term: `Term ${Math.ceil(new Date().getMonth() / 4)}`,
          year: new Date().getFullYear().toString()
        });
      }
      if (graduate.length > 0) {
        await api.post(`/api/school-head/${schoolId}/students/graduate`, {
          student_ids: graduate.map(p => p.student_id)
        });
      }
      setResult(`${promote.length} promoted, ${graduate.length} graduated`);
    } catch (err) {
      setResult(err.response?.data?.error || 'Promotion failed');
    }
    setCommitting(false);
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Promotion</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Year-end status context */}
        {yearEndStatus?.needs_close && (
          <div className="card p-4 mb-4" style={{ borderLeft: '4px solid #F9A825', backgroundColor: '#FFFDE7' }}>
            <p className="text-sm font-semibold" style={{ color: '#B8860B' }}>
              🎓 Year-End Close required for {yearEndStatus.year}
            </p>
            <p className="text-xs mt-1" style={{ color: '#666' }}>
              Term 3 ended on {yearEndStatus.last_term_ended
                ? new Date(yearEndStatus.last_term_ended).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : ''}.
              Students are still in their {yearEndStatus.year} classes. Use the form below to move them all up in one step.
            </p>
          </div>
        )}
        {yearEndStatus?.already_run && (
          <div className="card p-4 mb-4" style={{ borderLeft: '4px solid #2E7D32', backgroundColor: '#E8F5E9' }}>
            <p className="text-sm font-semibold" style={{ color: '#2E7D32' }}>
              ✓ Year-End Close already completed for {yearEndStatus.year}
            </p>
            <p className="text-xs mt-1" style={{ color: '#555' }}>
              Use the manual promotion section below if you need to move individual students.
            </p>
          </div>
        )}

        {/* End of Year Close — automatic when status is known, manual fallback otherwise */}
        <div className="card p-6 mb-5" style={{ borderColor: '#7B4F9B', borderWidth: 1 }}>
          <h2 className="text-base font-bold mb-1" style={{ color: '#333' }}>🎓 End of Year Close</h2>
          <p className="text-xs mb-4" style={{ color: '#888' }}>
            Moves every active student up one class level (PP1→PP2→Grade 1…Grade 9).
            Same stream is kept where available. Students at the top level graduate.
          </p>

          {/* AUTO: year pre-filled from status — show clear one-click action */}
          {yearEndStatus?.needs_close ? (
            <div>
              <div className="flex items-center justify-between p-3 rounded-lg mb-3"
                style={{ backgroundColor: '#FFF8E7', border: '1px solid #F9A825' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#B8860B' }}>
                    Academic Year {yearEndStatus.year} — Not yet closed
                  </p>
                  <p className="text-xs" style={{ color: '#888', marginTop: 2 }}>
                    {yearEndStatus.last_term_ended
                      ? `Term 3 ended ${new Date(yearEndStatus.last_term_ended).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'End of year detected'
                    }
                  </p>
                </div>
              </div>
              <button onClick={handleYearEndClose} disabled={closing}
                className="btn-primary" style={{ backgroundColor: '#F9A825' }}>
                {closing ? 'Running…' : `Run Year-End Close for ${yearEndStatus.year}`}
              </button>
            </div>
          ) : yearEndStatus?.already_run ? (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
              <p className="text-sm font-semibold" style={{ color: '#2E7D32' }}>
                ✓ Already completed for {yearEndStatus.year}
              </p>
              <p className="text-xs mt-1" style={{ color: '#555' }}>
                Use the manual section below to move individual students if needed.
              </p>
            </div>
          ) : (
            /* FALLBACK: no term data — allow manual year selection */
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Closing Academic Year</label>
                <input type="number" value={closeYear} onChange={e => setCloseYear(e.target.value)} className="input-field" />
              </div>
              <button onClick={handleYearEndClose} disabled={closing} className="btn-primary whitespace-nowrap">
                {closing ? 'Processing...' : 'Run Year-End Close'}
              </button>
            </div>
          )}
            </div>
            <button onClick={handleYearEndClose} disabled={closing} className="btn-primary whitespace-nowrap">
              {closing ? 'Processing...' : 'Run Year-End Close'}
            </button>
          </div>
          {closeResult && !closeResult.error && (
            <div className="text-sm mt-3 p-3 rounded" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
              <p className="font-semibold mb-1">✓ Done: {closeResult.promoted} promoted, {closeResult.graduated} graduated across {closeResult.levels} levels.</p>
              <p style={{ color: '#555', marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
                <strong>Next steps:</strong><br />
                1. Go to <strong>School Terms</strong> and add next year's term dates.<br />
                2. Remind teachers to <strong>refresh the app</strong> — their class rosters will now show the promoted students.<br />
                3. Teachers should not mark attendance in old classes for students who have moved.
              </p>
            </div>
          )}
          {closeResult?.error && (
            <div className="text-sm mt-3 p-3 rounded" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
              {closeResult.error}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Step 1: Select Current Class</label>
            <select value={fromClassId} onChange={e => { setFromClassId(e.target.value); setPreview(null); setSelected(new Set()); }}
              className="input-field">
              <option value="">— Select —</option>
              {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>

          {students.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium" style={{ color: '#555' }}>Step 2: Select Students</label>
                <button onClick={selectAll} className="text-xs px-3 py-1 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>
                  {selected.size === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="bg-white rounded-card border border-gray-200 max-h-64 overflow-y-auto mb-4">
                {students.map(s => (
                  <label key={s.student_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                    style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <input type="checkbox" checked={selected.has(s.student_id)} onChange={() => toggleSelect(s.student_id)} />
                    <span className="text-xs font-mono" style={{ color: '#888' }}>{s.student_id}</span>
                    <span className="text-sm font-medium" style={{ color: '#333' }}>{s.full_name}</span>
                  </label>
                ))}
              </div>

              {selected.size > 0 && (
                <button onClick={buildPreview} className="w-full py-3 rounded-lg text-sm font-medium text-white mb-4"
                  style={{ backgroundColor: '#7B4F9B' }}>
                  Step 3: Preview Promotion ({selected.size} students)
                </button>
              )}
            </>
          )}

          {preview && preview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#333' }}>Preview</h3>
              <div className="bg-white rounded-card border border-gray-200 overflow-hidden mb-4">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888' }}>Student</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888' }}>From</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888' }}>To</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(p => (
                      <tr key={p.student_id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td className="px-3 py-2 text-sm">{p.full_name}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: '#666' }}>{p.current_class}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: '#666' }}>{p.next_class || '(Graduate)'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.action === 'Promote' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result && (
                <div className="text-sm mb-3 p-3 rounded" style={{
                  backgroundColor: result.includes('Failed') ? '#FFEBEE' : '#E8F5E9',
                  color: result.includes('Failed') ? '#C62828' : '#2E7D32'
                }}>{result}</div>
              )}

              <button onClick={handleCommit} disabled={committing}
                className="w-full py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#2E7D32' }}>
                {committing ? 'Processing...' : `Execute Promotion (${preview.filter(p => p.action === 'Promote').length} Promote, ${preview.filter(p => p.action === 'Graduate').length} Graduate)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

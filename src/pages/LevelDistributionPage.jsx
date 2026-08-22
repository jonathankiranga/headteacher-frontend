import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLevelDistribution } from '../utils/api.js';

const LEVEL_COLORS = {
  EE: { bg: '#E8F5E9', text: '#2E7D32', label: 'Exceeding Expectations' },
  ME: { bg: '#E3F2FD', text: '#1565C0', label: 'Meeting Expectations' },
  AE: { bg: '#FFF8E1', text: '#E65100', label: 'Approaching Expectations' },
  BE: { bg: '#FFEBEE', text: '#C62828', label: 'Below Expectations' },
};

export default function LevelDistributionPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role') || 'teacher';
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [classId, setClassId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myClasses, setMyClasses] = useState([]);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    if (schoolId) {
      getLevelDistribution(schoolId, term, year, classId)
        .then(setReport)
        .catch(e => setError(e.response?.data?.error || 'Failed to load'));
    }
  }, [schoolId, term, year, classId]);

  // Load my classes for teacher filter
  useEffect(() => {
    if (schoolId && role !== 'head') {
      getLevelDistribution(schoolId, term, year) // use same endpoint — it returns scoped classes
        .then(r => {
          if (r.classes) setMyClasses(r.classes.map(c => ({ value: c.class_id, label: c.class_name })));
        })
        .catch(() => {});
    }
  }, [schoolId, role]);

  async function handlePrint() {
    window.print();
  }

  if (!teacherId) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => navigate('/home')} className="text-sm" style={{ color: '#7B4F9B' }}>← Dashboard</button>
          <h1 className="text-xl font-bold mt-1">📊 Level Distribution Report</h1>
          <p className="text-sm" style={{ color: '#888' }}>EE/ME/AE/BE distribution across classes</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={term} onChange={e => setTerm(e.target.value)} className="input-field">
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
            <option value="">All Classes (School-wide)</option>
            {myClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {error && <p className="text-sm mt-2" style={{ color: '#C62828' }}>{error}</p>}
      </div>

      {loading && !report && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
        </div>
      )}

      {report && (
        <>
          {/* School-wide rollup */}
          <div className="card p-4 mb-4">
            <h2 className="font-semibold mb-3" style={{ color: '#333' }}>School-wide Rollup</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#F3E5F5' }}>
                <div className="text-lg font-bold" style={{ color: '#7B4F9B' }}>{report.school.total_students}</div>
                <div className="text-xs" style={{ color: '#888' }}>Total Students</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#E8F5E9' }}>
                <div className="text-lg font-bold" style={{ color: '#2E7D32' }}>{report.school.class_average !== null ? `${report.school.class_average}%` : 'N/A'}</div>
                <div className="text-xs" style={{ color: '#888' }}>Class Average</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#E3F2FD' }}>
                <div className="text-lg font-bold" style={{ color: '#1565C0' }}>{report.school.assessed_students}</div>
                <div className="text-xs" style={{ color: '#888' }}>Assessed</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#FFF8E1' }}>
                <div className="text-lg font-bold" style={{ color: '#E65100' }}>{report.classes?.length || 0}</div>
                <div className="text-xs" style={{ color: '#888' }}>Classes</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#FFEBEE' }}>
                <div className="text-lg font-bold" style={{ color: '#C62828' }}>{report.school.level_percentages?.BE || 0}%</div>
                <div className="text-xs" style={{ color: '#888' }}>Below Expectations</div>
              </div>
            </div>

            {/* Level distribution bars */}
            <div className="mt-4 space-y-3">
              {['EE', 'ME', 'AE', 'BE'].map(lv => {
                const c = LEVEL_COLORS[lv];
                const count = report.school.level_counts?.[lv] || 0;
                const pct = report.school.level_percentages?.[lv] || 0;
                const total = report.school.total_students || 1;
                const barW = Math.round(count / total * 100);
                return (
                  <div key={lv} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-8" style={{ color: c.text }}>{lv}</span>
                    <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                      <div className="h-full rounded flex items-center justify-end pr-1 text-xs font-medium text-white"
                        style={{ width: `${Math.max(barW, 4)}%`, backgroundColor: c.text }}>
                        {barW > 15 ? `${count}` : ''}
                      </div>
                    </div>
                    <span className="text-xs w-12 text-right" style={{ color: '#888' }}>{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-class breakdown */}
          <div className="card p-4">
            <h2 className="font-semibold mb-3" style={{ color: '#333' }}>Per-Class Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Class</th>
                    <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Students</th>
                    <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Avg %</th>
                    {['EE', 'ME', 'AE', 'BE'].map(lv => (
                      <th key={lv} className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{lv}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(report.classes || []).map((c, i) => (
                    <tr key={c.class_id} style={{ borderBottom: i < (report.classes.length - 1) ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-2 text-sm font-medium" style={{ color: '#333' }}>{c.class_name}</td>
                      <td className="px-2 py-2 text-sm text-center" style={{ color: '#666' }}>{c.total_students}</td>
                      <td className="px-2 py-2 text-sm text-center font-semibold" style={{ color: c.class_average !== null ? '#333' : '#999' }}>
                        {c.class_average !== null ? `${c.class_average}%` : '—'}
                      </td>
                      {['EE', 'ME', 'AE', 'BE'].map(lv => {
                        const clr = LEVEL_COLORS[lv];
                        return (
                          <td key={lv} className="px-2 py-2 text-center">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: clr.bg, color: clr.text }}>
                              {c.level_counts?.[lv] || 0}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-4">
            <button onClick={handlePrint} className="btn-secondary text-sm">Print</button>
          </div>
        </>
      )}
    </div>
  );
}
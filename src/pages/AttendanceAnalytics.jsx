import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const STATUS_COLORS = { Present: '#10B981', Absent: '#EF4444', Late: '#F59E0B', Excused: '#6B7280' };

function fmtDate(raw) {
  // MySQL DATE columns arrive as '2026-08-31' or '2026-08-31T00:00:00.000Z'
  // Parse as local date to avoid UTC midnight shifting the day
  let date;
  if (typeof raw === 'string') {
    // Take first 10 chars (YYYY-MM-DD) in case full ISO timestamp is provided
    const dateStr = raw.substring(0, 10);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  }
  if (date && !isNaN(date)) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  return raw || '—';
}
  if (!max) return null;
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="text-xs" style={{ width: 80, color: '#555', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div className="flex-1 flex gap-0.5" style={{ height: 20 }}>
        {['Present', 'Absent', 'Late', 'Excused'].map(s => {
          const c = counts[s] || 0;
          if (c === 0) return null;
          return <div key={s} style={{ width: `${(c / max) * 100}%`, minWidth: 4, backgroundColor: STATUS_COLORS[s], borderRadius: 3 }} title={`${s}: ${c}`} />;
        })}
      </div>
      <div className="text-xs" style={{ width: 60, color: '#888', flexShrink: 0 }}>{(counts.Present || 0)}/{['Present','Absent','Late','Excused'].reduce((a,s) => a + (counts[s] || 0), 0)}</div>
    </div>
  );
}

export default function AttendanceAnalytics() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role');
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!schoolId || role !== 'head') navigate('/home', { replace: true });
  }, [schoolId, role, navigate]);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    api.get(`/api/school-head/${schoolId}/analytics/attendance`, { params: { days } })
      .then(r => setAnalytics(r.data.analytics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId, days]);

  // Group by date
  const byDate = {};
  analytics.forEach(a => {
    if (!byDate[a.attendance_date]) byDate[a.attendance_date] = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    byDate[a.attendance_date][a.status] = a.cnt;
  });
  const dates = Object.keys(byDate).sort().slice(-14); // Last 14 days
  const maxCount = dates.reduce((m, d) => Math.max(m, Object.values(byDate[d]).reduce((a, b) => a + b, 0)), 0);

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Attendance Analytics</h1>
          <div className="flex gap-2">
            <button onClick={() => setDays(7)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${days === 7 ? 'text-white' : ''}`}
              style={{ backgroundColor: days === 7 ? '#7B4F9B' : '#F0F0F0', color: days === 7 ? '#fff' : '#666' }}>7d</button>
            <button onClick={() => setDays(30)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${days === 30 ? 'text-white' : ''}`}
              style={{ backgroundColor: days === 30 ? '#7B4F9B' : '#F0F0F0', color: days === 30 ? '#fff' : '#666' }}>30d</button>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888' }}><div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#10B981' }} /> Present</div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888' }}><div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#EF4444' }} /> Absent</div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888' }}><div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#F59E0B' }} /> Late</div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888' }}><div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6B7280' }} /> Excused</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
          </div>
        ) : dates.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-sm" style={{ color: '#888' }}>No attendance data yet.</p></div>
        ) : (
          <div className="card p-5">
            <div className="space-y-1">
              {dates.map(d => <Bar key={d} label={fmtDate(d)} counts={byDate[d]} max={maxCount} />)}
            </div>
          </div>
        )}

        {/* Summary card */}
        {dates.length > 0 && (
          <div className="card p-5 mt-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#333' }}>Summary (Last {days} days)</h3>
            {(() => {
              const totals = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
              Object.values(byDate).forEach(d => { Object.keys(totals).forEach(s => totals[s] += d[s] || 0); });
              const total = Object.values(totals).reduce((a, b) => a + b, 0);
              return (
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(totals).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="text-lg font-bold" style={{ color: STATUS_COLORS[k] }}>{total > 0 ? Math.round(v / total * 100) : 0}%</div>
                      <div className="text-xs mt-0.5" style={{ color: '#888' }}>{k}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLevelDistribution, getClasses } from '../utils/api.js';
import { jsPDF } from 'jspdf';

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
  const [exporting, setExporting] = useState(false);

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

  // Load classes for filter
  useEffect(() => {
    if (schoolId) {
      getClasses(schoolId)
        .then(r => {
          if (r.classes) setMyClasses(r.classes.map(c => ({ value: c.class_id, label: c.class_name })));
        })
        .catch(() => {});
    }
  }, [schoolId]);

  async function handleDownloadPdf() {
    if (!report) return;
    setExporting(true);
    try {
      const doc = new jsPDF('landscape');
      const classes = report.classes || [];
      const school = report.school || {};
      const cls = { class_name: classId ? classes.find(c => c.class_id === Number(classId))?.class_name : 'All Classes', term, year };
      let y = 18;

      const levelColor = (pct) => {
        if (pct === null || pct === undefined) return null;
        if (pct >= 80) return { code: 'EE', label: 'EE' };
        if (pct >= 60) return { code: 'ME', label: 'ME' };
        if (pct >= 40) return { code: 'AE', label: 'AE' };
        return { code: 'BE', label: 'BE' };
      };

      const leftMargin = 14;
      const pageWidth = doc.internal.pageSize.getWidth() - 28;
      const tableEndX = doc.internal.pageSize.getWidth() - 14;

      // ========== HEADER ==========
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Level Distribution Report', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Class: ${cls.class_name}`, 14, y);
      y += 6;
      doc.text(`Term: ${cls.term} · ${cls.year}`, 14, y);
      y += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
      y += 10;

      // ========== SCHOOL-WIDE ROLLUP ==========
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('School-wide Rollup', 14, y);
      y += 6;

      const total = school.total_students || 0;
      const assessed = school.assessed_students || 0;
      const avg = school.class_average;
      const avgLevel = avg !== null ? levelColor(avg).label : '—';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Students: ${total} | Assessed: ${assessed} | Class Average: ${avg !== null ? avg + '%' : 'N/A'} (${avg !== null ? levelColor(avg).label : '—'})`, 14, y);
      y += 5;
      doc.text(`Classes: ${classes.length} | Below Expectations: ${school.level_percentages?.BE || 0}%`, 14, y);
      y += 8;

      // Level distribution bars (text representation)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Level Distribution', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      ['EE', 'ME', 'AE', 'BE'].forEach(lv => {
        const c = { EE: '#2E7D32', ME: '#1565C0', AE: '#E65100', BE: '#C62828' }[lv];
        const count = school.level_counts?.[lv] || 0;
        const pct = school.level_percentages?.[lv] || 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`${lv}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${count} (${pct}%)`, 35, y);
        y += 4;
      });
      y += 6;

      // ========== PER-CLASS BREAKDOWN TABLE ==========
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Per-Class Breakdown', 14, y);
      y += 6;

      const colClass = 14;
      const colStudents = 14 + 50;
      const colAvg = 14 + 50 + 25;
      const colEE = 14 + 50 + 25 + 22;
      const colME = colEE + 20;
      const colAE = colME + 20;
      const colBE = colAE + 20;
      const tableEndX2 = colBE + 20;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Class', colClass + 1, y);
      doc.text('Students', colStudents + 1, y);
      doc.text('Avg %', colAvg + 1, y);
      doc.text('EE', colEE + 1, y);
      doc.text('ME', colME + 1, y);
      doc.text('AE', colAE + 1, y);
      doc.text('BE', colBE + 1, y);
      y += 4;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, y - 1, tableEndX2, y - 1);

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      for (const c of classes) {
        if (y > 175) {
          doc.addPage();
          y = 18;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('Class', 15, y);
          doc.text('Students', 65, y);
          doc.text('Avg %', 90, y);
          doc.text('EE', 112, y);
          doc.text('ME', 132, y);
          doc.text('AE', 152, y);
          doc.text('BE', 172, y);
          y += 4;
          doc.line(leftMargin, y - 1, tableEndX2, y - 1);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        const avg = c.class_average;
        const avgLevel = avg !== null ? levelColor(avg).label : '—';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(c.class_name.substring(0, 30), 15, y);
        doc.text(String(c.total_students || 0), colStudents + 2, y);
        doc.text(avg !== null ? `${avg}%` : '—', colAvg + 1, y);
        doc.text(String(c.level_counts?.EE || 0), colEE + 2, y);
        doc.text(String(c.level_counts?.ME || 0), colME + 2, y);
        doc.text(String(c.level_counts?.AE || 0), colAE + 2, y);
        doc.text(String(c.level_counts?.BE || 0), colBE + 2, y);
        y += 4;
      }

      // ========== FOOTER ==========
      y += 5;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, 14 + 50 + 25 + 22 + 20 + 20 + 20 + 20, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Summary', leftMargin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Total Students: ${school.total_students || 0} | Assessed: ${school.assessed_students || 0} | Classes: ${classes.length}`, leftMargin, y);
      y += 5;
      doc.text(`School Average: ${school.class_average !== null ? school.class_average + '%' : 'N/A'} (${school.class_average !== null ? levelColor(school.class_average).label : '—'})`, leftMargin, y);
      y += 5;
      const levelDist = ['EE', 'ME', 'AE', 'BE'].map(lv => `${lv}: ${school.level_counts?.[lv] || 0} (${school.level_percentages?.[lv] || 0}%)`).join(' | ');
      doc.text(`Level Distribution: ${levelDist}`, leftMargin, y);
      y += 5;
      doc.text(`Report generated on ${new Date().toLocaleString()}`, leftMargin, y);

      doc.save(`level-distribution-${term}-${year}${classId ? '-' + classId : ''}.pdf`);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  }

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

            {/* Per-Class Breakdown */}
            <div className="card p-4 mt-4">
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

              <div className="text-center mt-4">
                <button onClick={handleDownloadPdf} disabled={exporting} className="btn-primary text-sm mr-2">
                  {exporting ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={handlePrint} className="btn-secondary text-sm">Print</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
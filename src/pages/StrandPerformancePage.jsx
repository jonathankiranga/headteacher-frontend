import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStrandPerformance, getClasses } from '../utils/api.js';
import { jsPDF } from 'jspdf';

const LEVEL_COLORS = {
  EE: { bg: '#E8F5E9', text: '#2E7D32', label: 'Exceeding Expectations' },
  ME: { bg: '#E3F2FD', text: '#1565C0', label: 'Meeting Expectations' },
  AE: { bg: '#FFF8E1', text: '#E65100', label: 'Approaching Expectations' },
  BE: { bg: '#FFEBEE', text: '#C62828', label: 'Below Expectations' },
};

function renderLevelBadge(avg) {
  if (avg === null || avg === undefined) return <span style={{ color: '#999' }}>—</span>;
  const lv = avg >= 80 ? 'EE' : avg >= 60 ? 'ME' : avg >= 40 ? 'AE' : 'BE';
  const c = LEVEL_COLORS[lv];
  return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: c.bg, color: c.text }}>{lv}</span>;
}

export default function StrandPerformancePage() {
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
  const [expandedAreas, setExpandedAreas] = useState({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  async function loadReport() {
    if (!schoolId || !classId || !term) return;
    setLoading(true);
    setError('');
    try {
      const r = await getStrandPerformance(schoolId, classId, term, year);
      setReport(r);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load strand performance');
    }
    setLoading(false);
  }

  useEffect(() => { loadReport(); }, [schoolId, classId, term, year]);

  // Load classes for filter
  useEffect(() => {
    if (!schoolId) return;
    getClasses(schoolId)
      .then(r => {
        if (r.classes) {
          setMyClasses(r.classes.map(c => ({ value: c.class_id, label: c.class_name })));
          if (!classId && r.classes.length) setClassId(r.classes[0].class_id);
        }
      })
      .catch(() => {});
  }, [schoolId]);

  async function handleDownloadPdf() {
    if (!report) return;
    setExporting(true);
    try {
      const doc = new jsPDF('landscape');
      const areas = report.areas || [];
      const cls = { class_name: report.class_name, term: report.term, year: report.year };
      let y = 18;

      // Helper: level color
      const levelColor = (avg) => {
        if (avg === null || avg === undefined) return null;
        if (avg >= 80) return { code: 'EE', label: 'EE' };
        if (avg >= 60) return { code: 'ME', label: 'ME' };
        if (avg >= 40) return { code: 'AE', label: 'AE' };
        return { code: 'BE', label: 'BE' };
      };

      // ========== HEADER ==========
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Strand / Sub-strand Performance Report', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Class: ${cls.class_name}`, 14, y);
      y += 6;
      doc.text(`Term: ${cls.term} · ${cls.year}`, 14, y);
      y += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
      y += 10;

      // ========== SUMMARY STATS ==========
      // Collect all sub-strand avgs across areas
      let allSubStrandAvgs = [];
      let totalSubStrands = 0;
      let assessedSubStrands = 0;
      areas.forEach(area => {
        (area.strands || []).forEach(strand => {
          (strand.sub_strands || []).forEach(sub => {
            totalSubStrands++;
            if (sub.class_avg !== null && sub.class_avg !== undefined) {
              assessedSubStrands++;
              allSubStrandAvgs.push(sub.class_avg);
            }
          });
        });
      });
      const overallAvg = allSubStrandAvgs.length > 0
        ? Math.round(allSubStrandAvgs.reduce((a, b) => a + b, 0) / allSubStrandAvgs.length * 10) / 10
        : null;
      const overallLevel = overallAvg !== null ? levelColor(overallAvg).label : '—';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Summary', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Areas: ${areas.length} | Total Strands: ${areas.reduce((s, a) => s + (a.strands?.length || 0), 0)} | Total Sub-strands: ${totalSubStrands}`, 14, y);
      y += 5;
      doc.text(`Sub-strands Assessed: ${assessedSubStrands}/${totalSubStrands} | Overall Average: ${overallAvg !== null ? overallAvg + '%' : 'N/A'} (${overallLevel})`, 14, y);
      y += 10;

      // ========== DETAIL TABLE ==========
      // Calculate column positions
      const leftMargin = 14;
      const pageWidth = doc.internal.pageSize.getWidth() - 28; // landscape A4 usable width
      const colNameWidth = 50;
      const colStrandWidth = 55;
      const colSubWidth = 55;
      const colAvgWidth = 20;
      const colLevelWidth = 18;
      const colCountWidth = 22;
      const colStart = leftMargin;

      const colX = [
        colStart,                              // Area
        colStart + colNameWidth,               // Strand
        colStart + colNameWidth + colStrandWidth, // Sub-strand
        colStart + colNameWidth + colStrandWidth + colSubWidth, // Class Avg
        colStart + colNameWidth + colStrandWidth + colSubWidth + colAvgWidth, // Level
        colStart + colNameWidth + colStrandWidth + colSubWidth + colAvgWidth + colLevelWidth // Students
      ];
      const tableEndX = colStart + colNameWidth + colStrandWidth + colSubWidth + colAvgWidth + colLevelWidth + colCountWidth;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Learning Area', colX[0] + 1, y);
      doc.text('Strand', colX[1] + 1, y);
      doc.text('Sub-strand', colX[2] + 1, y);
      doc.text('Avg %', colX[3] + 1, y);
      doc.text('Level', colX[4] + 1, y);
      doc.text('Students', colX[5] + 1, y);
      y += 4;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, y - 1, tableEndX, y - 1);

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      for (const area of areas) {
        const strands = area.strands || [];
        if (strands.length === 0) continue;

        // Area header row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(area.area_name, colX[0] + 1, y);
        y += 4;

        for (const strand of strands) {
          const subStrands = strand.sub_strands || [];
          if (subStrands.length === 0) continue;

          // Strand header row
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(strand.strand_name, colX[1] + 1, y);
          y += 4;

          for (const sub of subStrands) {
            // Check page break
            if (y > 175) {
              doc.addPage();
              y = 18;
              // Re-draw header
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.text('Learning Area', colX[0] + 1, y);
              doc.text('Strand', colX[1] + 1, y);
              doc.text('Sub-strand', colX[2] + 1, y);
              doc.text('Avg %', colX[3] + 1, y);
              doc.text('Level', colX[4] + 1, y);
              doc.text('Students', colX[5] + 1, y);
              y += 4;
              doc.line(leftMargin, y - 1, tableEndX, y - 1);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
            }

            const avg = sub.class_avg;
            const lvl = levelColor(avg);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(sub.sub_strand_name, colX[2] + 1, y);
            doc.text(avg !== null && avg !== undefined ? `${avg}%` : '—', colX[3] + 1, y);
            doc.text(lvl ? lvl.label : '—', colX[4] + 2, y);
            doc.text(String(sub.student_count || 0), colX[5] + 2, y);
            y += 4;
          }

          // Strand summary row
          const strandAssessed = subStrands.filter(s => s.class_avg !== null && s.class_avg !== undefined);
          if (strandAssessed.length > 0) {
            const strandAvg = Math.round(strandAssessed.reduce((a, b) => a + b.class_avg, 0) / strandAssessed.length * 10) / 10;
            const strandLevel = levelColor(strandAvg);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.text(`Strand Average: ${strandAvg}% (${strandLevel.label})`, colX[1] + 1, y);
            y += 4;
          }
        }

        // Area summary row
        const areaAssessed = strands.flatMap(s => s.sub_strands || []).filter(s => s.class_avg !== null && s.class_avg !== undefined);
        if (areaAssessed.length > 0) {
          const areaAvg = Math.round(areaAssessed.reduce((a, b) => a + b.class_avg, 0) / areaAssessed.length * 10) / 10;
          const areaLevel = levelColor(areaAvg);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(`Area Average: ${areaAvg}% (${areaLevel.label})`, colX[0] + 1, y);
          y += 6;
        }
        y += 3; // spacing between areas
      }

      // ========== FOOTER SUMMARY ==========
      y += 5;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, tableEndX, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Overall Summary', leftMargin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Total Sub-strands: ${totalSubStrands} | Assessed: ${assessedSubStrands} | Not Assessed: ${totalSubStrands - assessedSubStrands}`, leftMargin, y);
      y += 5;
      doc.text(`Overall Average: ${overallAvg !== null ? overallAvg + '%' : 'N/A'} | Level: ${overallLevel}`, leftMargin, y);
      y += 5;
      doc.text(`Report generated on ${new Date().toLocaleString()}`, leftMargin, y);

      doc.save(`strand-performance-${cls.class_name}-${cls.term}-${cls.year}.pdf`);
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
          <h1 className="text-xl font-bold mt-1">🧬 Strand / Sub-strand Performance</h1>
          <p className="text-sm" style={{ color: '#888' }}>Formative assessment performance by strand and sub-strand</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
            <option value="">— Select Class —</option>
            {myClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={term} onChange={e => setTerm(e.target.value)} className="input-field">
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {error && <p className="text-sm mt-2" style={{ color: '#C62828' }}>{error}</p>}
      </div>

      {loading && !report && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6A1B9A', borderTopColor: 'transparent' }} />
        </div>
      )}

      {report && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#333' }}>{report.class_name}</h2>
                <p className="text-sm" style={{ color: '#888' }}>{report.term} · {report.year}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownloadPdf} disabled={exporting} className="btn-primary text-sm">
                  {exporting ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={handlePrint} className="btn-secondary text-sm">Print</button>
              </div>
            </div>

            {(report.areas || []).map(area => (
              <div key={area.area_id} className="mb-4">
                <button
                  onClick={() => setExpandedAreas(prev => ({ ...prev, [area.area_id]: !prev[area.area_id] }))}
                  className="w-full flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: '#F5F0FF', cursor: 'pointer' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{expandedAreas[area.area_id] ? '▼' : '▶'}</span>
                    <div>
                      <div className="font-semibold" style={{ color: '#6A1B9A' }}>{area.area_name}</div>
                      <div className="text-xs" style={{ color: '#888' }}>
                        {area.strands?.length || 0} strands · {Object.values(area.strands || {}).flatMap(s => s.sub_strands || []).length} sub-strands
                      </div>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: '#999' }}>
                    {expandedAreas[area.area_id] ? 'Collapse' : 'Expand'}
                  </span>
                </button>

                {expandedAreas[area.area_id] && (
                  <div className="mt-2 pl-4 space-y-3">
                    {(area.strands || []).map(strand => (
                      <div key={strand.strand_id} className="pl-4 border-l-2" style={{ borderColor: '#E0E0E0' }}>
                        <div className="flex items-center justify-between py-2">
                          <div className="font-medium" style={{ color: '#333' }}>{strand.strand_name}</div>
                          <div className="text-sm font-semibold" style={{ color: strand.class_avg !== null ? '#333' : '#999' }}>
                            {strand.class_avg !== null ? `${strand.class_avg}%` : '—'} {renderLevelBadge(strand.class_avg)}
                          </div>
                        </div>
                        {(strand.sub_strands || []).map(sub => (
                          <div key={sub.sub_strand_id} className="pl-4 border-l-2" style={{ borderColor: '#F0F0F0' }}>
                            <div className="flex items-center justify-between py-1.5">
                              <span className="text-sm" style={{ color: '#555' }}>{sub.sub_strand_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: sub.class_avg !== null ? '#333' : '#999' }}>
                                  {sub.class_avg !== null ? `${sub.class_avg}%` : '—'}
                                </span>
                                {renderLevelBadge(sub.class_avg)}
                                <span className="text-xs" style={{ color: '#999' }}>{sub.student_count} students</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !report && !error && classId && (
        <div className="text-center py-12" style={{ color: '#888' }}>
          No assessment data found for this class, term, and year.
        </div>
      )}
    </div>
  );
}
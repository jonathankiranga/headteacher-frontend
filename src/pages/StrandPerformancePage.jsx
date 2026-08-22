import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStrandPerformance, getClasses } from '../utils/api.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const reportRef = useRef(null);

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
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
      heightLeft -= (pdf.internal.pageSize.getHeight() - 20);
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
        heightLeft -= (pdf.internal.pageSize.getHeight() - 20);
      }
      pdf.save(`strand-performance-${report.class_name}-${term}-${year}.pdf`);
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
          <div className="card p-4 mb-4" ref={reportRef}>
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
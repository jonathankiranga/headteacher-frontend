import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentReport } from '../utils/api.js';
import api from '../utils/api.js';

export default function ReportCardPage() {
  const navigate = useNavigate();
  const { studentId, term: urlTerm } = useParams();
  const schoolId = sessionStorage.getItem('school_id');
  const teacherId = sessionStorage.getItem('teacher_id');
  const [report, setReport] = useState(null);
  const [cumulative, setCumulative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('single');
  const [selectedTerm, setSelectedTerm] = useState(urlTerm || 'Term 1');
  const [studentProfile, setStudentProfile] = useState(null);

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const currentTerm = `Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`;

  // Student picker state (shown when no studentId in URL)
  const [pickerClasses, setPickerClasses] = useState([]);
  const [pickerClassId, setPickerClassId] = useState('');
  const [pickerStudents, setPickerStudents] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(true);
  const [pickerStudentsLoading, setPickerStudentsLoading] = useState(false);

  useEffect(() => {
    setSelectedTerm(urlTerm || currentTerm);
  }, [urlTerm]);

  // Load classes when no studentId (picker mode)
  useEffect(() => {
    if (studentId) return;
    setPickerLoading(true);
    const sid = sessionStorage.getItem('school_id');
    if (!sid) { setPickerLoading(false); return; }
    api.get('/api/fees/classes', { params: { school_id: sid } })
      .then(d => setPickerClasses((d.classes || []).sort((a, b) => (a.class_rank || 0) - (b.class_rank || 0))))
      .catch(() => {})
      .finally(() => setPickerLoading(false));
  }, [studentId]);

  // Load students when a class is selected
  useEffect(() => {
    if (studentId || !pickerClassId) { setPickerStudents([]); return; }
    setPickerStudentsLoading(true);
    const sid = sessionStorage.getItem('school_id');
    api.get(`/api/school-head/${sid}/students`, { params: { class_id: pickerClassId } })
      .then(d => setPickerStudents(d.students || []))
      .catch(() => {})
      .finally(() => setPickerStudentsLoading(false));
  }, [studentId, pickerClassId]);

  // Load report when studentId is present
  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);

    Promise.all([
      getStudentReport(studentId, selectedTerm),
      api.get(`/api/school-head/${schoolId}/students/${studentId}`).catch(() => ({ data: { student: null } })),
      api.get(`/api/assessments/report/${studentId}/cumulative/${new Date().getFullYear()}`).catch(() => ({ data: null }))
    ]).then(([reportData, profileData, cumData]) => {
      setReport(reportData);
      setStudentProfile(profileData?.data?.student || null);
      setCumulative(cumData?.data || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId, selectedTerm]);

  function getLevel(pct) {
    if (pct >= 80) return 'EE';
    if (pct >= 60) return 'ME';
    if (pct >= 40) return 'AE';
    return 'BE';
  }

  function levelStyle(level) {
    const map = {
      EE: { bg: '#E8F5E9', text: '#2E7D32' },
      ME: { bg: '#E3F2FD', text: '#1565C0' },
      AE: { bg: '#FFF3E0', text: '#E65100' },
      BE: { bg: '#FFEBEE', text: '#C62828' }
    };
    return map[level] || { bg: '#F5F5F5', text: '#888' };
  }

  // Student picker: class-first, shown when no studentId in URL
  if (!studentId) {
    const selectedClass = pickerClasses.find(c => c.class_id == pickerClassId);
    return (
      <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
        <div className="navbar px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => pickerClassId ? setPickerClassId('') : navigate('/home')} className="btn-ghost text-sm">
              {pickerClassId ? '← Classes' : '← Home'}
            </button>
            <h1 className="text-sm font-semibold" style={{ color: '#333' }}>
              {selectedClass ? selectedClass.class_name : 'Report Cards'}
            </h1>
            <div style={{ width: 60 }} />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {pickerLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
            </div>
          ) : !pickerClassId ? (
            <>
              <p className="text-xs font-medium mb-3 px-1" style={{ color: '#888' }}>Select a class</p>
              <div className="grid grid-cols-2 gap-3">
                {pickerClasses.map(c => (
                  <button key={c.class_id} onClick={() => setPickerClassId(c.class_id)}
                    className="text-left p-4 rounded-xl transition-all"
                    style={{ backgroundColor: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(123,79,155,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
                    <div className="text-base font-bold" style={{ color: '#7B4F9B' }}>{c.class_name}</div>
                    <div className="text-xs mt-1" style={{ color: '#aaa' }}>View students →</div>
                  </button>
                ))}
                {pickerClasses.length === 0 && (
                  <div className="col-span-2 text-center py-12" style={{ color: '#888' }}>No classes found</div>
                )}
              </div>
            </>
          ) : (
            <>
              {pickerStudentsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
                </div>
              ) : pickerStudents.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#888' }}>No students in this class</div>
              ) : (
                <div className="space-y-2">
                  {pickerStudents.map(s => (
                    <button key={s.student_id} onClick={() => navigate(`/exams/report/${s.student_id}`)}
                      className="w-full flex items-center gap-3 p-3 text-left rounded-lg transition-all"
                      style={{ backgroundColor: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,79,155,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: '#F0E6F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#7B4F9B', fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>{(s.full_name || '?')[0]}</div>
                      <div className="text-sm font-medium" style={{ color: '#333' }}>{s.full_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!report) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <p style={{ color: '#888' }}>Report not found</p>
    </div>
  );

  async function handleDownloadPdf() {
    try {
      const { downloadAcademicPdf } = await import('../utils/pdfExport.js');
      await downloadAcademicPdf(report, report?.student?.full_name, '', selectedTerm);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="btn-primary text-sm px-3 py-1.5">Download PDF</button>
            <button onClick={() => window.print()} className="btn-secondary text-sm px-3 py-1.5">Print</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* View Toggle & Term Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => setView('single')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: view === 'single' ? '#7B4F9B' : '#F0E6F6', color: view === 'single' ? '#fff' : '#7B4F9B' }}>Single Term</button>
            <button onClick={() => setView('cumulative')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: view === 'cumulative' ? '#7B4F9B' : '#F0E6F6', color: view === 'cumulative' ? '#fff' : '#7B4F9B' }}>Cumulative</button>
          </div>
          {view === 'single' && (
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field text-sm" style={{ maxWidth: 140 }}>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="card p-6 print:p-0 print:shadow-none print:border-0">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#333' }}>CBC Progress Report</h1>
            {report.school_contact?.school_name && (
              <p className="text-sm font-medium" style={{ color: '#7B4F9B' }}>{report.school_contact.school_name}</p>
            )}
          </div>

          {/* Student Profile */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-6 p-3 rounded-lg" style={{ backgroundColor: '#FAFAFA' }}>
            <div><span className="text-gray-500">Name:</span> <span className="font-semibold">{report.student.full_name}</span></div>
            <div><span className="text-gray-500">Class:</span> <span className="font-semibold">{report.student.class_name}</span></div>
            {studentProfile?.gender && <div><span className="text-gray-500">Gender:</span> {studentProfile.gender}</div>}
            {studentProfile?.date_of_birth && <div><span className="text-gray-500">DOB:</span> {new Date(studentProfile.date_of_birth).toLocaleDateString()}</div>}
            {studentProfile?.admission_number && <div><span className="text-gray-500">Admission:</span> {studentProfile.admission_number}</div>}
            <div><span className="text-gray-500">Student ID:</span> <span className="font-mono text-xs">{report.student.student_id}</span></div>
            {studentProfile?.guardian_name && (
              <div className="col-span-2"><span className="text-gray-500">Guardian:</span> {studentProfile.guardian_name} {studentProfile.guardian_phone ? `(${studentProfile.guardian_phone})` : ''}</div>
            )}
          </div>

          {view === 'single' && (
            <>
              {(report.areas || []).map((a) => {
                const hasStrands = a.strands && a.strands.length > 0 && a.strands.some(s => s.sub_strands && s.sub_strands.length > 0);
                const hasSummative = a.summative && a.summative.length > 0;
                const isEmpty = !hasStrands && !hasSummative;

                return (
                  <div key={a.area_id} className="mb-6">
                    <h3 className="text-sm font-bold mb-2 px-1" style={{ color: '#7B4F9B', borderBottom: '2px solid #7B4F9B', paddingBottom: 4 }}>{a.area_name}</h3>

                    {isEmpty && (
                      <table className="w-full mb-2">
                        <thead>
                          <tr style={{ backgroundColor: '#FAFAFA' }}>
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Strand</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Sub-strand</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Mark</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Competency Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 text-sm" style={{ color: '#999' }}>-</td>
                            <td className="px-4 py-2 text-sm" style={{ color: '#999' }}>-</td>
                            <td className="px-4 py-2 text-sm text-center" style={{ color: '#999' }}>-</td>
                            <td className="px-4 py-2 text-sm text-center" style={{ color: '#999' }}>-</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {hasStrands && (
                      <table className="w-full mb-2">
                        <thead>
                          <tr style={{ backgroundColor: '#FAFAFA' }}>
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Strand</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Sub-strand</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Mark</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Competency Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.strands.map((strand) =>
                            (strand.sub_strands || []).length > 0
                              ? strand.sub_strands.map((sub, si) => {
                                  const ls = levelStyle(sub.performance_level);
                                  return (
                                    <tr key={`${strand.strand_id}-${si}`} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                      {si === 0 ? (
                                        <td className="px-4 py-2 text-sm font-medium align-top" style={{ color: '#555', width: '20%' }}>{strand.strand_name}</td>
                                      ) : (
                                        <td className="px-4 py-2" />
                                      )}
                                      <td className="px-4 py-2 text-sm" style={{ color: '#333' }}>{sub.sub_strand_name || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-center" style={{ color: '#666' }}>{sub.formative_score || '-'}</td>
                                      <td className="px-4 py-2 text-center">
                                        {sub.performance_level ? (
                                          <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                                            {sub.performance_level}
                                          </span>
                                        ) : '-'}
                                      </td>
                                    </tr>
                                  );
                                })
                              : (
                                  <tr key={strand.strand_id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                    <td className="px-4 py-2 text-sm font-medium" style={{ color: '#555', width: '20%' }}>{strand.strand_name}</td>
                                    <td className="px-4 py-2 text-sm" style={{ color: '#999' }}>-</td>
                                    <td className="px-4 py-2 text-sm text-center" style={{ color: '#999' }}>-</td>
                                    <td className="px-4 py-2 text-center" style={{ color: '#999' }}>-</td>
                                  </tr>
                                )
                          )}
                        </tbody>
                      </table>
                    )}

                    {hasSummative && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1 px-1" style={{ color: '#888' }}>Summative (CAT / End-Term)</p>
                        {(() => {
                          const sessions = [];
                          const sessionKeys = new Set();
                          const subAreas = [];
                          const byCell = {};
                          a.summative.forEach((s) => {
                            if (!subAreas.includes(s.sub_area_name || '-')) subAreas.push(s.sub_area_name || '-');
                          });
                          a.summative.forEach((s) => {
                            const key = `${s.exam_type}|${s.exam_name || ''}`;
                            if (!sessionKeys.has(key)) {
                              sessionKeys.add(key);
                              sessions.push({ key, label: s.exam_type });
                            }
                            byCell[`${s.sub_area_name || '-'}|${key}`] = s;
                          });
                          return (
                            <div className="overflow-x-auto">
                              <table className="w-full" style={{ minWidth: sessions.length * 90 + 160 }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Sub-Area</th>
                                    {sessions.map((se) => (
                                      <th key={se.key} className="text-center px-4 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{se.label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {subAreas.map((sa, saIdx) => {
                                    return (
                                      <tr key={saIdx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                        <td className="px-4 py-2 text-sm" style={{ color: '#333' }}>{sa}</td>
                                        {sessions.map((se) => {
                                          const s = byCell[`${sa}|${se.key}`];
                                          const ls = s && s.performance_level ? levelStyle(s.performance_level) : null;
                                          return (
                                            <td key={se.key} className="px-4 py-2 text-center">
                                              <div className="text-sm" style={{ color: s ? '#666' : '#ccc' }}>{s ? s.summative_score : '-'}</div>
                                              {s && s.performance_level && ls && (
                                                <span className="inline-flex mt-0.5 px-2.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                                                  {s.performance_level}
                                                </span>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4" style={{ borderColor: '#F0F0F0' }}>
                <div>
                  <span className="text-gray-500">Attendance:</span>
                  <span className="ml-2 font-semibold" style={{ color: '#333' }}>
                    {report.attendance?.present || 0} / {report.attendance?.total || '-'} days
                  </span>
                </div>
              </div>
            </>
          )}

          {view === 'cumulative' && cumulative && (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Learning Area</th>
                      {terms.map(t => (
                        <th key={t} className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>{t}</th>
                      ))}
                      <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', backgroundColor: '#F3E8FF' }}>Average</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cumulative.area_summary || []).map((a, i) => {
                      const overallPct = parseFloat(a.overall_avg || 0);
                      const level = getLevel(overallPct);
                      const ls = levelStyle(level);
                      return (
                        <tr key={a.area_name} style={{ borderBottom: i < (cumulative.area_summary || []).length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          <td className="px-3 py-2.5 text-sm font-medium" style={{ color: '#333' }}>{a.area_name}</td>
                          {terms.map(t => {
                            const termData = (cumulative.terms || []).find(td => td.term === t);
                            const areaData = termData?.areas?.find(ad => ad.area_name === a.area_name);
                            return (
                              <td key={t} className="px-3 py-2.5 text-sm text-center" style={{ color: areaData?.avg_pct ? '#333' : '#ccc' }}>
                                {areaData?.avg_pct ? `${areaData.avg_pct}%` : '-'}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-sm text-center font-bold" style={{ color: '#7B4F9B', backgroundColor: '#F8F0FF' }}>
                            {a.overall_avg ? `${a.overall_avg}%` : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {a.overall_avg ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: ls.bg, color: ls.text }}>
                                {level}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Per-term attendance */}
              <div className="border-t pt-4" style={{ borderColor: '#F0F0F0' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#555' }}>Attendance by Term</h3>
                <div className="grid grid-cols-3 gap-4">
                  {cumulative.terms.map(td => (
                    <div key={td.term} className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
                      <div className="text-xs font-medium" style={{ color: '#888' }}>{td.term}</div>
                      <div className="text-sm font-bold" style={{ color: '#333' }}>{td.attendance?.present || 0} / {td.attendance?.total || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === 'cumulative' && !cumulative && (
            <div className="text-center py-8" style={{ color: '#888' }}>
              <p>Cumulative data not available. No previous term data found.</p>
            </div>
          )}

          {/* Competencies (single term view) */}
          {view === 'single' && report.report_settings && (
            <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: '#F0F0F0', color: '#aaa' }}>
              <p>{report.school_contact?.school_name || 'Education APP'} — Powered by Smarternow Data Venture</p>
              {report.school_contact?.contact_phone && <p>Contact: {report.school_contact.contact_phone}</p>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .navbar { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

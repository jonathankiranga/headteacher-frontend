import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentList from '../components/StudentList.jsx';
import SyncIndicator from '../components/SyncIndicator.jsx';
import { startSync, stopSync } from '../utils/syncManager.js';
import { getClasses } from '../utils/api.js';
import HelpPanel, { HelpSection, HelpStep, HelpTip } from '../components/HelpPanel.jsx';

export default function AttendancePage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    startSync();
    return () => stopSync();
  }, []);

  // Load classes for filter
  useEffect(() => {
    if (!schoolId) return;
    getClasses(schoolId).then(d => {
      setClasses((d.classes || []).map(c => ({ value: c.class_id, label: c.class_name })));
    }).catch(() => {});
  }, [schoolId]);

  if (!teacherId) return null;

  function handleLogout() {
    sessionStorage.clear();
    navigate('/teacher/login', { replace: true });
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold" style={{ color: '#333' }}>Attendance</h1>
            <p className="text-xs" style={{ color: '#999' }}>{date}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
            <button onClick={() => setShowHelp(true)} className="btn-ghost text-sm" aria-label="Help">❓</button>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="card p-4 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#555' }}>Select Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#555' }}>Filter Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <StudentList teacherId={teacherId} date={date} classId={classId} />
      </div>

      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} title="Attendance — Help">
        <HelpSection icon="📋" title="What is this screen?">
          This is where teachers record daily student attendance. Every mark is saved to
          each student's permanent record and visible to their parents (if subscribed to
          premium alerts).
        </HelpSection>
        <HelpSection icon="👣" title="How to take attendance">
          <HelpStep n={1}>Choose the <strong>date</strong> — it defaults to today. You can back-fill any past date.</HelpStep>
          <HelpStep n={2}>Optionally filter by <strong>class</strong> if you teach more than one.</HelpStep>
          <HelpStep n={3}>For each student tap the appropriate status:<br />
            ✓ <strong>Present</strong> &nbsp;|&nbsp; ✗ <strong>Absent</strong> &nbsp;|&nbsp; ⏰ <strong>Late</strong> &nbsp;|&nbsp; ? <strong>Excused</strong>
          </HelpStep>
          <HelpStep n={4}>Tap <strong>Sync</strong> (top bar) to upload. The app works offline — marks are queued and sent when connectivity returns.</HelpStep>
        </HelpSection>
        <HelpSection icon="👨‍👩‍👧" title="How it affects parents">
          When a student is marked <strong>Absent</strong>, premium-subscribed parents receive an
          automatic WhatsApp message within minutes. Late and Excused statuses are visible
          on the parent's report card view but do not trigger an alert.
        </HelpSection>
        <HelpSection icon="📊" title="How it affects reports">
          Attendance data feeds into the <strong>Attendance Analytics</strong> chart and each
          student's term report card (present/absent/late counts are shown on the report).
        </HelpSection>
        <HelpTip>Always sync before leaving the page — look for the green "Synced" indicator in the top bar.</HelpTip>
      </HelpPanel>
    </div>
  );
}

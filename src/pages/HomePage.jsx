import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PushManager from '../components/PushManager.jsx';
import YearEndBanner from '../components/YearEndBanner.jsx';
import InstallPrompt from '../components/InstallPrompt.jsx';

// ─── Module definitions grouped by purpose ───────────────────────────────────

const groups = [
  {
    id: 'daily',
    label: 'Daily Work',
    roles: ['teacher', 'head'],
    items: [
      { id: 'attendance',   label: 'Attendance',      icon: '📋', desc: 'Mark and track daily student attendance', color: '#7B4F9B', route: '/teacher/attendance', roles: ['teacher', 'head'] },
      { id: 'exams',        label: 'CAT Scoring',     icon: '📝', desc: 'Enter CAT scores for your class',         color: '#2E7D32', route: '/exams',              roles: ['teacher', 'head'] },
      { id: 'lesson-plans', label: 'Lesson Plans',    icon: '📖', desc: 'Plan and organize your lessons',          color: '#E65100', route: '/lesson-plans',       roles: ['teacher', 'head'] },
      { id: 'competency-ratings', label: 'Competency Ratings', icon: '⭐', desc: 'Rate CBC core competencies and values', color: '#7B4F9B', route: '/competency-ratings', roles: ['teacher', 'head'] },
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    roles: ['teacher', 'head'],
    items: [
      { id: 'class-report',       label: 'Class Report',        icon: '📑', desc: 'Per-session CBC performance for your class',  color: '#00695C', route: '/class-report',       roles: ['teacher', 'head'] },
      { id: 'analytics',          label: 'Attendance Analytics', icon: '📈', desc: 'Attendance trends and daily insights',        color: '#0EA5E9', route: '/analytics',          roles: ['teacher', 'head'] },
      { id: 'level-distribution', label: 'Level Distribution',  icon: '📊', desc: 'EE / ME / AE / BE spread across classes',     color: '#1565C0', route: '/level-distribution', roles: ['teacher', 'head'] },
      { id: 'strand-performance', label: 'Strand Performance',  icon: '🧬', desc: 'Formative strand & sub-strand results',       color: '#6A1B9A', route: '/strand-performance', roles: ['teacher', 'head'] },
    ]
  },
  {
    id: 'management',
    label: 'School Management',
    roles: ['head'],
    items: [
      { id: 'teachers',       label: 'Staff',          icon: '👥', desc: 'Manage teachers, bursars and class assignments', color: '#2563EB', route: '/school-head',    roles: ['head'] },
      { id: 'students',       label: 'Students',       icon: '🎒', desc: 'View, add and promote students',                color: '#7B4F9B', route: '/students',        roles: ['head'] },
      { id: 'classes',        label: 'Classes',        icon: '🏫', desc: 'Manage class levels and streams',               color: '#0277BD', route: '/classes',         roles: ['head'] },
      { id: 'cat-management', label: 'CAT Sessions',   icon: '🗂️', desc: 'Create sessions, subjects and sub-areas',       color: '#4A148C', route: '/cat-management', roles: ['head'] },
      { id: 'fees',           label: 'Fee Structure',  icon: '💰', desc: 'Set up fees and track collections',             color: '#059669', route: '/fees',            roles: ['head'] },
      { id: 'premium',        label: 'Subscriptions',  icon: '🔑', desc: 'Manage parent premium subscriptions',           color: '#B8860B', route: '/premium',         roles: ['head'] },
      { id: 'promotion',      label: 'Promotion',      icon: '🎓', desc: 'Promote or graduate students',                  color: '#2E7D32', route: '/promotion',       roles: ['head'] },
    ]
  },
  {
    id: 'settings',
    label: 'Setup & Settings',
    roles: ['head'],
    items: [
      { id: 'school-terms', label: 'School Terms', icon: '📅', desc: 'Set term dates for reports & subscriptions', color: '#0277BD', route: '/school-terms', roles: ['head'] },
      { id: 'help',         label: 'Help',          icon: '❓', desc: 'Get help and contact support',              color: '#6B7280', route: '/help',          roles: ['teacher', 'head'] },
    ]
  },
];

// Help is always visible for teachers in their own implicit group
const teacherExtraItems = [
  { id: 'help', label: 'Help', icon: '❓', desc: 'Get help and contact support', color: '#6B7280', route: '/help', roles: ['teacher', 'head'] },
];

// ─── Component ───────────────────────────────────────────────────────────────

function ModuleButton({ m, navigate }) {
  return (
    <button
      key={m.id}
      onClick={() => navigate(m.route)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', border: 'none', borderRadius: 12,
        padding: '13px 12px', textAlign: 'left', cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, backgroundColor: m.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{m.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{m.label}</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId  = sessionStorage.getItem('school_id');
  const role = sessionStorage.getItem('role') || 'teacher';

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  function handleLogout() {
    sessionStorage.clear();
    navigate('/teacher/login', { replace: true });
  }

  // Filter groups and items by role
  const visibleGroups = groups
    .filter(g => g.roles.includes(role))
    .map(g => ({
      ...g,
      items: g.items.filter(m => m.roles.includes(role))
    }))
    .filter(g => g.items.length > 0);

  // For teachers, also show Help at the bottom if not already included
  if (role === 'teacher') {
    const helpGroup = {
      id: 'extra',
      label: 'Support',
      items: teacherExtraItems.filter(m => m.roles.includes(role))
    };
    if (helpGroup.items.length > 0 && !visibleGroups.some(g => g.items.find(m => m.id === 'help'))) {
      visibleGroups.push(helpGroup);
    }
  }

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', paddingBottom: 80 }}>
      <PushManager teacherId={teacherId} />

      {/* Header */}
      <div style={{ backgroundColor: '#7B4F9B', padding: '24px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 'bold',
            }}>E</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {role === 'head' ? 'Headteacher Dashboard' : 'Teacher Dashboard'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Welcome back</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InstallPrompt />
            <button onClick={handleLogout} style={{
              backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', padding: '6px 14px', borderRadius: 20,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Year-end close reminder — head only */}
      {role === 'head' && <YearEndBanner schoolId={schoolId} />}

      {/* Grouped sections */}
      <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 12px' }}>
        {visibleGroups.map((group, gi) => (
          <div key={group.id} style={{ marginBottom: gi < visibleGroups.length - 1 ? 24 : 0 }}>
            {/* Group label */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#888',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 8, paddingLeft: 2,
            }}>
              {group.label}
            </div>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {group.items.map(m => (
                <ModuleButton key={m.id} m={m} navigate={navigate} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

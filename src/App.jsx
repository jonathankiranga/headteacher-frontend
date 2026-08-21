import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeacherLogin from './pages/TeacherLogin.jsx';
import HomePage from './pages/HomePage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import SchoolHeadDashboard from './pages/SchoolHeadDashboard.jsx';
import ExamsPage from './pages/ExamsPage.jsx';
import ReportCardPage from './pages/ReportCardPage.jsx';
import FeesPage from './pages/FeesPage.jsx';
import AttendanceAnalytics from './pages/AttendanceAnalytics.jsx';
import HelpPage from './pages/HelpPage.jsx';
import LessonPlansPage from './pages/LessonPlansPage.jsx';
import ClassReportPage from './pages/ClassReportPage.jsx';
import CompetencyRatingsPage from './pages/CompetencyRatingsPage.jsx';
import CATManagementPage from './pages/CATManagementPage.jsx';
import StudentListPage from './pages/StudentListPage.jsx';
import PromotionPage from './pages/PromotionPage.jsx';
import ClassManagementPage from './pages/ClassManagementPage.jsx';
import PremiumManagementPage from './pages/PremiumManagementPage.jsx';
import BottomNav from './components/BottomNav.jsx';

function AppLayout() {
  const location = useLocation();
  const hideNav = location.pathname === '/' || location.pathname.includes('/login');
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/teacher/login" replace />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/teacher/attendance" element={<AttendancePage />} />
        <Route path="/school-head" element={<SchoolHeadDashboard />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/analytics" element={<AttendanceAnalytics />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/report/:studentId" element={<ReportCardPage />} />
        <Route path="/exams/report/:studentId/:term" element={<ReportCardPage />} />
        <Route path="/lesson-plans" element={<LessonPlansPage />} />
        <Route path="/class-report" element={<ClassReportPage />} />
        <Route path="/class-report/:classId" element={<ClassReportPage />} />
        <Route path="/class-report/:classId/:term" element={<ClassReportPage />} />
        <Route path="/competency-ratings" element={<CompetencyRatingsPage />} />
        <Route path="/cat-management" element={<CATManagementPage />} />
        <Route path="/students" element={<StudentListPage />} />
        <Route path="/promotion" element={<PromotionPage />} />
        <Route path="/classes" element={<ClassManagementPage />} />
        <Route path="/premium" element={<PremiumManagementPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return <AppLayout />;
}

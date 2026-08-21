import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sms-backend-r0tn.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach the OTP session token to every request (school-head endpoints require it)
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('session_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export async function requestTeacherOtp(phone, email) {
  const { data } = await api.post('/api/teachers/request-otp', { phone, email });
  return data;
}

export async function verifyTeacherOtp(session_id, code) {
  const { data } = await api.post('/api/teachers/verify-otp', { session_id, code });
  return data;
}

export async function requestParentOtp(phone) {
  const { data } = await api.post('/api/parents/request-otp', { phone });
  return data;
}

export async function verifyParentOtp(session_id, code) {
  const { data } = await api.post('/api/parents/verify-otp', { session_id, code });
  return data;
}

// Attendance
export async function fetchStudents(teacherId) {
  const { data } = await api.get(`/api/attendance/students/${teacherId}`);
  return data;
}

export async function syncAttendance(records) {
  const { data } = await api.post('/api/attendance/sync', { records });
  return data;
}

// Parent
export async function getParentDashboard(phone) {
  const { data } = await api.get(`/api/parents/dashboard/${encodeURIComponent(phone)}`);
  return data;
}

// School Head
export async function fetchTeachers(schoolId) {
  const { data } = await api.get(`/api/school-head/${schoolId}/teachers`);
  return data;
}

export async function addTeacher(schoolId, teacher) {
  const { data } = await api.post(`/api/school-head/${schoolId}/teachers`, teacher);
  return data;
}

export async function deleteTeacher(schoolId, teacherId) {
  const { data } = await api.delete(`/api/school-head/${schoolId}/teachers/${teacherId}`);
  return data;
}

// Schools / Search
export async function searchSchools(query) {
  const { data } = await api.get('/api/schools/search', { params: { q: query } });
  return data;
}

// Ads
export async function getAd(schoolId) {
  const { data } = await api.get(`/api/ads/${schoolId}`);
  return data;
}

export async function getRandomAd() {
  const { data } = await api.get('/api/ads/random');
  return data;
}

// CBC Assessments
export async function getLearningAreas(schoolId, level) {
  const { data } = await api.get('/api/assessments/areas', { params: { school_id: schoolId, level } });
  return data;
}

export async function getStrands(areaId, term) {
  const { data } = await api.get('/api/assessments/strands', { params: { area_id: areaId, term } });
  return data;
}

export async function getSubStrands(strandId) {
  const { data } = await api.get('/api/assessments/sub-strands', { params: { strand_id: strandId } });
  return data;
}

export async function createAssessment(body) {
  const { data } = await api.post('/api/assessments', body);
  return data;
}

export async function getAssessments(classId, term) {
  const { data } = await api.get('/api/assessments', { params: { class_id: classId, term } });
  return data;
}

export async function saveResults(assessmentId, results) {
  const { data } = await api.post('/api/assessments/results', { assessment_id: assessmentId, results });
  return data;
}

export async function getAssessmentResults(assessmentId) {
  const { data } = await api.get(`/api/assessments/results/${assessmentId}`);
  return data;
}

export async function getStudentReport(studentId, term) {
  const { data } = await api.get(`/api/assessments/report/${studentId}/${term}`);
  return data;
}

export async function getCumulativeReport(studentId, year) {
  const { data } = await api.get(`/api/assessments/report/${studentId}/cumulative/${year}`);
  return data;
}

// Lesson Plans
export async function getLessonPlans(params) {
  const { data } = await api.get('/api/lesson-plans', { params });
  return data;
}

export async function getLessonPlan(id) {
  const { data } = await api.get(`/api/lesson-plans/${id}`);
  return data;
}

export async function createLessonPlan(body) {
  const { data } = await api.post('/api/lesson-plans', body);
  return data;
}

export async function updateLessonPlan(id, body) {
  const { data } = await api.put(`/api/lesson-plans/${id}`, body);
  return data;
}

export async function deleteLessonPlan(id) {
  const { data } = await api.delete(`/api/lesson-plans/${id}`);
  return data;
}

// Class Report
export async function getClassReport(classId, term) {
  const { data } = await api.get(`/api/assessments/class-report/${classId}/${term}`);
  return data;
}

// Merchants
export async function registerMerchant(body) {
  const { data } = await api.post('/api/merchants/register', body);
  return data;
}

export async function requestMerchantOtp(phone) {
  const { data } = await api.post('/api/merchants/request-otp', { phone });
  return data;
}

export async function verifyMerchantOtp(session_id, code) {
  const { data } = await api.post('/api/merchants/verify-otp', { session_id, code });
  return data;
}

// Premium
export async function upgradePremium(phone) {
  const { data } = await api.post('/api/parents/upgrade', { phone });
  return data;
}

export async function getPremiumStatus(phone) {
  const { data } = await api.get(`/api/parents/premium-status/${encodeURIComponent(phone)}`);
  return data;
}

// Analytics
export async function getAttendanceAnalytics(schoolId, days) {
  const { data } = await api.get(`/api/school-head/${schoolId}/analytics/attendance`, { params: { days } });
  return data;
}

// Web Push
export async function subscribePush(teacherId, subscription) {
  const { data } = await api.post('/api/webpush/subscribe', { teacher_id: teacherId, subscription });
  return data;
}

export async function unsubscribePush(teacherId) {
  const { data } = await api.post('/api/webpush/unsubscribe', { teacher_id: teacherId });
  return data;
}

// Competencies & Values
export async function getCompetencies() {
  const { data } = await api.get('/api/competencies');
  return data;
}

export async function getStudentCompetencyRatings(studentId, term) {
  const { data } = await api.get(`/api/competencies/ratings/${studentId}/${term}`);
  return data;
}

export async function getClassCompetencyRatings(classId, term) {
  const { data } = await api.get(`/api/competencies/class-ratings/${classId}/${term}`);
  return data;
}

export async function saveCompetencyRatings(ratings) {
  const { data } = await api.post('/api/competencies/ratings', { ratings });
  return data;
}

// ─── Exam Sessions (CAT) ─────────────────────────────────────────

export async function getExamSessions(params) {
  const { data } = await api.get('/api/exam-sessions', { params });
  return data;
}

export async function createExamSession(body) {
  const { data } = await api.post('/api/exam-sessions', body);
  return data;
}

export async function updateExamSession(id, body) {
  const { data } = await api.put(`/api/exam-sessions/${id}`, body);
  return data;
}

export async function updateExamSessionStatus(id, status) {
  const { data } = await api.patch(`/api/exam-sessions/${id}/status`, { status });
  return data;
}

export async function deleteExamSession(id) {
  const { data } = await api.delete(`/api/exam-sessions/${id}`);
  return data;
}

export async function getLearningAreasWithSubAreas(schoolId) {
  const { data } = await api.get('/api/exam-sessions/sub-learning-areas', { params: { school_id: schoolId } });
  return data;
}

export async function createSubLearningArea(body) {
  const { data } = await api.post('/api/exam-sessions/sub-learning-areas', body);
  return data;
}

export async function deleteSubLearningArea(id) {
  const { data } = await api.delete(`/api/exam-sessions/sub-learning-areas/${id}`);
  return data;
}

export async function getExamSessionResults(sessionId) {
  const { data } = await api.get(`/api/exam-sessions/${sessionId}/results`);
  return data;
}

export async function saveExamResults(sessionId, results, enteredBy) {
  const { data } = await api.post(`/api/exam-sessions/${sessionId}/results`, { results, entered_by: enteredBy });
  return data;
}

export async function getExamClassReport(sessionId) {
  const { data } = await api.get(`/api/exam-sessions/${sessionId}/class-report`);
  return data;
}

export async function getClasses(schoolId) {
  const { data } = await api.get('/api/fees/classes', { params: { school_id: schoolId } });
  return data;
}

export default api;

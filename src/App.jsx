import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateTest from './pages/admin/CreateTest';
import TestManagement from './pages/admin/TestManagement';
import QuestionBank from './pages/admin/QuestionBank';
import Analytics from './pages/admin/Analytics';
import StudentHome from './pages/student/StudentHome';
import LiveTest from './pages/student/LiveTest';
import TestResult from './pages/student/TestResult';
import Leaderboard from './pages/student/Leaderboard';
import MistakeBook from './pages/student/MistakeBook';
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import StudentProfileCreation from './pages/auth/StudentProfileCreation';
import Layout from './components/Layout';
import SyllabusManagement from './pages/admin/SyllabusManagement';
import MaterialManagement from './pages/admin/MaterialManagement';
import ResourceManagement from './pages/admin/ResourceManagement';
import StudentSyllabus from './pages/student/StudentSyllabus';
import OfficialSyllabus from './pages/student/Resources/OfficialSyllabus';
import StudyMaterialLibrary from './pages/student/Resources/StudyMaterialLibrary';
import PracticeLab from './pages/student/PracticeLab';
import MockTestCenter from './pages/student/MockTestCenter';
import StudentAnalytics from './pages/student/StudentAnalytics';
import AIMentor from './pages/student/AIMentor';
import QuizGenerator from './pages/student/QuizGenerator';
import AdminManagement from './pages/admin/AdminManagement';
import StudentProfile from './pages/student/StudentProfile';
import PreviousYearPractice from './pages/student/PreviousYearPractice';

import Placeholder from './pages/Placeholder';

import ProfileCompletion from './pages/auth/ProfileCompletion';
import { useAuth } from './store/AuthContext';

// Route Protection Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  const isAuthenticated = Boolean(user && token);
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');
  const isSuperAdmin = isAuthenticated && (user?.role === 'superadmin' || (user?.email && user.email.toLowerCase() === 'dhruvmistry0511@gmail.com'));

  // Restrict admin routes to authenticated admin and superadmin roles
  if (allowedRole === 'admin') {
    if (!isAdmin) {
      return <Navigate to="/admin-login" replace />;
    }
  }

  // Restrict superadmin routes to authenticated superadmin role only
  if (allowedRole === 'superadmin') {
    if (!isSuperAdmin) {
      return <Navigate to="/admin" replace />;
    }
  }

  // Restrict student routes to authenticated users
  if (allowedRole === 'student') {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!user.profile_completed && !isAdmin && window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Entry Points */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-profile" element={<StudentProfileCreation />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<Navigate to="/admin-login" replace />} />
        <Route path="/complete-profile" element={<ProtectedRoute allowedRole="student"><ProfileCompletion /></ProtectedRoute>} />
        
        {/* Layout Routes */}
        <Route element={<Layout />}>
          {/* Public Academic Exploration (Accessible to all visitors without login) */}
          <Route path="/student/syllabus" element={<StudentSyllabus />} />
          <Route path="/syllabus" element={<StudentSyllabus />} />
          <Route path="/student/resources" element={<StudyMaterialLibrary />} />
          <Route path="/resources" element={<StudyMaterialLibrary />} />
          <Route path="/study-library" element={<Navigate to="/student/resources" replace />} />
          <Route path="/student/resources/papers" element={<Navigate to="/student/resources" replace />} />
          <Route path="/student/resources/keys" element={<Navigate to="/student/resources" replace />} />
          <Route path="/student/resources/links" element={<Navigate to="/student/resources" replace />} />
          <Route path="/student/pyq" element={<ProtectedRoute allowedRole="student"><PreviousYearPractice /></ProtectedRoute>} />
          <Route path="/student/practice/pyq" element={<ProtectedRoute allowedRole="student"><PreviousYearPractice /></ProtectedRoute>} />
          <Route path="/pyq" element={<Navigate to="/student/pyq" replace />} />
          <Route path="/student/resources/official-syllabus" element={<OfficialSyllabus />} />

          {/* Admin Routes - Strictly Protected */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/tests" element={<ProtectedRoute allowedRole="admin"><TestManagement /></ProtectedRoute>} />
          <Route path="/admin/tests/create" element={<ProtectedRoute allowedRole="admin"><CreateTest /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute allowedRole="admin"><QuestionBank /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><Analytics /></ProtectedRoute>} />
          <Route path="/admin/syllabus" element={<ProtectedRoute allowedRole="admin"><SyllabusManagement /></ProtectedRoute>} />
          <Route path="/admin/materials" element={<ProtectedRoute allowedRole="admin"><MaterialManagement /></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute allowedRole="admin"><ResourceManagement /></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute allowedRole="superadmin"><AdminManagement /></ProtectedRoute>} />
          
          {/* Student Personal Features - Protected via Student Login */}
          <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentHome /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><StudentProfile /></ProtectedRoute>} />
          <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
          <Route path="/student/leaderboard" element={<ProtectedRoute allowedRole="student"><Leaderboard /></ProtectedRoute>} />
          <Route path="/student/mistakes" element={<ProtectedRoute allowedRole="student"><MistakeBook /></ProtectedRoute>} />
          <Route path="/student/practice" element={<ProtectedRoute allowedRole="student"><PracticeLab /></ProtectedRoute>} />
          <Route path="/student/mock" element={<ProtectedRoute allowedRole="student"><MockTestCenter /></ProtectedRoute>} />
          <Route path="/student/quiz" element={<ProtectedRoute allowedRole="student"><QuizGenerator /></ProtectedRoute>} />
          <Route path="/student/quiz-generator" element={<ProtectedRoute allowedRole="student"><QuizGenerator /></ProtectedRoute>} />
          <Route path="/student/analytics" element={<ProtectedRoute allowedRole="student"><StudentAnalytics /></ProtectedRoute>} />
          <Route path="/student/revision" element={<Navigate to="/student/mistakes" replace />} />
          <Route path="/student/mentor" element={<ProtectedRoute allowedRole="student"><AIMentor /></ProtectedRoute>} />
        </Route>

        {/* Fullscreen Test Routes (No Sidebar) */}
        <Route path="/student/test/:testId" element={<ProtectedRoute allowedRole="student"><LiveTest /></ProtectedRoute>} />
        <Route path="/student/result/:testId" element={<ProtectedRoute allowedRole="student"><TestResult /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
import StudentProfileCreation from './pages/auth/StudentProfileCreation';
import Layout from './components/Layout';
import SyllabusManagement from './pages/admin/SyllabusManagement';
import MaterialManagement from './pages/admin/MaterialManagement';
import ResourceManagement from './pages/admin/ResourceManagement';
import StudentSyllabus from './pages/student/StudentSyllabus';
import PreviousPapers from './pages/student/Resources/PreviousPapers';
import AnswerKeys from './pages/student/Resources/AnswerKeys';
import OfficialSyllabus from './pages/student/Resources/OfficialSyllabus';
import ExternalLinks from './pages/student/Resources/ExternalLinks';
import StudyMaterialLibrary from './pages/student/Resources/StudyMaterialLibrary';
import PracticeLab from './pages/student/PracticeLab';
import MockTestCenter from './pages/student/MockTestCenter';
import StudentAnalytics from './pages/student/StudentAnalytics';
import AIMentor from './pages/student/AIMentor';
import QuizGenerator from './pages/student/QuizGenerator';
import AdminManagement from './pages/admin/AdminManagement';

import Placeholder from './pages/Placeholder';

import ProfileCompletion from './pages/auth/ProfileCompletion';
import { useAuth } from './store/AuthContext';

// Route Protection Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  // Restrict admin routes to admin and superadmin roles
  if (allowedRole === 'admin' && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/admin/login" replace />;
  }

  // Restrict superadmin routes to superadmin role only
  if (allowedRole === 'superadmin') {
    const isSuperAdmin = user?.role === 'superadmin' || (user?.email && user.email.toLowerCase() === 'dhruvmistry0511@gmail.com');
    if (!isSuperAdmin) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Direct entry: Redirect root directly to Student Dashboard */}
        <Route path="/" element={<Navigate to="/student" replace />} />
        
        {/* Optional standalone screens */}
        <Route path="/create-profile" element={<StudentProfileCreation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/complete-profile" element={<ProfileCompletion />} />
        
        {/* Layout Routes */}
        <Route element={<Layout />}>
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/tests" element={<ProtectedRoute allowedRole="admin"><TestManagement /></ProtectedRoute>} />
          <Route path="/admin/tests/create" element={<ProtectedRoute allowedRole="admin"><CreateTest /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute allowedRole="admin"><QuestionBank /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><Analytics /></ProtectedRoute>} />
          <Route path="/admin/syllabus" element={<ProtectedRoute allowedRole="admin"><SyllabusManagement /></ProtectedRoute>} />
          <Route path="/admin/materials" element={<ProtectedRoute allowedRole="admin"><MaterialManagement /></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute allowedRole="admin"><ResourceManagement /></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute allowedRole="superadmin"><AdminManagement /></ProtectedRoute>} />
          
          {/* Student Routes - Direct access without auth roadblock */}
          <Route path="/student" element={<StudentHome />} />
          <Route path="/student/leaderboard" element={<Leaderboard />} />
          <Route path="/student/mistakes" element={<MistakeBook />} />
          
          <Route path="/student/syllabus" element={<StudentSyllabus />} />
          
          <Route path="/student/resources" element={<StudyMaterialLibrary />} />
          <Route path="/student/resources/papers" element={<PreviousPapers />} />
          <Route path="/student/resources/keys" element={<AnswerKeys />} />
          <Route path="/student/resources/official-syllabus" element={<OfficialSyllabus />} />
          <Route path="/student/resources/links" element={<ExternalLinks />} />
          
          <Route path="/student/practice" element={<PracticeLab />} />
          <Route path="/student/mock" element={<MockTestCenter />} />
          <Route path="/student/quiz" element={<QuizGenerator />} />
          <Route path="/student/quiz-generator" element={<QuizGenerator />} />
          <Route path="/student/pyq" element={<Navigate to="/student/resources/papers" replace />} />
          <Route path="/student/analytics" element={<StudentAnalytics />} />
          <Route path="/student/revision" element={<Navigate to="/student/mistakes" replace />} />
          <Route path="/student/mentor" element={<AIMentor />} />
        </Route>

        {/* Fullscreen Test Routes (No Sidebar) */}
        <Route path="/student/test/:testId" element={<LiveTest />} />
        <Route path="/student/result/:testId" element={<TestResult />} />

      </Routes>
    </Router>
  );
}

export default App;
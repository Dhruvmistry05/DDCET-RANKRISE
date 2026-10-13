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

import Placeholder from './pages/Placeholder';

import ProfileCompletion from './pages/auth/ProfileCompletion';
import { useAuth } from './store/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!token || !user) return <Navigate to="/" replace />;
  if (allowedRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/student" replace />;
  }
  
  if (!user.profile_completed && user.role !== 'admin' && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentProfileCreation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/complete-profile" element={<ProtectedRoute allowedRole="student"><ProfileCompletion /></ProtectedRoute>} />
        
        {/* Protected Layout Routes */}
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
          
          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentHome /></ProtectedRoute>} />
          <Route path="/student/leaderboard" element={<ProtectedRoute allowedRole="student"><Leaderboard /></ProtectedRoute>} />
          <Route path="/student/mistakes" element={<ProtectedRoute allowedRole="student"><MistakeBook /></ProtectedRoute>} />
          
          <Route path="/student/syllabus" element={<ProtectedRoute allowedRole="student"><StudentSyllabus /></ProtectedRoute>} />
          
          <Route path="/student/resources" element={<ProtectedRoute allowedRole="student"><StudyMaterialLibrary /></ProtectedRoute>} />
          <Route path="/student/resources/papers" element={<ProtectedRoute allowedRole="student"><PreviousPapers /></ProtectedRoute>} />
          <Route path="/student/resources/keys" element={<ProtectedRoute allowedRole="student"><AnswerKeys /></ProtectedRoute>} />
          <Route path="/student/resources/official-syllabus" element={<ProtectedRoute allowedRole="student"><OfficialSyllabus /></ProtectedRoute>} />
          <Route path="/student/resources/links" element={<ProtectedRoute allowedRole="student"><ExternalLinks /></ProtectedRoute>} />
          
          <Route path="/student/practice" element={<ProtectedRoute allowedRole="student"><Placeholder title="Practice Lab" /></ProtectedRoute>} />
          <Route path="/student/mock" element={<ProtectedRoute allowedRole="student"><Placeholder title="Mock Test Center" /></ProtectedRoute>} />
          <Route path="/student/pyq" element={<ProtectedRoute allowedRole="student"><Placeholder title="PYQ Zone" /></ProtectedRoute>} />
          <Route path="/student/analytics" element={<ProtectedRoute allowedRole="student"><Placeholder title="Analytics" /></ProtectedRoute>} />
          <Route path="/student/revision" element={<ProtectedRoute allowedRole="student"><Placeholder title="Smart Revision" /></ProtectedRoute>} />
          <Route path="/student/mentor" element={<ProtectedRoute allowedRole="student"><Placeholder title="AI Mentor" /></ProtectedRoute>} />
        </Route>

        {/* Fullscreen Test Routes (No Sidebar) */}
        <Route path="/student/test/:testId" element={<ProtectedRoute allowedRole="student"><LiveTest /></ProtectedRoute>} />
        <Route path="/student/result/:testId" element={<ProtectedRoute allowedRole="student"><TestResult /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
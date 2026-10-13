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

// Route Protection Component
const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Direct entry: Redirect root directly to Admin Dashboard on admin-panel branch */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
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
          
          <Route path="/student/practice" element={<Placeholder title="Practice Lab" />} />
          <Route path="/student/mock" element={<Placeholder title="Mock Test Center" />} />
          <Route path="/student/pyq" element={<Placeholder title="PYQ Zone" />} />
          <Route path="/student/analytics" element={<Placeholder title="Analytics" />} />
          <Route path="/student/revision" element={<Placeholder title="Smart Revision" />} />
          <Route path="/student/mentor" element={<Placeholder title="AI Mentor" />} />
        </Route>

        {/* Fullscreen Test Routes (No Sidebar) */}
        <Route path="/student/test/:testId" element={<LiveTest />} />
        <Route path="/student/result/:testId" element={<TestResult />} />

      </Routes>
    </Router>
  );
}

export default App;
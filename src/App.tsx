import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import ExamManagement from './pages/admin/ExamManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminResults from './pages/admin/AdminResults';
import PdfUpload from './pages/admin/PdfUpload';
import PptUpload from './pages/admin/PptUpload';
import CollegePerformance from './pages/college/CollegePerformance';
import CollegeRanks from './pages/college/CollegeRanks';
import StudentExams from './pages/student/StudentExams';
import StudentResults from './pages/student/StudentResults';
import StudentPdfs from './pages/student/StudentPdfs';
import StudentPpts from './pages/student/StudentPpts';
import TestInterface from './pages/student/TestInterface';
import AdsManagement from './pages/admin/AdsManagement';
import MediaManagement from './pages/admin/MediaManagement';
import StudentMedia from './pages/student/StudentMedia';
import MagazineManagement from './pages/admin/MagazineManagement';
import StudentMagazines from './pages/student/StudentMagazines';
import ExamReview from './pages/student/ExamReview';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for token restore from localStorage before routing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/exams" element={
        <DashboardPage>
          <RoleSwitch admin={<ExamManagement />} student={<StudentExams />} college={<Navigate to="/dashboard" replace />} />
        </DashboardPage>
      } />
      <Route path="/dashboard/users"       element={<DashboardPage allowedRoles={['admin']}><UserManagement /></DashboardPage>} />
      <Route path="/dashboard/analytics"   element={<DashboardPage allowedRoles={['admin']}><AdminAnalytics /></DashboardPage>} />
      <Route path="/dashboard/admin-results" element={<DashboardPage allowedRoles={['admin']}><AdminResults /></DashboardPage>} />
      <Route path="/dashboard/pdf-upload"  element={<DashboardPage allowedRoles={['admin']}><PdfUpload /></DashboardPage>} />
      <Route path="/dashboard/ppt-upload"  element={<DashboardPage allowedRoles={['admin']}><PptUpload /></DashboardPage>} />
      <Route path="/dashboard/performance" element={<DashboardPage allowedRoles={['college']}><CollegePerformance /></DashboardPage>} />
      <Route path="/dashboard/ranks"       element={<DashboardPage allowedRoles={['college']}><CollegeRanks /></DashboardPage>} />
      <Route path="/dashboard/results"     element={<DashboardPage allowedRoles={['student']}><StudentResults /></DashboardPage>} />
      <Route path="/dashboard/study-pdfs"  element={<DashboardPage allowedRoles={['student']}><StudentPdfs /></DashboardPage>} />
      <Route path="/dashboard/study-ppts"  element={<DashboardPage allowedRoles={['student']}><StudentPpts /></DashboardPage>} />
      <Route path="/dashboard/media"         element={<DashboardPage allowedRoles={['student']}><StudentMedia /></DashboardPage>} />
      <Route path="/dashboard/ads"           element={<DashboardPage allowedRoles={['admin']}><AdsManagement /></DashboardPage>} />
      <Route path="/dashboard/media-lib"       element={<DashboardPage allowedRoles={['admin']}><MediaManagement /></DashboardPage>} />
      <Route path="/dashboard/magazines" element={<DashboardPage><RoleSwitch admin={<MagazineManagement />} student={<StudentMagazines />} college={<Navigate to="/dashboard" replace />} /></DashboardPage>} />
      <Route path="/test/:examId/:sectionId" element={<TestInterface />} />
      <Route path="/dashboard/review/:attemptId" element={<DashboardPage allowedRoles={['student']}><ExamReview /></DashboardPage>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function RoleSwitch({ admin, student, college }: { admin: React.ReactNode; student: React.ReactNode; college: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'admin')   return <>{admin}</>;
  if (user?.role === 'student') return <>{student}</>;
  if (user?.role === 'college') return <>{college}</>;
  return <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

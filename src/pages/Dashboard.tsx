import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import AdminDashboard from './admin/AdminDashboard';
import CollegeDashboard from './college/CollegeDashboard';
import StudentDashboard from './student/StudentDashboard';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const Content = () => {
    switch (user.role) {
      case 'admin':   return <AdminDashboard />;
      case 'college': return <CollegeDashboard />;
      case 'student': return <StudentDashboard />;
      default:        return <Navigate to="/" replace />;
    }
  };

  return <DashboardLayout><Content /></DashboardLayout>;
}

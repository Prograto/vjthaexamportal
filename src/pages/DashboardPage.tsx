import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function DashboardPage({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <DashboardLayout>{children}</DashboardLayout>;
}

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, attemptAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CollegePerformance() {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.collegeId) { setLoading(false); return; }
    const build = async () => {
      try {
        const res = await userAPI.getByCollege(user.collegeId as string);
        const studs = res.data?.data || [];
        const stats = await Promise.all(studs.map(async (s: any) => {
          try {
            const r = await attemptAPI.getStudentResults(s._id);
            const completed = (r.data?.data || []).filter((a: any) => a.status === 'completed');
            const total = completed.reduce((sum: number, a: any) => sum + (a.obtainedMarks || 0), 0);
            const max   = completed.reduce((sum: number, a: any) => sum + (a.examId?.totalMarks || 0), 0);
            return { ...s, attempts: completed, totalScore: total, totalMax: max, percentage: max ? Math.round((total/max)*100) : 0 };
          } catch { return { ...s, attempts: [], totalScore: 0, totalMax: 0, percentage: 0 }; }
        }));
        setStudentStats(stats.sort((a, b) => b.percentage - a.percentage));
      } catch (err: any) {
        toast.error('Failed to load: ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    build();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Student Performance</h1>
        <p className="text-muted-foreground">Detailed analysis of your students</p>
      </div>
      {studentStats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No students found.</div>
      ) : (
        <div className="space-y-4">
          {studentStats.map((s, i) => (
            <Card key={s._id} className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">#{i+1}</div>
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <p className="text-sm text-muted-foreground">Reg No: {s.regNo || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{s.percentage}%</p>
                    <p className="text-sm text-muted-foreground">{s.totalScore}/{s.totalMax} marks</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${s.percentage}%` }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">{s.attempts.length} Tests</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

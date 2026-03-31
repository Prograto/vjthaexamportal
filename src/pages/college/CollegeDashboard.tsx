import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, attemptAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import { Users, Trophy, TrendingUp, Target, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function CollegeDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const collegeId = user.collegeId as string;
    if (!collegeId) { setLoading(false); return; }
    userAPI.getByCollege(collegeId)
      .then(async res => {
        const studs = res.data?.data || [];
        setStudents(studs);
        // Fetch attempts for each student
        const allAttempts: any[] = [];
        await Promise.all(studs.slice(0, 20).map(async (s: any) => {
          try {
            const r = await attemptAPI.getStudentResults(s._id);
            allAttempts.push(...(r.data?.data || []).filter((a: any) => a.status === 'completed').map((a: any) => ({ ...a, studentName: s.name })));
          } catch {}
        }));
        setAttempts(allAttempts);
      })
      .catch(err => toast.error('Failed to load: ' + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [user]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, r) => a + ((r.obtainedMarks || 0) / (r.examId?.totalMarks || 1)) * 100, 0) / attempts.length)
    : 0;
  const bestRank = attempts.filter(a => a.rank).length
    ? Math.min(...attempts.filter(a => a.rank).map(a => a.rank))
    : null;

  const studentPerf = students.map(s => {
    const sAttempts = attempts.filter(a => a.studentId === s._id || (typeof a.studentId === 'object' && a.studentId?._id === s._id));
    const avg = sAttempts.length
      ? Math.round(sAttempts.reduce((a: number, r: any) => a + ((r.obtainedMarks || 0) / (r.examId?.totalMarks || 1)) * 100, 0) / sAttempts.length)
      : 0;
    return { name: s.name.split(' ')[0], avgScore: avg, tests: sAttempts.length };
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">College Dashboard</h1>
        <p className="text-muted-foreground">Monitor your students' performance</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students.length}                   icon={Users} />
        <StatCard label="Tests Taken"    value={attempts.length}                   icon={Target} />
        <StatCard label="Avg Score"      value={`${avgScore}%`}                    icon={TrendingUp} />
        <StatCard label="Top Rank"       value={bestRank ? `#${bestRank}` : 'N/A'} icon={Trophy} />
      </div>

      {studentPerf.length > 0 && (
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Student Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="hsl(220,70%,50%)" radius={[4,4,0,0]} name="Avg Score %" />
                <Bar dataKey="tests"    fill="hsl(160,60%,45%)" radius={[4,4,0,0]} name="Tests Taken" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Student Results</CardTitle></CardHeader>
        <CardContent className="p-0">
          {attempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No test results yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Exam</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Rank</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a._id} className="border-b last:border-0">
                      <td className="p-4 font-medium">{a.studentName}</td>
                      <td className="p-4">{a.examId?.title || '—'}</td>
                      <td className="p-4">{a.obtainedMarks ?? '—'}/{a.examId?.totalMarks ?? '—'}</td>
                      <td className="p-4">{a.rank ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">#{a.rank}</span> : '—'}</td>
                      <td className="p-4 text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, attemptAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CollegeRanks() {
  const { user } = useAuth();
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.collegeId) { setLoading(false); return; }
    const build = async () => {
      try {
        const res = await userAPI.getByCollege(user.collegeId as string);
        const studs = res.data?.data || [];
        const allAttempts: any[] = [];
        await Promise.all(studs.map(async (s: any) => {
          try {
            const r = await attemptAPI.getStudentResults(s._id);
            (r.data?.data || []).filter((a: any) => a.status === 'completed').forEach((a: any) => {
              allAttempts.push({ ...a, studentName: s.name });
            });
          } catch {}
        }));
        // Group by exam title
        const g: Record<string, any[]> = {};
        allAttempts.forEach(a => {
          const key = a.examId?.title || 'Unknown Exam';
          if (!g[key]) g[key] = [];
          g[key].push(a);
        });
        // Sort each group by score desc and assign ranks
        Object.keys(g).forEach(key => {
          g[key] = g[key].sort((a, b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0)).map((a, i) => ({ ...a, displayRank: i + 1 }));
        });
        setGrouped(g);
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
        <h1 className="text-2xl font-bold">Rank Table</h1>
        <p className="text-muted-foreground">Student rankings by exam</p>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No test results yet.</div>
      ) : (
        Object.entries(grouped).map(([key, results]) => (
          <Card key={key} className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />{key}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium">Rank</th>
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Correct</th>
                    <th className="p-4 font-medium">Wrong</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr key={r._id} className="border-b last:border-0">
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${r.displayRank === 1 ? 'bg-yellow-100 text-yellow-700' : r.displayRank === 2 ? 'bg-gray-100 text-gray-600' : 'bg-muted text-muted-foreground'}`}>
                          #{r.displayRank}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{r.studentName}</td>
                      <td className="p-4">{r.obtainedMarks ?? '—'}/{r.examId?.totalMarks ?? '—'}</td>
                      <td className="p-4 text-green-600">{r.correctAnswers ?? '—'}</td>
                      <td className="p-4 text-red-600">{r.wrongAnswers ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

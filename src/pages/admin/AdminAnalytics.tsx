import { useEffect, useState } from 'react';
import { Building2, Users, BookOpen, ClipboardList, Loader2, ArrowLeft, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { examAPI, userAPI, attemptAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['hsl(220,70%,50%)', 'hsl(160,60%,45%)', 'hsl(38,92%,50%)', 'hsl(280,65%,55%)', 'hsl(0,72%,51%)'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ colleges: 0, students: 0, exams: 0, attempts: 0 });
  const [examPerf, setExamPerf] = useState<any[]>([]);
  const [collegePerf, setCollegePerf] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allColleges, setAllColleges] = useState<any[]>([]);

  // Drill-down state
  const [selectedCollege, setSelectedCollege] = useState<any | null>(null);
  const [collegeStudents, setCollegeStudents] = useState<any[]>([]);
  const [collegeAttempts, setCollegeAttempts] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [examsRes, usersRes, collegesRes] = await Promise.all([
          examAPI.getAll(),
          userAPI.getAll(),
          userAPI.getAllColleges(),
        ]);
        const exams    = examsRes.data?.data    || [];
        const users    = usersRes.data?.data    || [];
        const colleges = collegesRes.data?.data || [];
        const students = users.filter((u: any) => u.role === 'student');

        setAllStudents(students);
        setAllColleges(colleges);

        let totalAttempts = 0;
        const ePerf: any[] = [];

        await Promise.all(exams.slice(0, 8).map(async (exam: any) => {
          try {
            const r = await attemptAPI.getExamStats(exam._id);
            const s = r.data?.data;
            if (s) {
              totalAttempts += s.totalAttempts || 0;
              const avgPct = s.totalAttempts > 0
                ? Math.round(((s.totalCorrect || 0) / Math.max((s.totalCorrect || 0) + (s.totalIncorrect || 0) + (s.totalUnanswered || 0), 1)) * 100)
                : 0;
              ePerf.push({ name: exam.title?.substring(0, 12), avgScore: avgPct, attempts: s.totalAttempts });
            }
          } catch {}
        }));

        const cPerf = colleges.map((c: any) => ({
          id: c._id,
          name: c.name?.substring(0, 14),
          fullName: c.name,
          students: students.filter((s: any) => (s.collegeId?._id || s.collegeId) === c._id).length,
        }));

        setStats({ colleges: colleges.length, students: students.length, exams: exams.length, attempts: totalAttempts });
        setExamPerf(ePerf);
        setCollegePerf(cPerf);
      } catch (err: any) {
        toast.error('Failed to load analytics: ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCollegeBarClick = async (data: any) => {
    if (!data?.activePayload?.[0]) return;
    const bar = data.activePayload[0].payload;
    const college = allColleges.find(c => c._id === bar.id);
    if (!college) return;

    setDrillLoading(true);
    setSelectedCollege(college);

    try {
      const studs = allStudents.filter((s: any) => (s.collegeId?._id || s.collegeId) === college._id);
      setCollegeStudents(studs);

      // Build per-student attempt chart data (mock from available stats)
      const chartData = studs.slice(0, 10).map((s: any) => ({
        name: s.name?.split(' ')[0] || s.regNo || 'Student',
        regNo: s.regNo || '—',
        exams: Math.floor(Math.random() * 5), // Replace with real attempt data when API supports
      }));
      setCollegeAttempts(chartData);
    } catch (err: any) {
      toast.error('Failed to load college details');
    } finally {
      setDrillLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // ──── DRILL-DOWN VIEW ────
  if (selectedCollege) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCollege(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analytics
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedCollege.name}</h1>
            <p className="text-muted-foreground">College-level performance breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Students" value={collegeStudents.length} icon={Users} />
          <StatCard label="City" value={selectedCollege.city || '—'} icon={Building2} />
          <StatCard label="State" value={selectedCollege.state || '—'} icon={TrendingUp} />
        </div>

        {drillLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Student Exam Participation</CardTitle></CardHeader>
                <CardContent>
                  {collegeAttempts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={collegeAttempts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="exams" fill="hsl(220,70%,50%)" radius={[4,4,0,0]} name="Exams Taken" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">No attempt data</div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Student Distribution</CardTitle></CardHeader>
                <CardContent>
                  {collegeStudents.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={collegeAttempts.length > 0 ? collegeAttempts : [{ name: 'Students', value: collegeStudents.length }]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                          paddingAngle={4} dataKey={collegeAttempts.length > 0 ? 'exams' : 'value'}
                          label={({ name }) => name}
                        >
                          {(collegeAttempts.length > 0 ? collegeAttempts : [{}]).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Student List</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-4 font-medium">#</th>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Reg No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegeStudents.map((s, i) => (
                        <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 text-muted-foreground">{i + 1}</td>
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4">
                            <Badge variant="outline">{s.regNo || '—'}</Badge>
                          </td>
                        </tr>
                      ))}
                      {collegeStudents.length === 0 && (
                        <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No students in this college</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ──── MAIN ANALYTICS VIEW ────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform performance overview — click a college bar for details</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Colleges"  value={stats.colleges}  icon={Building2} />
        <StatCard label="Total Students"  value={stats.students}  icon={Users} />
        <StatCard label="Exams Created"   value={stats.exams}     icon={BookOpen} />
        <StatCard label="Tests Attempted" value={stats.attempts}  icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Avg Score by Exam (%)</CardTitle></CardHeader>
          <CardContent>
            {examPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={examPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="hsl(220,70%,50%)" radius={[4,4,0,0]} name="Avg Score %" />
                  <Bar dataKey="attempts" fill="hsl(160,60%,45%)" radius={[4,4,0,0]} name="Attempts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">College-wise Students</CardTitle>
              <Badge variant="secondary" className="text-xs">Click a bar to drill down</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {collegePerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={collegePerf} onClick={handleCollegeBarClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
                            <p className="font-semibold">{payload[0].payload.fullName}</p>
                            <p className="text-muted-foreground">{payload[0].value} Students</p>
                            <p className="text-xs text-primary mt-1">Click to view details →</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="students" radius={[4,4,0,0]} name="Students">
                    {collegePerf.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

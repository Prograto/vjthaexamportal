import { useEffect, useState } from "react";
import { Building2, Users, BookOpen, ClipboardList, TrendingUp, Award } from "lucide-react";
import { examAPI, userAPI, attemptAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#94a3b8"];

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="stat-card bg-white rounded-xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalColleges: 0, totalStudents: 0, totalExams: 0, totalAttempts: 0 });
  const [examChartData, setExamChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState([
    { name: "Correct", value: 0 },
    { name: "Incorrect", value: 0 },
    { name: "Unanswered", value: 0 },
  ]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [examsRes, usersRes, collegesRes] = await Promise.all([
        examAPI.getAll(), userAPI.getAll(), userAPI.getAllColleges(),
      ]);
      const exams = examsRes.data?.data || [];
      const users = usersRes.data?.data || [];
      const colleges = collegesRes.data?.data || [];
      const students = users.filter((u: any) => u.role === "student");

      setExamChartData(exams.slice(0, 6).map((e: any) => ({
        name: e.title.length > 12 ? e.title.substring(0, 12) + '…' : e.title,
        Sections: e.sections?.length || 0,
        Questions: e.totalQuestions || 0,
      })));

      let correct = 0, incorrect = 0, unanswered = 0, totalAttempts = 0;
      const allAttempts: any[] = [];
      await Promise.all(exams.slice(0, 5).map(async (exam: any) => {
        try {
          const s = (await attemptAPI.getExamStats(exam._id)).data?.data;
          if (s) {
            correct += s.totalCorrect || 0;
            incorrect += s.totalIncorrect || 0;
            unanswered += s.totalUnanswered || 0;
            totalAttempts += s.totalAttempts || 0;
            if (s.recentAttempts) allAttempts.push(...s.recentAttempts);
          }
        } catch {}
      }));
      setStats({ totalColleges: colleges.length, totalStudents: students.length, totalExams: exams.length, totalAttempts });
      setPieData([{ name: "Correct", value: correct }, { name: "Incorrect", value: incorrect }, { name: "Unanswered", value: unanswered }]);
      setRecentAttempts(allAttempts.slice(0, 8));
    } catch (err: any) {
      toast.error("Failed to load: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-muted-foreground font-medium">Loading dashboard...</span>
    </div>
  );

  const publishedCount = 0;
  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-0.5">Overview of your examination platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Colleges"  value={stats.totalColleges}  icon={Building2}    color="bg-blue-500"    sub="Registered institutions" />
        <StatCard label="Total Students"  value={stats.totalStudents}  icon={Users}         color="bg-indigo-500"  sub="Active learners" />
        <StatCard label="Exams Created"   value={stats.totalExams}     icon={BookOpen}      color="bg-violet-500"  sub="Published + Drafts" />
        <StatCard label="Tests Attempted" value={stats.totalAttempts}  icon={ClipboardList} color="bg-emerald-500" sub="Total submissions" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <Card className="glass-card lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />Exams Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={examChartData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                  <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Sections"  fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Questions" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No exam data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No attempt data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent results */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />Recent Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Exam</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((r: any, i) => (
                    <tr key={r._id || i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{r.studentName || r.userId?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{r.examTitle || r.examId?.title || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary">{r.score ?? "—"}/{r.totalMarks ?? "—"}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No test results yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

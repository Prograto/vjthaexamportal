import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attemptAPI, examAPI } from '@/services/api';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Trophy, TrendingUp, Target, Loader2, ArrowRight, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BAR_COLORS = ['#8b5cf6','#6366f1','#38bdf8','#818cf8','#a78bfa','#7dd3fc','#c4b5fd','#93c5fd'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts]     = useState<any[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    const id = (user as any)._id || (user as any).id || '';
    Promise.all([
      attemptAPI.getStudentResults(id),
      examAPI.getPublished(),
    ]).then(([attRes, examRes]) => {
      const completed = (attRes.data?.data || []).filter((a: any) => a.status === 'completed');
      setAttempts(completed);
      setTotalExams((examRes.data?.data || []).length);
    }).catch(err => {
      toast.error('Failed to load: ' + (err.response?.data?.message || err.message));
    }).finally(() => setLoading(false));
  }, [user]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, r) => a + ((r.obtainedMarks || 0) / (r.examId?.totalMarks || 1)) * 100, 0) / attempts.length)
    : 0;

  const bestRank = attempts.filter(a => a.rank).length
    ? Math.min(...attempts.filter(a => a.rank).map(a => a.rank))
    : null;

  const chartData = attempts.slice(0, 8).map((a: any) => ({
    name: (a.examId?.title || 'Exam').substring(0, 10),
    score: Math.round(((a.obtainedMarks || 0) / (a.examId?.totalMarks || 1)) * 100),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        <p className="text-sm text-slate-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Welcome hero banner ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 animate-fade-up"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #38bdf8 100%)' }}
      >
        {/* Blobs */}
        <div className="absolute w-64 h-64 rounded-full -top-16 -right-12 animate-blob"
          style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(32px)' }} />
        <div className="absolute w-48 h-48 rounded-full bottom-0 left-1/3 animate-blob"
          style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(24px)', animationDelay: '3s' }} />
        {/* Spinning ring decoration */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-4 border-white/15 hidden md:flex items-center justify-center animate-spin-slow">
          <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-300" />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-violet-200 text-xs font-black uppercase tracking-widest mb-2">Student Dashboard</p>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Hi, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-white/65 text-sm mb-5 max-w-sm">
            {totalExams} exam{totalExams !== 1 ? 's' : ''} are waiting for you. Ready to boost your rank?
          </p>
          <button
            onClick={() => navigate('/dashboard/exams')}
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold text-sm px-5 py-2.5 rounded-xl border border-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Browse Exams <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tests Taken"     value={attempts.length}                   icon={ClipboardList} color="violet" delay={0.06} />
        <StatCard label="Best Rank"       value={bestRank ? `#${bestRank}` : 'N/A'} icon={Trophy}        color="amber"  delay={0.12} />
        <StatCard label="Avg Score"       value={`${avgScore}%`}                    icon={TrendingUp}    color="sky"    delay={0.18} />
        <StatCard label="Available Exams" value={totalExams}                        icon={Target}        color="indigo" delay={0.24} />
      </div>

      {/* ── Chart + Progress panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <Card className="lg:col-span-2 glass-card overflow-hidden animate-fade-up stagger-3">
          <CardHeader className="border-b border-violet-50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800">Performance Overview</CardTitle>
              <span className="text-xs text-slate-400 font-semibold">Last 8 tests</span>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#a0a0c0' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#a0a0c0' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #ede9fe', borderRadius: '12px', fontSize: '12px', boxShadow: '0 8px 24px rgba(139,92,246,0.1)' }}
                    cursor={{ fill: 'rgba(139,92,246,0.06)', radius: 8 }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} name="Score %">
                    {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="w-10 h-10 text-violet-100" />
                <p className="text-slate-300 text-sm font-semibold">No test data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress sidebar */}
        <div className="space-y-4">
          <Card className="glass-card p-5 animate-fade-up stagger-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-violet-500" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Your Progress</h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: 'Tests Done',
                  value: Math.min((attempts.length / 10) * 100, 100),
                  display: `${attempts.length}`,
                  color: 'from-violet-500 to-indigo-500',
                },
                {
                  label: 'Avg Score',
                  value: avgScore,
                  display: `${avgScore}%`,
                  color: 'from-sky-400 to-blue-500',
                },
                {
                  label: 'Best Score',
                  value: attempts.length
                    ? Math.max(...attempts.map(a => Math.round(((a.obtainedMarks || 0) / (a.examId?.totalMarks || 1)) * 100)))
                    : 0,
                  display: attempts.length
                    ? `${Math.max(...attempts.map(a => Math.round(((a.obtainedMarks || 0) / (a.examId?.totalMarks || 1)) * 100)))}%`
                    : '0%',
                  color: 'from-indigo-400 to-violet-500',
                },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-500">{s.label}</span>
                    <span className="font-bold text-slate-700">{s.display}</span>
                  </div>
                  <div className="h-1.5 bg-violet-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(s.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA card */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 animate-fade-up stagger-5"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
            <Target className="w-5 h-5 text-white/70 mb-3 relative z-10" />
            <h3 className="font-black text-white text-sm mb-1 relative z-10">Ready to practice?</h3>
            <p className="text-white/60 text-xs mb-4 relative z-10">Start a mock test and climb the leaderboard!</p>
            <button
              onClick={() => navigate('/dashboard/exams')}
              className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2.5 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 relative z-10"
            >
              Take a Test <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent results table ── */}
      <Card className="glass-card overflow-hidden animate-fade-up stagger-5">
        <CardHeader className="border-b border-violet-50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">Recent Results</CardTitle>
            <button
              onClick={() => navigate('/dashboard/results')}
              className="text-xs text-violet-500 font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {attempts.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-violet-100 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">No attempts yet</p>
              <p className="text-slate-300 text-xs mt-1">Go to Exams and take your first test!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-violet-50/50">
                    <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-wide">Exam</th>
                    <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-wide">Score</th>
                    <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-wide">Rank</th>
                    <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {attempts.slice(0, 5).map((a: any) => {
                    const pct = Math.round(((a.obtainedMarks || 0) / (a.examId?.totalMarks || 1)) * 100);
                    return (
                      <tr key={a._id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-700">{a.examId?.title || '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-semibold">
                              {a.obtainedMarks ?? '—'}/{a.examId?.totalMarks ?? '—'}
                            </span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              pct >= 70 ? 'bg-emerald-50 text-emerald-600'
                              : pct >= 40 ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-500'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {a.rank
                            ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs font-black shadow-sm">#{a.rank}</span>
                            : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs font-medium">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

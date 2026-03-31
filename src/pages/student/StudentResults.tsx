import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { attemptAPI } from '@/services/api';
import { Trophy, TrendingUp, FileText, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentResults() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    const id = (user as any)._id || (user as any).id || '';
    attemptAPI.getStudentResults(id)
      .then(res => {
        const completed = (res.data?.data || []).filter((a: any) => a.status === 'completed');
        setAttempts(completed);
      })
      .catch(err => toast.error('Failed to load results: ' + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      <span className="text-slate-400 font-medium text-sm">Loading results...</span>
    </div>
  );

  // Best attempt by percentage using displayed-question marks
  const getTotal = (a: any) => a.totalDisplayedMarks ?? (a.examId?.totalMarks || 1);

  const best = attempts.length
    ? attempts.reduce((b, a) =>
        ((a.obtainedMarks || 0) / getTotal(a)) > ((b.obtainedMarks || 0) / getTotal(b)) ? a : b
      )
    : null;

  const bestRank = attempts.filter(a => a.rank).length
    ? Math.min(...attempts.filter(a => a.rank).map(a => a.rank))
    : null;

  // Best score percentage — parentheses ensure no ?? / || mixing ambiguity
  const bestPct = best
    ? Math.round(((best.obtainedMarks || 0) / (best.totalDisplayedMarks ?? (best.examId?.totalMarks || 1))) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Results</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">
          {attempts.length} completed test{attempts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary stat cards */}
      {attempts.length > 0 && best && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Tests Completed', value: attempts.length,          icon: FileText,  grad: 'from-violet-500 to-indigo-500', shadow: 'shadow-violet-200' },
            { label: 'Best Score',      value: `${bestPct}%`,            icon: TrendingUp, grad: 'from-teal-400 to-cyan-500',    shadow: 'shadow-teal-200'   },
            { label: 'Best Rank',       value: bestRank ? `#${bestRank}` : 'N/A', icon: Trophy, grad: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-200' },
          ].map((s, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg ${s.shadow} animate-fade-up`}
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <s.icon className="w-5 h-5 text-white/70 mb-3 relative z-10" />
              <div className="text-3xl font-extrabold mb-0.5 relative z-10">{s.value}</div>
              <div className="text-white/70 text-sm font-medium relative z-10">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="glass-card overflow-hidden animate-fade-up stagger-3">
        <div className="px-6 py-4 border-b border-violet-50 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-800">All Results</h2>
          {attempts.length > 0 && (
            <span className="text-xs font-bold text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">
              {attempts.length} record{attempts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {attempts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-violet-200" />
            </div>
            <p className="text-slate-500 font-bold mb-1">No results yet</p>
            <p className="text-slate-300 text-xs">Complete a test to see your scores here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Exam</th>
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Score</th>
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">%</th>
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rank</th>
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50/80">
                {attempts.map((a: any) => {
                  // Use displayed-question marks for accurate score / percentage
                  const displayedTotal = a.totalDisplayedMarks ?? (a.examId?.totalMarks || 1);
                  const pct = Math.round(((a.obtainedMarks || 0) / displayedTotal) * 100);
                  return (
                    <tr key={a._id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-700">{a.examId?.title || '—'}</td>
                      <td className="px-5 py-4 text-slate-500 font-semibold">
                        {a.obtainedMarks ?? '—'} / {displayedTotal}
                        {/* Show "of X total" hint if displayed < full exam */}
                        {a.totalDisplayedMarks != null &&
                         a.examId?.totalMarks != null &&
                         a.totalDisplayedMarks !== a.examId?.totalMarks && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            (of {a.examId.totalMarks} total)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          pct >= 70 ? 'bg-emerald-50 text-emerald-600'
                          : pct >= 40 ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-500'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {a.rank
                          ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs font-extrabold shadow-sm">
                              #{a.rank}
                            </span>
                          : <span className="text-slate-300 text-xs font-bold">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs font-semibold">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'
                        }
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/dashboard/review/${a._id}`)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 hover:border-violet-300 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          View Solutions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

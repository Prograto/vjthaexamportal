import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptAPI } from '@/services/api';
import { questionAPI } from '@/services/api';
import {
  CheckCircle2, XCircle, MinusCircle, ChevronLeft,
  BookOpen, Trophy, Target, Loader2, Lightbulb, Eye, EyeOff,
  BarChart3, Hash, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExamReview() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [filter, setFilter]           = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');

  useEffect(() => {
    if (!attemptId) return;
    attemptAPI.getReview(attemptId)
      .then(res => setData(res.data?.data))
      .catch(err => {
        toast.error('Failed to load review: ' + (err.response?.data?.message || err.message));
        navigate('/dashboard/results');
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      <span className="text-slate-400 font-medium text-sm">Loading review...</span>
    </div>
  );

  if (!data) return null;

  const { attempt, sections } = data;
  const allQuestions: any[] = sections.flatMap((s: any) => s.answers);
  const total    = allQuestions.length;
  const correct  = allQuestions.filter(q => q.result === 'correct').length;
  const wrong    = allQuestions.filter(q => q.result === 'wrong').length;
  const skipped  = allQuestions.filter(q => q.result === 'skipped').length;
  const pct      = total ? Math.round((correct / total) * 100) : 0;

  const filtered = filter === 'all'     ? allQuestions
                 : filter === 'correct' ? allQuestions.filter(q => q.result === 'correct')
                 : filter === 'wrong'   ? allQuestions.filter(q => q.result === 'wrong')
                 : allQuestions.filter(q => q.result === 'skipped');

  const toggleExplanation = (i: number) =>
    setShowExplanations(prev => ({ ...prev, [i]: !prev[i] }));

  const getOptionText = (q: any, optId: string) => {
    const opt = (q.options || []).find((o: any) =>
      (typeof o === 'string' ? o : o.id || o.text) === optId
    );
    return opt ? (typeof opt === 'string' ? opt : opt.text) : optId;
  };

  const renderAnswer = (q: any, ans: any) => {
    if (!ans || (Array.isArray(ans) && ans.length === 0)) return null;
    const ids = Array.isArray(ans) ? ans : [ans];
    return ids.map(id => getOptionText(q, id)).join(', ');
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token   = localStorage.getItem('token');

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/results')}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 text-slate-500 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exam Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {attempt.examId?.title || 'Exam'} · {total} questions
          </p>
        </div>
      </div>

      {/* ── Score Summary ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #38bdf8 100%)' }}
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Big score circle */}
          <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white/30 bg-white/10 shrink-0">
            <div className="text-center">
              <div className="text-3xl font-black text-white leading-none">{pct}%</div>
              <div className="text-white/60 text-[10px] font-semibold mt-0.5">SCORE</div>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            {[
              { label: 'Marks',   value: `${attempt.obtainedMarks ?? 0}/${attempt.examId?.totalMarks ?? total}`, icon: Target },
              { label: 'Correct', value: correct,  icon: CheckCircle2 },
              { label: 'Wrong',   value: wrong,    icon: XCircle      },
              { label: 'Skipped', value: skipped,  icon: MinusCircle  },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-white/70 shrink-0" />
                <div>
                  <div className="text-lg font-black text-white leading-none">{value}</div>
                  <div className="text-white/60 text-xs font-semibold mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {([ 
          { key: 'all',     label: 'All',     count: total,   color: 'violet' },
          { key: 'correct', label: 'Correct', count: correct, color: 'emerald' },
          { key: 'wrong',   label: 'Wrong',   count: wrong,   color: 'rose' },
          { key: 'skipped', label: 'Skipped', count: skipped, color: 'slate' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              filter === tab.key
                ? tab.color === 'violet'  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : tab.color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : tab.color === 'rose'    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-slate-700 text-white border-slate-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Questions ── */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-300 font-semibold">
            No questions in this category.
          </div>
        )}

        {filtered.map((q: any, idx: number) => {
          const globalIdx = allQuestions.indexOf(q);
          const isCorrect  = q.result === 'correct';
          const isWrong    = q.result === 'wrong';
          const isSkipped  = q.result === 'skipped';
          const showExp    = showExplanations[globalIdx];

          const studentAns = renderAnswer(q, q.selectedAnswer);
          const correctAns = renderAnswer(q, q.correctAnswer);

          const borderColor = isCorrect ? 'border-emerald-200' : isWrong ? 'border-rose-200' : 'border-slate-200';
          const topBar      = isCorrect ? 'from-emerald-400 to-teal-500' : isWrong ? 'from-rose-400 to-pink-500' : 'from-slate-300 to-slate-400';

          return (
            <div key={q.questionId} className={`bg-white rounded-2xl border-2 ${borderColor} shadow-sm overflow-hidden`}>
              {/* colour strip */}
              <div className={`h-1 bg-gradient-to-r ${topBar}`} />

              <div className="p-5">
                {/* Q number + result badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                      Q{allQuestions.indexOf(q) + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      {q.questionType}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      +{q.marks} / -{q.negativeMarks}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : isWrong  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : isWrong  ? <XCircle      className="w-3.5 h-3.5" />
                    : <MinusCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? `+${q.marks}` : isWrong ? `-${q.negativeMarks || 0}` : '0'}
                  </div>
                </div>

                {/* Question image */}
                {q.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img
                      src={q.imageUrl.startsWith('http') ? q.imageUrl : `${baseUrl}/questions/${q.questionId}/image?token=${token}`}
                      alt="question"
                      className="w-full max-h-64 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Question text */}
                {q.questionText && (
                  <p className="text-sm font-medium text-slate-800 leading-relaxed mb-4">{q.questionText}</p>
                )}

                {/* Options */}
                {(q.options || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt: any, oi: number) => {
                      const optId   = typeof opt === 'string' ? opt : opt.id || opt.text;
                      const optText = typeof opt === 'string' ? opt : opt.text;

                      const correctIds  = Array.isArray(q.correctAnswer)  ? q.correctAnswer  : [q.correctAnswer];
                      const selectedIds = Array.isArray(q.selectedAnswer) ? q.selectedAnswer : q.selectedAnswer ? [q.selectedAnswer] : [];

                      const isCorrectOpt  = correctIds.includes(optId);
                      const isSelectedOpt = selectedIds.includes(optId);

                      let optStyle = 'border-slate-200 bg-slate-50 text-slate-600';
                      let circleStyle = 'bg-slate-200 text-slate-500';

                      if (isCorrectOpt) {
                        optStyle   = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                        circleStyle = 'bg-emerald-500 text-white';
                      }
                      if (isSelectedOpt && !isCorrectOpt) {
                        optStyle   = 'border-rose-300 bg-rose-50 text-rose-800';
                        circleStyle = 'bg-rose-500 text-white';
                      }

                      return (
                        <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${optStyle}`}>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circleStyle}`}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm font-medium flex-1">{optText}</span>
                          <div className="flex gap-1 shrink-0">
                            {isCorrectOpt  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {isSelectedOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer summary */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3 text-xs">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-500">Your Answer:</span>
                    <span className={`font-semibold ${isSkipped ? 'text-slate-400 italic' : isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {studentAns || 'Not answered'}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="font-bold text-emerald-600">Correct Answer:</span>
                    <span className="font-semibold text-emerald-700">{correctAns || '—'}</span>
                  </div>
                </div>

                {/* Explanation toggle */}
                {q.explanation && (
                  <div>
                    <button
                      onClick={() => toggleExplanation(globalIdx)}
                      className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      {showExp ? 'Hide' : 'Show'} Explanation
                      {showExp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {showExp && (
                      <div className="mt-2 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-sm text-violet-800 leading-relaxed">
                        <span className="font-bold text-violet-600 block mb-1 text-xs uppercase tracking-wide">Explanation</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back button bottom */}
      <div className="pt-2 pb-8">
        <button
          onClick={() => navigate('/dashboard/results')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>
      </div>
    </div>
  );
}

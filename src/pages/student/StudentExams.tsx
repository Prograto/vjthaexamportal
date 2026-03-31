import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, attemptAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Clock, FileQuestion, ChevronRight, Play, Loader2,
  BookOpen, ArrowLeft, Hash, Zap, RotateCcw, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentExams() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [exams, setExams]               = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [loading, setLoading]           = useState(true);

  // Map of examId → completed attempt count (for the current student)
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  // ── Load published exams ──────────────────────────────────────────────────
  useEffect(() => {
    examAPI.getPublished()
      .then(res => setExams(res.data?.data || []))
      .catch(err => toast.error('Failed to load exams: ' + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, []);

  // ── Load attempt counts for each exam ────────────────────────────────────
  useEffect(() => {
    if (!exams.length) return;
    setCountsLoading(true);
    Promise.allSettled(
      exams.map(e =>
        attemptAPI.getAttemptCount(e._id)
          .then(res => ({ examId: e._id, count: res.data?.data?.count ?? 0 }))
          .catch(() => ({ examId: e._id, count: 0 }))
      )
    ).then(results => {
      const map: Record<string, number> = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.examId] = r.value.count;
      });
      setAttemptCounts(map);
    }).finally(() => setCountsLoading(false));
  }, [exams]);

  // ── Section access filter ─────────────────────────────────────────────────
  const canAccessSection = (sec: any): boolean => {
    if (sec.isAccessible === false) return false;
    const u = user as any;
    const stuCourse  = u?.course  || '';
    const stuBranch  = u?.branch  || '';
    const stuCollege = u?.collegeId?._id || u?.collegeId || '';
    if (sec.allowedCourses?.length > 0 && stuCourse && !sec.allowedCourses.includes(stuCourse)) return false;
    if (sec.allowedBranches?.length > 0 && stuBranch && !sec.allowedBranches.includes(stuBranch)) return false;
    if (sec.allowedColleges?.length > 0 && stuCollege) {
      const ids = sec.allowedColleges.map((c: any) => c._id || c);
      if (!ids.includes(stuCollege)) return false;
    }
    return true;
  };

  // ── Compute whether student can still attempt an exam ────────────────────
  // maxAttempts is the lowest non-zero maxAttempts across all sections (0 = unlimited)
  const getExamMaxAttempts = (exam: any): number => {
    const secs = exam.sections || [];
    const nonZero = secs.map((s: any) => s.maxAttempts || 0).filter((v: number) => v > 0);
    return nonZero.length ? Math.min(...nonZero) : 0;
  };

  const canStartExam = (exam: any): boolean => {
    const maxAttempts = getExamMaxAttempts(exam);
    if (maxAttempts === 0) return true;
    return (attemptCounts[exam._id] ?? 0) < maxAttempts;
  };

  // ────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        <p className="text-sm text-slate-400">Loading exams...</p>
      </div>
    </div>
  );

  // ── Exam list ─────────────────────────────────────────────────────────────
  if (!selectedExam) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Available Exams</h1>
            <p className="text-slate-400 text-sm mt-0.5">{exams.length} exam{exams.length !== 1 ? 's' : ''} published</p>
          </div>
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 px-3.5 py-2 rounded-xl">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-violet-600">{exams.length} Active</span>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-violet-300" />
            </div>
            <h3 className="font-bold text-slate-600 mb-1">No exams available yet</h3>
            <p className="text-slate-400 text-sm">Your teacher will publish exams soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-5">
            {exams.map((exam, idx) => {
              const maxAttempts = getExamMaxAttempts(exam);
              const usedAttempts = attemptCounts[exam._id] ?? 0;
              const allowed = canStartExam(exam);
              return (
                <div
                  key={exam._id}
                  onClick={() => allowed && setSelectedExam(exam)}
                  className={`glass-card card-accent-bottom group p-6 flex flex-col gap-4 animate-fade-up ${allowed ? 'cursor-pointer hover:border-violet-200' : 'opacity-75 cursor-not-allowed'}`}
                  style={{ animationDelay: `${idx * 0.07}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform duration-200 ${allowed ? 'bg-gradient-to-br from-violet-500 to-indigo-500 shadow-violet-100 group-hover:scale-110' : 'bg-slate-200'}`}>
                      {allowed
                        ? <BookOpen className="w-5 h-5 text-white" />
                        : <Lock className="w-5 h-5 text-slate-400" />
                      }
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                      {exam.sections?.length || 0} Tests
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${allowed ? 'text-slate-800 group-hover:text-violet-600 transition-colors' : 'text-slate-500'}`}>
                      {exam.title}
                    </h3>
                    {exam.description && <p className="text-slate-400 text-xs line-clamp-2">{exam.description}</p>}
                  </div>

                  {/* Attempt usage badge */}
                  {maxAttempts > 0 && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg w-fit ${allowed ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                      <RotateCcw className="w-3.5 h-3.5" />
                      {allowed
                        ? `${usedAttempts} / ${maxAttempts} attempts used`
                        : `Max ${maxAttempts} attempt${maxAttempts > 1 ? 's' : ''} reached`
                      }
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-violet-50 mt-auto">
                    <span className="text-xs text-slate-400">{exam.sections?.length || 0} section{(exam.sections?.length || 0) !== 1 ? 's' : ''}</span>
                    {allowed
                      ? <div className="flex items-center gap-1 text-violet-500 text-xs font-semibold group-hover:gap-2 transition-all">
                          View Tests <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      : <span className="text-xs text-red-400 font-semibold flex items-center gap-1"><Lock className="w-3 h-3" />Locked</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Section list ──────────────────────────────────────────────────────────
  const maxAttempts  = getExamMaxAttempts(selectedExam);
  const usedAttempts = attemptCounts[selectedExam._id] ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedExam(null)}
          className="w-10 h-10 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{selectedExam.title}</h1>
          <p className="text-slate-400 text-sm">{selectedExam.sections?.length || 0} section{(selectedExam.sections?.length || 0) !== 1 ? 's' : ''}</p>
        </div>
        {maxAttempts > 0 && (
          <div className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl ${usedAttempts < maxAttempts ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            <RotateCcw className="w-3.5 h-3.5" />
            {usedAttempts} / {maxAttempts} attempts used
          </div>
        )}
      </div>

      {(() => {
        const visibleSections = (selectedExam.sections || []).filter(canAccessSection);
        if (!visibleSections.length) return (
          <div className="glass-card p-12 text-center">
            <FileQuestion className="w-10 h-10 text-violet-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No sections available for your course/branch.</p>
          </div>
        );

        return (
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            {visibleSections.map((sec: any, i: number) => {
              const qCount = sec.questionsToAttempt > 0 ? sec.questionsToAttempt : (sec.questions?.length || 0);
              // Section-level max: use section's own maxAttempts if set, else exam's
              const secMax  = sec.maxAttempts || 0;
              const canStart = secMax === 0 || usedAttempts < secMax;

              return (
                <div
                  key={sec._id}
                  className="glass-card p-6 flex flex-col gap-4 hover:border-violet-200 animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 mb-1">{sec.name}</h3>
                      {sec.questionsToAttempt > 0 && sec.questions?.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {sec.questionsToAttempt} of {sec.questions.length} questions will be shown
                        </p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${canStart ? 'bg-violet-50 border border-violet-100' : 'bg-red-50 border border-red-100'}`}>
                      {canStart
                        ? <Play className="w-4 h-4 text-violet-500" />
                        : <Lock className="w-4 h-4 text-red-400" />
                      }
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Clock,        val: `${sec.duration}m`, label: 'Duration'  },
                      { icon: Hash,         val: qCount,             label: 'Questions' },
                      { icon: FileQuestion, val: sec.totalMarks || 0, label: 'Marks'   },
                    ].map(s => (
                      <div key={s.label} className="bg-violet-50/60 border border-violet-100/60 rounded-xl p-2.5 text-center">
                        <s.icon className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <div className="text-sm font-bold text-slate-700">{s.val}</div>
                        <div className="text-[10px] text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attempt limit badge */}
                  {secMax > 0 && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg w-fit ${canStart ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                      <RotateCcw className="w-3 h-3" />
                      {canStart
                        ? `${usedAttempts}/${secMax} attempts used`
                        : `Limit reached (${secMax} attempt${secMax > 1 ? 's' : ''})`
                      }
                    </div>
                  )}

                  {canStart ? (
                    <Button
                      onClick={() => navigate(`/test/${selectedExam._id}/${sec._id}`)}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold border-0 shadow-md shadow-violet-100 gap-2 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Play className="w-4 h-4" />Start Test
                    </Button>
                  ) : (
                    <Button disabled className="w-full h-11 rounded-xl gap-2 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <Lock className="w-4 h-4" />Attempts Exhausted
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

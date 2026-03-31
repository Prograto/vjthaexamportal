import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examAPI, questionAPI, attemptAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle,
  Loader2, CheckCircle2, BookOpen, Hash, Send, Eye, EyeOff, LayoutGrid,
  Maximize
} from 'lucide-react';
import { toast } from 'sonner';

type Status = 'not-visited' | 'answered' | 'not-answered' | 'marked' | 'marked-answered';
type AnswerState = { answer: string | string[] | null; status: Status };

export default function TestInterface() {
  const { examId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'student') {
      toast.error('Only students can take tests.');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [section, setSection]           = useState<any>(null);
  const [questions, setQuestions]       = useState<any[]>([]);
  const [attemptId, setAttemptId]       = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [started, setStarted]           = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen]         = useState(false);
  const [showFsPrompt, setShowFsPrompt]         = useState(false);
  const [fsViolationCount, setFsViolationCount] = useState(0);
  const [showFsWarning, setShowFsWarning]       = useState(false);

  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState<Record<number, AnswerState>>({});
  const [timeLeft, setTimeLeft]         = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showPalette, setShowPalette]   = useState(true);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const submittingRef = useRef(false);
  const answersRef    = useRef(answers);
  answersRef.current  = answers;

  // ── Fullscreen helpers ──────────────────────────────────────────────────────
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
  };

  const isCurrentlyFullscreen = () =>
    !!(document.fullscreenElement || (document as any).webkitFullscreenElement ||
       (document as any).mozFullScreenElement || (document as any).msFullscreenElement);

  // Track fullscreen changes
  useEffect(() => {
    const handler = () => {
      const fs = isCurrentlyFullscreen();
      setIsFullscreen(fs);

      if (started && !submitted && !fs) {
        setFsViolationCount(prev => {
          const next = prev + 1;
          if (next === 1) {
            setShowFsWarning(true);
            toast.error('⚠️ Fullscreen exited! Re-enter fullscreen or your test will be auto-submitted.');
          } else {
            setShowFsWarning(false);
            toast.error('🚨 Fullscreen violated again — test auto-submitted!');
            doSubmit();
          }
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    document.addEventListener('MSFullscreenChange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
      document.removeEventListener('MSFullscreenChange', handler);
    };
  }, [started, submitted]);

  // Load exam data
  useEffect(() => {
    if (!examId || !sectionId) return;
    (async () => {
      try {
        const [examRes, questionsRes] = await Promise.all([
          examAPI.getById(examId),
          questionAPI.getByExamAndSection(examId, sectionId),
        ]);
        const exam = examRes.data?.data;
        const sec  = exam?.sections?.find((s: any) => (s._id || s.id) === sectionId);
        setSection(sec || null);
        const all = questionsRes.data?.data || [];
        const limit    = sec?.questionsToAttempt || 0;
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        const selected = limit > 0 && limit < all.length ? shuffled.slice(0, limit) : shuffled;
        setQuestions(selected);
        const initial: Record<number, AnswerState> = {};
        selected.forEach((_: any, i: number) => { initial[i] = { answer: null, status: 'not-visited' }; });
        if (selected.length > 0) initial[0] = { answer: null, status: 'not-answered' };
        setAnswers(initial);
        setTimeLeft((sec?.duration || 60) * 60);
      } catch (err: any) {
        toast.error('Failed to load exam: ' + (err.response?.data?.message || err.message));
        navigate('/dashboard/exams');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, sectionId]);

  const handleStart = async () => {
    try {
      const res = await attemptAPI.create({ examId });
      setAttemptId(res.data.data._id);
      // Show fullscreen prompt first
      setShowFsPrompt(true);
    } catch (err: any) {
      toast.error('Could not start: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEnterFullscreenAndStart = () => {
    enterFullscreen();
    setShowFsPrompt(false);
    setStarted(true);
  };

  // Timer countdown
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  // Tab-switch detection
  useEffect(() => {
    if (!started || submitted) return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setShowTabWarning(true);
            toast.error('⚠️ Tab switch detected! One more will auto-submit the test.');
          } else {
            setShowTabWarning(false);
            toast.error('🚨 Second tab switch detected — test auto-submitted!');
            doSubmit();
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [started, submitted]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setShowSubmitDialog(false);
    setShowTabWarning(false);
    setShowFsWarning(false);
    // Exit fullscreen on submit
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    try {
      if (attemptId) {
        const sectionAttempts = [{
          sectionId,
          answers: questions.map((q: any, i: number) => ({
            questionId: q._id,
            selectedAnswer: answersRef.current[i]?.answer ?? null,
          })),
        }];
        await attemptAPI.update(attemptId, { sectionAttempts });
        await attemptAPI.submit(attemptId);
      }
      setSubmitted(true);
      toast.success('✅ Test submitted successfully!');
      navigate('/dashboard/results', { replace: true });
    } catch (err: any) {
      toast.error('Submit failed: ' + (err.response?.data?.message || err.message));
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, questions, sectionId, navigate]);

  const getColor = (status: Status, isCurrent: boolean): string => {
    const ring = isCurrent ? ' ring-2 ring-ring ring-offset-1' : '';
    switch (status) {
      case 'answered':        return `bg-emerald-500 text-white${ring}`;
      case 'not-answered':    return `bg-rose-400 text-white${ring}`;
      case 'marked':          return `bg-violet-500 text-white${ring}`;
      case 'marked-answered': return `bg-violet-400 text-white${ring}`;
      default:                return `bg-slate-200 text-slate-600${ring}`;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!section || questions.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <BookOpen className="w-12 h-12 opacity-30" />
      <p className="font-medium">No questions found for this section.</p>
      <Button onClick={() => navigate('/dashboard/exams')}>Back to Exams</Button>
    </div>
  );

  // Instructions screen
  if (!started) {
    const mcqCount = questions.filter((q: any) => q.type === 'mcq').length;
    const msqCount = questions.filter((q: any) => q.type === 'msq').length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{section.name}</h1>
                <p className="text-muted-foreground text-sm">{section.duration} minutes · {questions.length} questions</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Duration',  value: `${section.duration} min`, icon: Clock,         color: 'text-blue-600 bg-blue-50' },
                { label: 'Questions', value: String(questions.length),  icon: Hash,          color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Max Marks', value: String(questions.reduce((a: number, q: any) => a + (q.marks || 0), 0)), icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color.split(' ')[1]}`}>
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color.split(' ')[0]}`} />
                  <div className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {(mcqCount > 0 || msqCount > 0) && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {mcqCount > 0 && <Badge variant="secondary" className="gap-1">{mcqCount} MCQ</Badge>}
                {msqCount > 0 && <Badge variant="secondary" className="gap-1">{msqCount} MSQ</Badge>}
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4 space-y-2 mb-6">
              <h3 className="font-semibold text-sm mb-3">Instructions</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>MCQ — Select one correct option.</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>MSQ — Select all correct options.</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Timer auto-submits the test on expiry.</li>
                <li className="flex items-start gap-2 text-amber-700 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>Tab switching is monitored. <strong>2nd tab switch = auto-submit.</strong></span>
                </li>
                <li className="flex items-start gap-2 text-blue-700 font-medium">
                  <Maximize className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                  <span>The test runs in <strong>fullscreen mode</strong>. Exiting fullscreen twice = auto-submit.</span>
                </li>
              </ul>
            </div>

            <Button className="w-full h-12 text-base font-semibold gap-2 shadow-md" size="lg" onClick={handleStart}>
              <Send className="w-5 h-5" />Start Test
            </Button>
          </CardContent>
        </Card>

        {/* Fullscreen prompt dialog */}
        <Dialog open={showFsPrompt} onOpenChange={() => {}}>
          <DialogContent className="max-w-sm" hideClose>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-700">
                <Maximize className="w-5 h-5" /> Fullscreen Required
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This test must be taken in <strong>fullscreen mode</strong>. The browser will go fullscreen when you click below.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                Exiting fullscreen will be detected. <strong>2nd violation = auto-submit.</strong>
              </div>
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleEnterFullscreenAndStart}>
                <Maximize className="w-4 h-4" /> Enter Fullscreen & Start
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Active test interface
  const question      = questions[currentQ];
  const currentAnswer = answers[currentQ];

  const formatTime = (s: number) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const selectOption = (opt: string) => {
    if (question.type === 'msq') {
      const curr = (currentAnswer?.answer as string[]) || [];
      const next = curr.includes(opt) ? curr.filter(o => o !== opt) : [...curr, opt];
      setAnswers(prev => ({ ...prev, [currentQ]: { answer: next.length ? next : null, status: next.length ? 'answered' : 'not-answered' } }));
    } else {
      setAnswers(prev => ({ ...prev, [currentQ]: { answer: opt, status: 'answered' } }));
    }
  };

  const clearResponse = () => {
    setAnswers(prev => ({ ...prev, [currentQ]: { answer: null, status: 'not-answered' } }));
  };

  const markForReview = () => {
    const has = currentAnswer?.answer;
    setAnswers(prev => ({ ...prev, [currentQ]: { ...currentAnswer, status: has ? 'marked-answered' : 'marked' } }));
  };

  const goTo = (i: number) => {
    setAnswers(prev => {
      if (prev[i]?.status === 'not-visited') {
        return { ...prev, [i]: { answer: null, status: 'not-answered' } };
      }
      return prev;
    });
    setCurrentQ(i);
  };

  const answered    = Object.values(answers).filter(a => ['answered', 'marked-answered'].includes(a.status)).length;
  const notAnswered = Object.values(answers).filter(a => a.status === 'not-answered').length;
  const marked      = Object.values(answers).filter(a => ['marked', 'marked-answered'].includes(a.status)).length;
  const notVisited  = Object.values(answers).filter(a => a.status === 'not-visited').length;
  const progress    = Math.round((answered / questions.length) * 100);
  const isLow       = timeLeft < 300;
  const isCritical  = timeLeft < 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Fullscreen re-enter overlay */}
      {!isFullscreen && started && !submitted && fsViolationCount === 1 && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full border-0 shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="font-bold text-lg">Fullscreen Exited!</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                You exited fullscreen. This is your <strong>first and final warning.</strong>
              </p>
              <p className="text-sm text-destructive font-medium">
                Exiting fullscreen again will <strong>automatically submit</strong> your test.
              </p>
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => { enterFullscreen(); }}>
                <Maximize className="w-4 h-4" /> Re-enter Fullscreen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top bar */}
      <header className="h-14 bg-white border-b shadow-sm flex items-center justify-between px-4 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm truncate">{section.name}</span>
          {tabSwitchCount > 0 && (
            <Badge variant="destructive" className="text-xs shrink-0">⚠ Tabs: {tabSwitchCount}/2</Badge>
          )}
          {fsViolationCount > 0 && (
            <Badge variant="destructive" className="text-xs shrink-0 bg-amber-500">⛶ FS: {fsViolationCount}/2</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${
            isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
            isLow      ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-4 h-4" />{formatTime(timeLeft)}
          </div>
          {!isFullscreen && (
            <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-300" onClick={enterFullscreen}>
              <Maximize className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 lg:hidden"
            onClick={() => setShowMobilePalette(v => !v)}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 hidden sm:flex"
            onClick={() => setShowSubmitDialog(true)} disabled={submitting}>
            <Send className="w-3.5 h-3.5" />Submit
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 p-5 lg:p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                Q {currentQ + 1} / {questions.length}
              </span>
              <Badge variant="outline" className="text-xs uppercase font-semibold">
                {question.type.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                +{question.marks} marks · -{question.negativeMarks} negative
              </span>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-5 mb-5 space-y-3">
              {question.imageUrl && (
                <img
                  src={question.imageUrl.startsWith('http') ? question.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/${question._id}/image?token=${localStorage.getItem('token')}`}
                  alt="question"
                  className="w-full max-h-72 object-contain rounded-lg border bg-slate-50"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {question.text && <p className="text-base font-medium leading-relaxed">{question.text}</p>}
            </div>

            <div className="space-y-2.5">
              {(question.options || []).map((opt: any, i: number) => {
                const optText = typeof opt === 'string' ? opt : opt.text;
                const optId   = typeof opt === 'string' ? opt : (opt.id || opt.text);
                const isSelected = question.type === 'msq'
                  ? ((currentAnswer?.answer as string[]) || []).includes(optId)
                  : currentAnswer?.answer === optId;
                return (
                  <button key={i} onClick={() => selectOption(optId)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50'
                    }`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium">{optText}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="border-t bg-white shadow-sm p-4 flex items-center justify-between shrink-0 sticky bottom-0">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearResponse} className="text-xs">Clear</Button>
              <Button variant="outline" size="sm" onClick={markForReview} className="text-xs gap-1.5">
                <Flag className="w-3.5 h-3.5" />Mark
              </Button>
              <Button variant="destructive" size="sm" className="sm:hidden gap-1" onClick={() => setShowSubmitDialog(true)}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentQ === 0} onClick={() => goTo(currentQ - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" />Prev
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button size="sm" onClick={() => goTo(currentQ + 1)} className="gap-1">
                  Next<ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => setShowSubmitDialog(true)}>
                  <Send className="w-3.5 h-3.5" />Submit Test
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile palette overlay */}
        {showMobilePalette && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobilePalette(false)} />
        )}
        <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t rounded-t-2xl shadow-2xl transition-transform duration-300 ${showMobilePalette ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ maxHeight: '65vh', overflowY: 'auto' }}
        >
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-sm">Question Palette</h3>
            <button onClick={() => setShowMobilePalette(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { goTo(i); setShowMobilePalette(false); }}
                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${getColor(answers[i]?.status || 'not-visited', i === currentQ)}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-500 shrink-0" />Answered ({answered})</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-violet-500 shrink-0" />Marked ({marked})</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-rose-400 shrink-0" />Not Answered ({notAnswered})</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-200 shrink-0" />Not Visited ({notVisited})</span>
            </div>
          </div>
        </div>

        {/* Desktop palette */}
        <aside className={`border-l bg-white shrink-0 overflow-auto transition-all duration-200 ${showPalette ? 'w-64' : 'w-10'} hidden lg:flex lg:flex-col`}>
          <div className="p-3 border-b flex items-center justify-between">
            {showPalette && <h3 className="font-semibold text-sm">Question Palette</h3>}
            <button onClick={() => setShowPalette(v => !v)} className="ml-auto p-1 rounded hover:bg-muted transition-colors">
              {showPalette ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          {showPalette && (
            <>
              <div className="p-3">
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span><span>{answered}/{questions.length}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${getColor(answers[i]?.status || 'not-visited', i === currentQ)}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { cls: 'bg-emerald-500', label: 'Answered',     count: answered },
                    { cls: 'bg-rose-400',    label: 'Not Answered', count: notAnswered },
                    { cls: 'bg-violet-500',  label: 'Marked',       count: marked },
                    { cls: 'bg-slate-200',   label: 'Not Visited',  count: notVisited },
                  ].map(({ cls, label, count }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded ${cls}`} />
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t mt-auto">
                <Button
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Test
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Tab switch warning dialog */}
      <Dialog open={showTabWarning} onOpenChange={() => setShowTabWarning(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />Tab Switch Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">You switched away from the test tab. This is your <strong>first and final warning.</strong></p>
            <p className="text-sm text-destructive font-medium">Switching tabs again will automatically submit your test.</p>
            <Button className="w-full" onClick={() => setShowTabWarning(false)}>I Understand — Continue Test</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen warning dialog */}
      <Dialog open={showFsWarning} onOpenChange={() => setShowFsWarning(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />Fullscreen Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">You exited fullscreen. This is your <strong>first and final warning.</strong></p>
            <p className="text-sm text-destructive font-medium">Exiting fullscreen again will automatically submit your test.</p>
            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => { enterFullscreen(); setShowFsWarning(false); }}>
              <Maximize className="w-4 h-4" />Re-enter Fullscreen & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />Submit Test
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Review your status before submitting. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Answered',     value: answered,         bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Not Answered', value: notAnswered,      bg: 'bg-rose-50',    text: 'text-rose-700' },
                { label: 'Marked',       value: marked,           bg: 'bg-violet-50',  text: 'text-violet-700' },
                { label: 'Total',        value: questions.length, bg: 'bg-slate-50',   text: 'text-slate-700' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${text}`}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            {notAnswered > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {notAnswered} question{notAnswered > 1 ? 's' : ''} unanswered. Are you sure?
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={doSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

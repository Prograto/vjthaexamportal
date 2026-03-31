import { useState, useEffect, useRef } from 'react';
import { examAPI, questionAPI, userAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, BookOpen, Clock, FileQuestion, ChevronRight, Layers,
  Trash2, Loader2, Globe, GlobeLock, Settings2, Hash, AlertCircle,
  FileSpreadsheet, Download, Upload, ImageIcon, X, Info, CheckCircle2,
  Pencil, ShieldCheck, ShieldOff, GraduationCap, BookMarked, Building2, RotateCcw,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Section {
  _id: string; name: string; duration: number;
  questions: any[]; totalMarks: number; questionsToAttempt: number;
  maxAttempts: number;
  isAccessible: boolean;
  allowedCourses: string[];
  allowedBranches: string[];
  allowedColleges: string[];
}
interface Exam {
  _id: string; title: string; description: string;
  sections: Section[]; totalQuestions: number; totalMarks: number; isPublished: boolean;
}

function downloadTemplate() {
  const header = 'Text,Type,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Marks,NegativeMarks,Explanation\n';
  const rows = [
    'What is 2+2?,mcq,1,2,3,4,D,4,1,Basic arithmetic',
    'Which are prime numbers?,msq,2,3,4,5,"B,D",4,1,2 and 5 are prime',
  ].join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'questions_template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadImageTemplate() {
  const header = 'ImageURL,Type,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Marks,NegativeMarks,Explanation\n';
  const rows = [
    'https://example.com/images/question1.png,mcq,Option A,Option B,Option C,Option D,A,4,1,Explanation here',
    'https://example.com/images/question2.jpg,msq,Choice 1,Choice 2,Choice 3,Choice 4,"A,C",4,1,Multi correct explanation',
  ].join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'image_questions_template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function getImageSrc(questionId: string) {
  const base  = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token') || '';
  return `${base}/questions/${questionId}/image?token=${token}`;
}

export default function ExamManagement() {
  const [exams, setExams]               = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [questions, setQuestions]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  const [showAddExam, setShowAddExam]         = useState(false);
  const [showAddSection, setShowAddSection]   = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showBulkUpload, setShowBulkUpload]   = useState(false);
  const [showSectionSettings, setShowSectionSettings] = useState<Section | null>(null);
  const [editSectionDialog, setEditSectionDialog] = useState<Section | null>(null);

  const [esAccessible, setEsAccessible]   = useState(true);
  const [esCourses, setEsCourses]         = useState<string[]>([]);
  const [esBranches, setEsBranches]       = useState<string[]>([]);
  // Add-new inline inputs for courses/branches/subjects
  const [addingCourse, setAddingCourse]   = useState(false);
  const [addingBranch, setAddingBranch]   = useState(false);
  const [newCourseVal, setNewCourseVal]   = useState('');
  const [newBranchVal, setNewBranchVal]   = useState('');
  // Master lists (persist across opens)
  const [masterCourses, setMasterCourses]   = useState<string[]>(['B.Tech','Degree','Inter','M.Tech','MBA','MCA','Diploma']);
  const [masterBranches, setMasterBranches] = useState<string[]>(['CSE','ECE','EEE','ME','CE','IT','AI&ML','MPC','BiPC','CEC']);
  const [colleges, setColleges]             = useState<any[]>([]);
  const [esColleges, setEsColleges]         = useState<string[]>([]);

  const [newExamName, setNewExamName] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newSecName, setNewSecName]         = useState('');
  const [newSecDuration, setNewSecDuration] = useState('60');
  const [newSecQTA, setNewSecQTA]           = useState('0');
  const [newSecMaxAttempts, setNewSecMaxAttempts] = useState('0');
  const [editQTA, setEditQTA]               = useState('0');

  // Edit section form state
  const [esName, setEsName]               = useState('');
  const [esDuration, setEsDuration]       = useState('60');
  const [esQTA, setEsQTA]                 = useState('0');
  const [esMaxAttempts, setEsMaxAttempts] = useState('0');

  // Single question form
  const [qText, setQText]               = useState('');
  const [qType, setQType]               = useState<'mcq' | 'msq'>('mcq');
  const [qOptions, setQOptions]         = useState(['', '', '', '']);
  const [qAnswer, setQAnswer]           = useState('');
  const [qMarks, setQMarks]             = useState('4');
  const [qNegMarks, setQNegMarks]       = useState('1');
  const [qExplanation, setQExplanation] = useState('');
  const [qImage, setQImage]             = useState<File | null>(null);
  const [qImagePreview, setQImagePreview] = useState<string>('');
  const [activeTab, setActiveTab]       = useState<'text' | 'image'>('text');
  const qImageRef = useRef<HTMLInputElement>(null);

  // Bulk Excel (text questions)
  const [bulkFile, setBulkFile]               = useState<File | null>(null);
  const [bulkUploading, setBulkUploading]     = useState(false);
  const [bulkResult, setBulkResult]           = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Bulk Excel (image questions)
  const [showImageBulkUpload, setShowImageBulkUpload]   = useState(false);
  const [imageBulkFile, setImageBulkFile]               = useState<File | null>(null);
  const [imageBulkUploading, setImageBulkUploading]     = useState(false);
  const [imageBulkResult, setImageBulkResult]           = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const imageBulkFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const [examsRes, collegesRes] = await Promise.all([
        examAPI.getAll(),
        userAPI.getAllColleges(),
      ]);
      setExams(examsRes.data?.data || []);
      setColleges(collegesRes.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load exams: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const fetchQuestions = async (examId: string, sectionId: string) => {
    try {
      const res = await questionAPI.getByExamAndSection(examId, sectionId);
      setQuestions(res.data?.data || []);
    } catch { setQuestions([]); }
  };

  const handleAddExam = async () => {
    if (!newExamName.trim()) return;
    setSaving(true);
    try {
      const res = await examAPI.create({ title: newExamName, description: newExamDesc });
      setExams(prev => [...prev, res.data.data]);
      setNewExamName(''); setNewExamDesc('');
      setShowAddExam(false);
      toast.success('Exam created ✓');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDeleteExam = async (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await examAPI.delete(examId);
      setExams(prev => prev.filter(ex => ex._id !== examId));
      toast.success('Exam deleted ✓');
    } catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handlePublishToggle = async (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = exam.isPublished ? await examAPI.unpublish(exam._id) : await examAPI.publish(exam._id);
      const updated = res.data.data;
      setExams(prev => prev.map(ex => ex._id === updated._id ? updated : ex));
      if (selectedExam?._id === updated._id) setSelectedExam(updated);
      toast.success(updated.isPublished ? '✅ Published!' : 'Unpublished ✓');
    } catch (err: any) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleAddSection = async () => {
    if (!selectedExam || !newSecName.trim()) return;
    setSaving(true);
    try {
      const res = await examAPI.addSection(selectedExam._id, {
        name: newSecName, duration: parseInt(newSecDuration) || 60, questionsToAttempt: parseInt(newSecQTA) || 0,
        maxAttempts: parseInt(newSecMaxAttempts) || 0,
      });
      const updatedExam = res.data.data;
      setExams(prev => prev.map(e => e._id === updatedExam._id ? updatedExam : e));
      setSelectedExam(updatedExam);
      setNewSecName(''); setNewSecDuration('60'); setNewSecQTA('0'); setNewSecMaxAttempts('0');
      setShowAddSection(false);
      toast.success('Section saved ✓');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDeleteSection = async (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await examAPI.deleteSection(selectedExam!._id, sectionId);
      const updated = res.data.data;
      setExams(prev => prev.map(ex => ex._id === updated._id ? updated : ex));
      setSelectedExam(updated);
      toast.success('Section deleted ✓');
    } catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleUpdateSectionQTA = async () => {
    if (!showSectionSettings || !selectedExam) return;
    setSaving(true);
    try {
      const res = await examAPI.update(selectedExam._id, {
        sections: selectedExam.sections.map(s =>
          s._id === showSectionSettings._id ? { ...s, questionsToAttempt: parseInt(editQTA) || 0 } : s
        ),
      });
      const updated = res.data.data;
      setExams(prev => prev.map(e => e._id === updated._id ? updated : e));
      setSelectedExam(updated);
      setShowSectionSettings(null);
      toast.success('Section settings updated ✓');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const openEditSection = (sec: Section) => {
    setEditSectionDialog(sec);
    setEsName(sec.name);
    setEsDuration(String(sec.duration || 60));
    setEsQTA(String(sec.questionsToAttempt || 0));
    setEsMaxAttempts(String(sec.maxAttempts || 0));
    setEsAccessible(sec.isAccessible !== false);
    setEsCourses(sec.allowedCourses || []);
    setEsBranches(sec.allowedBranches || []);
    setEsColleges(sec.allowedColleges?.map((c:any) => c._id || c) || []);
    setAddingCourse(false); setAddingBranch(false);
    setNewCourseVal(''); setNewBranchVal('');
  };

  const handleEditSection = async () => {
    if (!editSectionDialog || !selectedExam) return;
    if (!esName.trim()) return toast.error('Section name is required');
    setSaving(true);
    try {
      const res = await examAPI.updateSection(selectedExam._id, editSectionDialog._id, {
        name: esName.trim(),
        duration: parseInt(esDuration) || 60,
        questionsToAttempt: parseInt(esQTA) || 0,
        maxAttempts: parseInt(esMaxAttempts) || 0,
        isAccessible: esAccessible,
        allowedCourses: esCourses,
        allowedBranches: esBranches,
        allowedColleges: esColleges,
      });
      const updatedExam = res.data.data;
      setExams(prev => prev.map(e => e._id === updatedExam._id ? updatedExam : e));
      setSelectedExam(updatedExam);
      setEditSectionDialog(null);
      toast.success('Section updated ✓');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleSelectSection = (sec: Section) => {
    setSelectedSection(sec);
    fetchQuestions(selectedExam!._id, sec._id);
  };

  const resetQuestionForm = () => {
    setQText(''); setQOptions(['', '', '', '']); setQAnswer('');
    setQMarks('4'); setQNegMarks('1'); setQExplanation('');
    setQImage(null);
    if (qImagePreview) URL.revokeObjectURL(qImagePreview);
    setQImagePreview('');
    if (qImageRef.current) qImageRef.current.value = '';
    setActiveTab('text');
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    setQImage(file);
    if (qImagePreview) URL.revokeObjectURL(qImagePreview);
    setQImagePreview(URL.createObjectURL(file));
  };

  // ── FIXED: guard now allows image-only questions ──────────────────────────
  const handleAddQuestion = async () => {
    if (!selectedSection) return;
    // Must have text OR image
    if (!qText.trim() && !qImage) {
      toast.error('Question must have text or an image');
      return;
    }
    setSaving(true);
    try {
      const questionData: any = {
        examId:        selectedExam!._id,
        sectionId:     selectedSection._id,
        text:          qText.trim(),
        type:          qType,
        marks:         parseInt(qMarks) || 4,
        negativeMarks: parseInt(qNegMarks) || 0,
        explanation:   qExplanation,
      };
      if (qType === 'mcq' || qType === 'msq') {
        const filteredOpts = qOptions.filter(o => o.trim());
        questionData.options = JSON.stringify(
          filteredOpts.map((text, i) => ({ id: String.fromCharCode(65 + i), text }))
        );
        questionData.correctAnswer = qType === 'msq'
          ? JSON.stringify(qAnswer.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))
          : qAnswer.trim().toUpperCase();
      }
      await questionAPI.create(questionData, qImage);

      const examRes = await examAPI.getById(selectedExam!._id);
      const updatedExam = examRes.data.data;
      setExams(prev => prev.map(e => e._id === updatedExam._id ? updatedExam : e));
      setSelectedExam(updatedExam);
      const refreshedSec = updatedExam.sections.find((s: Section) => s._id === selectedSection._id);
      if (refreshedSec) setSelectedSection(refreshedSec);
      fetchQuestions(selectedExam!._id, selectedSection._id);
      resetQuestionForm();
      setShowAddQuestion(false);
      toast.success('Question saved ✓');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !selectedSection || !selectedExam) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const res = await questionAPI.bulkUpload(bulkFile, selectedExam._id, selectedSection._id);
      const result = res.data.data;
      setBulkResult(result);
      if (result.created > 0) {
        const examRes = await examAPI.getById(selectedExam._id);
        const upd = examRes.data.data;
        setExams(prev => prev.map(e => e._id === upd._id ? upd : e));
        setSelectedExam(upd);
        const s = upd.sections.find((s: Section) => s._id === selectedSection._id);
        if (s) setSelectedSection(s);
        fetchQuestions(selectedExam._id, selectedSection._id);
      }
      toast.success(`${result.created} questions imported!`);
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally { setBulkUploading(false); }
  };

  const handleImageBulkUpload = async () => {
    if (!imageBulkFile || !selectedSection || !selectedExam) return;
    setImageBulkUploading(true);
    setImageBulkResult(null);
    try {
      const res = await questionAPI.bulkUpload(imageBulkFile, selectedExam._id, selectedSection._id);
      const result = res.data.data;
      setImageBulkResult(result);
      if (result.created > 0) {
        const examRes = await examAPI.getById(selectedExam._id);
        const upd = examRes.data.data;
        setExams(prev => prev.map(e => e._id === upd._id ? upd : e));
        setSelectedExam(upd);
        const s = upd.sections.find((s: Section) => s._id === selectedSection._id);
        if (s) setSelectedSection(s);
        fetchQuestions(selectedExam._id, selectedSection._id);
      }
      toast.success(`${result.created} image questions imported!`);
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally { setImageBulkUploading(false); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await questionAPI.delete(questionId);
      setQuestions(prev => prev.filter(q => q._id !== questionId));
      const examRes = await examAPI.getById(selectedExam!._id);
      const updated = examRes.data.data;
      setExams(prev => prev.map(e => e._id === updated._id ? updated : e));
      setSelectedExam(updated);
      toast.success('Question deleted ✓');
    } catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const canSaveQuestion = !!selectedSection && (qText.trim().length > 0 || qImage !== null);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-muted-foreground font-medium">Loading exams...</span>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Create exam → Add sections → Add questions → <strong className="text-foreground">Publish</strong>
          </p>
        </div>
        <Dialog open={showAddExam} onOpenChange={setShowAddExam}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-1.5 text-sm" size="sm">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Create Exam</span><span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Create New Exam</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Exam Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g., JEE Main 2025" value={newExamName} onChange={e => setNewExamName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Brief description" value={newExamDesc} onChange={e => setNewExamDesc(e.target.value)} rows={3} />
              </div>
              <Button onClick={handleAddExam} className="w-full" disabled={saving || !newExamName.trim()}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ══════════════ EXAM LIST ══════════════ */}
      {!selectedExam && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {exams.map(exam => (
            <Card key={exam._id}
              className={`exam-card cursor-pointer ${exam.isPublished ? 'exam-card-published' : 'exam-card-draft'}`}
              onClick={() => setSelectedExam(exam)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{exam.title}</h3>
                    {exam.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className={`w-8 h-8 ${exam.isPublished ? 'text-green-600' : 'text-muted-foreground'}`}
                      onClick={e => handlePublishToggle(exam, e)}>
                      {exam.isPublished ? <Globe className="w-4 h-4" /> : <GlobeLock className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={e => handleDeleteExam(exam._id, e)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="gap-1 text-xs"><Layers className="w-3 h-3" />{exam.sections?.length || 0} Sections</Badge>
                  <Badge variant="secondary" className="gap-1 text-xs"><FileQuestion className="w-3 h-3" />{exam.totalQuestions || 0} Qs</Badge>
                  {exam.isPublished
                    ? <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">Published</Badge>
                    : <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Draft</Badge>}
                </div>
                <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground gap-1">
                  Open <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          ))}
          {exams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-medium">No exams yet</p>
              <p className="text-sm mt-1">Click "Create Exam" to get started</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ SECTION LIST ══════════════ */}
      {selectedExam && !selectedSection && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setSelectedExam(null)} className="gap-1.5 text-xs sm:text-sm">← Back</Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">{selectedExam.title}</h2>
              {selectedExam.description && <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedExam.description}</p>}
            </div>
            <Button size="sm"
              variant={selectedExam.isPublished ? 'outline' : 'default'}
              className={`text-xs sm:text-sm gap-1.5 ${selectedExam.isPublished ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}`}
              onClick={e => handlePublishToggle(selectedExam, e)}>
              {selectedExam.isPublished ? <><GlobeLock className="w-4 h-4" /><span className="hidden sm:inline">Unpublish</span></> : <><Globe className="w-4 h-4" /><span className="hidden sm:inline">Publish</span></>}
            </Button>
          </div>

          <div className={`flex items-center gap-2.5 rounded-xl p-3 text-xs sm:text-sm ${!selectedExam.isPublished ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
            {!selectedExam.isPublished
              ? <><AlertCircle className="w-4 h-4 shrink-0 text-amber-500" /><span>Draft — students cannot see this.</span></>
              : <><Globe className="w-4 h-4 shrink-0 text-green-500" /><span>Published — students can see and take it.</span></>}
          </div>

          <div className="flex justify-end">
            <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs sm:text-sm"><Plus className="w-4 h-4" />Add Section</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Create Section</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Section Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Grand Test 1" value={newSecName} onChange={e => setNewSecName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Duration (min)</Label>
                      <Input type="number" value={newSecDuration} onChange={e => setNewSecDuration(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-primary" />Qs for Students</Label>
                      <Input type="number" min="0" value={newSecQTA} onChange={e => setNewSecQTA(e.target.value)} placeholder="0 = all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-amber-500" />Max Attempts</Label>
                    <Input type="number" min="0" value={newSecMaxAttempts} onChange={e => setNewSecMaxAttempts(e.target.value)} placeholder="0 = unlimited" />
                    <p className="text-[10px] text-muted-foreground">0 = students can retake unlimited times</p>
                  </div>
                  <div className="bg-muted/30 border rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                    You can configure course, branch, subject access and toggle section visibility after creation using the <strong className="text-foreground">edit (✏️) button</strong> on the section card.
                  </div>
                  <Button onClick={handleAddSection} className="w-full" disabled={saving || !newSecName.trim()}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Section
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {selectedExam.sections?.map(sec => {
              const totalQ = sec.questions?.length || 0;
              return (
                <Card key={sec._id} className="glass-card cursor-pointer border-l-4 border-l-primary/40 hover:border-l-primary"
                  onClick={() => handleSelectSection(sec)}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{sec.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{sec.duration}m</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileQuestion className="w-3 h-3" />{totalQ} Qs</span>
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <Hash className="w-3 h-3" />{sec.questionsToAttempt > 0 ? `${sec.questionsToAttempt} shown` : 'All shown'}
                          </span>
                          {sec.maxAttempts > 0 && (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                              <RotateCcw className="w-3 h-3" />{sec.maxAttempts} attempt{sec.maxAttempts > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {sec.questionsToAttempt > 0 && totalQ > 0 && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-xs text-blue-700">
                            Students attempt <strong>{sec.questionsToAttempt}</strong> of <strong>{totalQ}</strong>
                          </div>
                        )}
                        {/* Access status */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sec.isAccessible === false
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 border border-red-200 text-red-600 rounded-full px-2 py-0.5"><ShieldOff className="w-2.5 h-2.5"/>Access Off</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2 py-0.5"><ShieldCheck className="w-2.5 h-2.5"/>Open</span>
                          }
                          {(sec.allowedCourses?.length > 0) && sec.allowedCourses.map(c => (
                            <span key={c} className="text-[10px] bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-2 py-0.5">{c}</span>
                          ))}
                          {(sec.allowedBranches?.length > 0) && sec.allowedBranches.map(b => (
                            <span key={b} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">{b}</span>
                          ))}
                          {(sec.allowedColleges?.length > 0) && (
                            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-2 py-0.5">
                              {sec.allowedColleges.length} college{sec.allowedColleges.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-primary"
                          onClick={e => { e.stopPropagation(); openEditSection(sec); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive"
                          onClick={e => handleDeleteSection(sec._id, e)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!selectedExam.sections || selectedExam.sections.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">No sections yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ QUESTION LIST ══════════════ */}
      {selectedExam && selectedSection && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setSelectedSection(null); setQuestions([]); }} className="gap-1.5 text-xs sm:text-sm">← Back</Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">{selectedSection.name}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {questions.length} total {selectedSection.questionsToAttempt > 0 && `· ${selectedSection.questionsToAttempt} shown`}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">{questions.length} Qs</Badge>
          </div>

          {selectedSection.questionsToAttempt > 0 && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs sm:text-sm text-blue-800">
              <Hash className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <span>Students see <strong>{selectedSection.questionsToAttempt}</strong> random from <strong>{questions.length}</strong> total.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap justify-end">

            {/* ── Excel Bulk Upload (Text Questions) ── */}
            <Dialog open={showBulkUpload} onOpenChange={v => { setShowBulkUpload(v); if (!v) { setBulkFile(null); setBulkResult(null); if (bulkFileRef.current) bulkFileRef.current.value = ''; }}}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /><span className="hidden sm:inline">Upload Excel</span><span className="sm:hidden">Excel</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />Bulk Upload Questions
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-slate-50 border rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />Column Format
                    </p>
                    <div className="overflow-x-auto -mx-1">
                      <table className="text-[10px] sm:text-[11px] font-mono w-full border-collapse min-w-max">
                        <thead>
                          <tr className="bg-slate-100">
                            {['Text','Type','OptA','OptB','OptC','OptD','Answer','Marks','Neg','Explanation'].map(h => (
                              <th key={h} className="border border-slate-200 px-1.5 py-1 text-slate-700 text-left font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-200 px-1.5 py-1">2+2=?</td>
                            <td className="border border-slate-200 px-1.5 py-1">mcq</td>
                            <td className="border border-slate-200 px-1.5 py-1">1</td>
                            <td className="border border-slate-200 px-1.5 py-1">2</td>
                            <td className="border border-slate-200 px-1.5 py-1">3</td>
                            <td className="border border-slate-200 px-1.5 py-1">4</td>
                            <td className="border border-slate-200 px-1.5 py-1">D</td>
                            <td className="border border-slate-200 px-1.5 py-1">4</td>
                            <td className="border border-slate-200 px-1.5 py-1">1</td>
                            <td className="border border-slate-200 px-1.5 py-1">Math</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-500">MCQ: single letter A/B/C/D. MSQ: comma e.g. A,C</p>
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7 text-emerald-700" onClick={downloadTemplate}>
                      <Download className="w-3 h-3" />Download Template CSV
                    </Button>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-colors ${bulkFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-border hover:border-emerald-300 hover:bg-muted/20'}`}
                    onClick={() => bulkFileRef.current?.click()}
                  >
                    {bulkFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileSpreadsheet className="w-7 h-7 text-emerald-500 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium truncate">{bulkFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setBulkFile(null); if (bulkFileRef.current) bulkFileRef.current.value = ''; }}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="text-sm text-muted-foreground">Tap to select .xlsx, .xls, or .csv</p>
                      </div>
                    )}
                    <input ref={bulkFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) setBulkFile(e.target.files[0]); }} />
                  </div>

                  {bulkResult && (
                    <div className={`rounded-xl p-3 border space-y-1 ${bulkResult.created > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {bulkResult.created} created · {bulkResult.skipped} skipped
                      </div>
                      {bulkResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{e}
                        </p>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleBulkUpload} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={bulkUploading || !bulkFile}>
                    {bulkUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : <><Upload className="w-4 h-4" />Import Questions</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Excel Bulk Upload (Image Questions) ── */}
            <Dialog open={showImageBulkUpload} onOpenChange={v => { setShowImageBulkUpload(v); if (!v) { setImageBulkFile(null); setImageBulkResult(null); if (imageBulkFileRef.current) imageBulkFileRef.current.value = ''; }}}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm border-violet-300 text-violet-700 hover:bg-violet-50">
                  <ImageIcon className="w-4 h-4 text-violet-500" /><span className="hidden sm:inline">Upload Image Excel</span><span className="sm:hidden">Img Excel</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="w-5 h-5 text-violet-500" />Bulk Upload Image Questions
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Info Banner */}
                  <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-800">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />
                    <span>Same format as the regular template — replace the <strong>Text</strong> column with an <strong>ImageURL</strong> column containing direct image links (JPG, PNG, etc.).</span>
                  </div>

                  {/* Column Format Preview */}
                  <div className="bg-slate-50 border rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />Column Format
                    </p>
                    <div className="overflow-x-auto -mx-1">
                      <table className="text-[10px] sm:text-[11px] font-mono w-full border-collapse min-w-max">
                        <thead>
                          <tr className="bg-violet-50">
                            {['ImageURL','Type','OptA','OptB','OptC','OptD','Answer','Marks','Neg','Explanation'].map(h => (
                              <th key={h} className={`border border-slate-200 px-1.5 py-1 text-left font-semibold whitespace-nowrap ${h === 'ImageURL' ? 'text-violet-700' : 'text-slate-700'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-200 px-1.5 py-1 text-violet-600 max-w-[120px] truncate">https://…/q1.png</td>
                            <td className="border border-slate-200 px-1.5 py-1">mcq</td>
                            <td className="border border-slate-200 px-1.5 py-1">Opt A</td>
                            <td className="border border-slate-200 px-1.5 py-1">Opt B</td>
                            <td className="border border-slate-200 px-1.5 py-1">Opt C</td>
                            <td className="border border-slate-200 px-1.5 py-1">Opt D</td>
                            <td className="border border-slate-200 px-1.5 py-1">A</td>
                            <td className="border border-slate-200 px-1.5 py-1">4</td>
                            <td className="border border-slate-200 px-1.5 py-1">1</td>
                            <td className="border border-slate-200 px-1.5 py-1">Reason</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-500">The <span className="font-semibold text-violet-600">ImageURL</span> must be a publicly accessible direct link to an image file.</p>
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7 text-violet-700" onClick={downloadImageTemplate}>
                      <Download className="w-3 h-3" />Download Image Template CSV
                    </Button>
                  </div>

                  {/* Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-colors ${imageBulkFile ? 'border-violet-400 bg-violet-50/50' : 'border-border hover:border-violet-300 hover:bg-muted/20'}`}
                    onClick={() => imageBulkFileRef.current?.click()}
                  >
                    {imageBulkFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileSpreadsheet className="w-7 h-7 text-violet-500 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium truncate">{imageBulkFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(imageBulkFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setImageBulkFile(null); if (imageBulkFileRef.current) imageBulkFileRef.current.value = ''; }}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <FileSpreadsheet className="w-7 h-7 text-violet-400" />
                          <ImageIcon className="w-6 h-6 text-violet-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">Tap to select .xlsx, .xls, or .csv</p>
                        <p className="text-xs text-muted-foreground">with ImageURL column</p>
                      </div>
                    )}
                    <input ref={imageBulkFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) setImageBulkFile(e.target.files[0]); }} />
                  </div>

                  {/* Result */}
                  {imageBulkResult && (
                    <div className={`rounded-xl p-3 border space-y-1 ${imageBulkResult.created > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {imageBulkResult.created} created · {imageBulkResult.skipped} skipped
                      </div>
                      {imageBulkResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{e}
                        </p>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleImageBulkUpload} className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
                    disabled={imageBulkUploading || !imageBulkFile}>
                    {imageBulkUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : <><Upload className="w-4 h-4" />Import Image Questions</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Add Question ── */}
            <Dialog open={showAddQuestion} onOpenChange={v => { setShowAddQuestion(v); if (!v) resetQuestionForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs sm:text-sm"><Plus className="w-4 h-4" />Add Question</Button>
              </DialogTrigger>

              <DialogContent className="w-[95vw] sm:w-auto sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b shrink-0">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <FileQuestion className="w-5 h-5 text-primary" />Add Question
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                  <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'text' | 'image')} className="w-full">
                    <div className="px-4 sm:px-6 pt-4">
                      <TabsList className="w-full">
                        <TabsTrigger value="text" className="flex-1 gap-1.5 text-xs sm:text-sm">
                          <FileQuestion className="w-3.5 h-3.5" />Text Question
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex-1 gap-1.5 text-xs sm:text-sm">
                          <ImageIcon className="w-3.5 h-3.5" />Image Question
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* ── TEXT TAB ── */}
                    <TabsContent value="text" className="px-4 sm:px-6 pb-4 space-y-4 mt-4">
                      <TypeSelector qType={qType} setQType={setQType} />
                      <div className="space-y-1.5">
                        <Label>Question Text <span className="text-destructive">*</span></Label>
                        <Textarea placeholder="Type the question here…" value={qText} onChange={e => setQText(e.target.value)} rows={3} className="text-sm" />
                      </div>
                      <OptionsBlock qType={qType} qOptions={qOptions} setQOptions={setQOptions} qAnswer={qAnswer} setQAnswer={setQAnswer} />
                      <MarksBlock qMarks={qMarks} setQMarks={setQMarks} qNegMarks={qNegMarks} setQNegMarks={setQNegMarks} />
                      <ExplanationBlock qExplanation={qExplanation} setQExplanation={setQExplanation} />
                    </TabsContent>

                    {/* ── IMAGE TAB ── */}
                    <TabsContent value="image" className="px-4 sm:px-6 pb-4 space-y-4 mt-4">
                      <TypeSelector qType={qType} setQType={setQType} />

                      {/* Image upload zone */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                          Question Image <span className="text-destructive">*</span>
                        </Label>
                        <div
                          className={`border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                            qImagePreview ? 'border-violet-400 bg-violet-50/20' : 'border-border hover:border-violet-300 hover:bg-slate-50'
                          }`}
                          onClick={() => qImageRef.current?.click()}
                        >
                          {qImagePreview ? (
                            <div className="relative">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setQImage(null);
                                  if (qImagePreview) URL.revokeObjectURL(qImagePreview);
                                  setQImagePreview('');
                                  if (qImageRef.current) qImageRef.current.value = '';
                                }}
                                className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <img src={qImagePreview} alt="question preview" className="w-full max-h-56 sm:max-h-72 object-contain bg-slate-50" />
                              <div className="p-2 text-center">
                                <p className="text-xs text-muted-foreground truncate">{qImage?.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-3">
                              <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center">
                                <ImageIcon className="w-7 h-7 text-violet-500" />
                              </div>
                              <div className="text-center px-4">
                                <p className="font-medium text-sm">Tap to upload question image</p>
                                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, GIF, WebP · max 10 MB</p>
                              </div>
                            </div>
                          )}
                          <input ref={qImageRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
                        </div>

                        {/* Show success indicator once image selected */}
                        {qImage && (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Image selected: <span className="font-medium truncate">{qImage.name}</span>
                            <span className="shrink-0 text-emerald-600">({(qImage.size / 1024).toFixed(0)} KB)</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label>Question Text <span className="text-xs text-muted-foreground font-normal">(optional — add if image needs caption)</span></Label>
                        <Textarea placeholder="Optional additional text for the question…" value={qText} onChange={e => setQText(e.target.value)} rows={2} className="text-sm" />
                      </div>

                      <OptionsBlock qType={qType} qOptions={qOptions} setQOptions={setQOptions} qAnswer={qAnswer} setQAnswer={setQAnswer} />
                      <MarksBlock qMarks={qMarks} setQMarks={setQMarks} qNegMarks={qNegMarks} setQNegMarks={setQNegMarks} />
                      <ExplanationBlock qExplanation={qExplanation} setQExplanation={setQExplanation} />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="px-4 sm:px-6 pb-5 pt-3 border-t shrink-0 bg-background">
                  {!canSaveQuestion && (
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      {activeTab === 'image' ? 'Upload an image to save this question' : 'Enter question text to save'}
                    </p>
                  )}
                  <Button onClick={handleAddQuestion} className="w-full h-11 text-sm" disabled={saving || !canSaveQuestion}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Question'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Question Cards */}
          <div className="space-y-2 sm:space-y-3">
            {questions.map((q, i) => (
              <Card key={q._id} className="glass-card overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs sm:text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] sm:text-xs uppercase font-semibold">{q.type}</Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">+{q.marks} / -{q.negativeMarks}</span>
                        {q.imageUrl && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-violet-200 text-violet-700 gap-1">
                            <ImageIcon className="w-2.5 h-2.5" />Image
                          </Badge>
                        )}
                      </div>
                      {q.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={q.imageUrl.startsWith('http') ? q.imageUrl : getImageSrc(q._id)}
                            alt="question"
                            className="max-h-36 sm:max-h-48 w-auto rounded-lg border object-contain bg-slate-50"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      {q.text && <p className="text-xs sm:text-sm font-medium">{q.text}</p>}
                      {q.options?.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {q.options.map((opt: any, j: number) => {
                            const id = opt.id || String.fromCharCode(65 + j);
                            const isCorrect = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(id) : q.correctAnswer === id;
                            return (
                              <span key={j} className={`text-xs rounded px-2 py-1 flex items-center gap-1 ${isCorrect ? 'bg-green-50 border border-green-200 text-green-700' : 'text-muted-foreground bg-muted/60'}`}>
                                <span className="font-bold">{id}.</span>{opt.text || opt}
                                {isCorrect && <span className="ml-auto text-green-500 font-bold text-xs">✓</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">{q.explanation}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive shrink-0"
                      onClick={() => handleDeleteQuestion(q._id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileQuestion className="w-10 h-10 opacity-30 mb-3" />
                <p className="font-medium text-sm">No questions yet</p>
                <p className="text-xs mt-1">Add manually or upload via Excel</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Section Dialog ── */}
      <Dialog open={!!editSectionDialog} onOpenChange={v => { if (!v) setEditSectionDialog(null); }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="w-5 h-5 text-primary" />Edit Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">

            {/* Basic info */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Section Name <span className="text-destructive">*</span></Label>
                <Input value={esName} onChange={e => setEsName(e.target.value)} placeholder="e.g., Grand Test 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />Duration (min)</Label>
                  <Input type="number" min="1" value={esDuration} onChange={e => setEsDuration(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-primary" />Qs for Students</Label>
                  <Input type="number" min="0" value={esQTA} onChange={e => setEsQTA(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">0 = show all</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-amber-500" />Max Attempts</Label>
                <Input type="number" min="0" value={esMaxAttempts} onChange={e => setEsMaxAttempts(e.target.value)} placeholder="0 = unlimited" />
                <p className="text-[10px] text-muted-foreground">0 = students can retake unlimited times. If admin deletes a result, the attempt count resets.</p>
              </div>
            </div>

            {/* Access toggle */}
            <div className="border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {esAccessible
                    ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    : <ShieldOff className="w-4 h-4 text-red-500" />
                  }
                  <div>
                    <p className="text-sm font-semibold">Section Access</p>
                    <p className="text-xs text-muted-foreground">
                      {esAccessible ? 'Students can see and attempt this section' : 'Section is hidden from all students'}
                    </p>
                  </div>
                </div>
                <Switch checked={esAccessible} onCheckedChange={setEsAccessible} />
              </div>
              {!esAccessible && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <ShieldOff className="w-3.5 h-3.5 shrink-0" />
                  This section is disabled — no student can access it regardless of course/branch filters.
                </div>
              )}
            </div>

            {/* Allowed Courses */}
            <div className="border rounded-xl p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-violet-500" />
                <div>
                  <p className="text-sm font-semibold">Allowed Courses</p>
                  <p className="text-xs text-muted-foreground">Leave empty = all courses can access</p>
                </div>
              </div>
              {/* Selected chips */}
              {esCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {esCourses.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2.5 py-1 font-medium">
                      {c}
                      <button onClick={() => setEsCourses(prev => prev.filter(x => x !== c))} className="hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Add from list or type new */}
              {addingCourse ? (
                <div className="flex gap-2">
                  <Input autoFocus value={newCourseVal} onChange={e => setNewCourseVal(e.target.value)}
                    placeholder="e.g. B.Pharm" className="text-sm h-8"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = newCourseVal.trim();
                        if (v && !esCourses.includes(v)) {
                          setEsCourses(p => [...p, v]);
                          if (!masterCourses.includes(v)) setMasterCourses(p => [...p, v]);
                        }
                        setNewCourseVal(''); setAddingCourse(false);
                      }
                      if (e.key === 'Escape') { setAddingCourse(false); setNewCourseVal(''); }
                    }} />
                  <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => {
                    const v = newCourseVal.trim();
                    if (v && !esCourses.includes(v)) {
                      setEsCourses(p => [...p, v]);
                      if (!masterCourses.includes(v)) setMasterCourses(p => [...p, v]);
                    }
                    setNewCourseVal(''); setAddingCourse(false);
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => { setAddingCourse(false); setNewCourseVal(''); }}><X className="w-3.5 h-3.5" /></Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {masterCourses.filter(c => !esCourses.includes(c)).map(c => (
                    <button key={c} onClick={() => setEsCourses(p => [...p, c])}
                      className="text-xs border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 rounded-full px-2.5 py-1 transition-colors">
                      + {c}
                    </button>
                  ))}
                  <button onClick={() => setAddingCourse(true)}
                    className="text-xs border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 rounded-full px-2.5 py-1 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" />New Course
                  </button>
                </div>
              )}
            </div>

            {/* Allowed Branches */}
            <div className="border rounded-xl p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold">Allowed Branches</p>
                  <p className="text-xs text-muted-foreground">Leave empty = all branches can access</p>
                </div>
              </div>
              {esBranches.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {esBranches.map(b => (
                    <span key={b} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 font-medium">
                      {b}
                      <button onClick={() => setEsBranches(prev => prev.filter(x => x !== b))} className="hover:text-red-500 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {addingBranch ? (
                <div className="flex gap-2">
                  <Input autoFocus value={newBranchVal} onChange={e => setNewBranchVal(e.target.value)}
                    placeholder="e.g. VLSI" className="text-sm h-8"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = newBranchVal.trim();
                        if (v && !esBranches.includes(v)) {
                          setEsBranches(p => [...p, v]);
                          if (!masterBranches.includes(v)) setMasterBranches(p => [...p, v]);
                        }
                        setNewBranchVal(''); setAddingBranch(false);
                      }
                      if (e.key === 'Escape') { setAddingBranch(false); setNewBranchVal(''); }
                    }} />
                  <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => {
                    const v = newBranchVal.trim();
                    if (v && !esBranches.includes(v)) {
                      setEsBranches(p => [...p, v]);
                      if (!masterBranches.includes(v)) setMasterBranches(p => [...p, v]);
                    }
                    setNewBranchVal(''); setAddingBranch(false);
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => { setAddingBranch(false); setNewBranchVal(''); }}><X className="w-3.5 h-3.5" /></Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {masterBranches.filter(b => !esBranches.includes(b)).map(b => (
                    <button key={b} onClick={() => setEsBranches(p => [...p, b])}
                      className="text-xs border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-full px-2.5 py-1 transition-colors">
                      + {b}
                    </button>
                  ))}
                  <button onClick={() => setAddingBranch(true)}
                    className="text-xs border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 rounded-full px-2.5 py-1 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" />New Branch
                  </button>
                </div>
              )}
            </div>

            {/* Allowed Colleges */}
            <div className="border rounded-xl p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold">Allowed Colleges</p>
                  <p className="text-xs text-muted-foreground">Leave empty = all colleges can access</p>
                </div>
              </div>
              {esColleges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {esColleges.map(cid => {
                    const col = colleges.find((c:any) => c._id === cid);
                    return (
                      <span key={cid} className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1 font-medium">
                        {col?.name || cid}
                        <button onClick={() => setEsColleges(prev => prev.filter(x => x !== cid))} className="hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {colleges.filter((c:any) => !esColleges.includes(c._id)).map((c:any) => (
                  <button key={c._id} onClick={() => setEsColleges(p => [...p, c._id])}
                    className="text-xs border border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 rounded-full px-2.5 py-1 transition-colors">
                    + {c.name}
                  </button>
                ))}
                {colleges.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No colleges found — add them in User Management first.</p>
                )}
              </div>
            </div>

            {/* Save/cancel */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setEditSectionDialog(null)}>Cancel</Button>
              <Button className="flex-1 text-sm" onClick={handleEditSection} disabled={saving || !esName.trim()}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Section
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function TypeSelector({ qType, setQType }: { qType: string; setQType: (v: 'mcq' | 'msq') => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Question Type</Label>
      <Select value={qType} onValueChange={v => setQType(v as 'mcq' | 'msq')}>
        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="mcq">MCQ — Single Correct Answer</SelectItem>
          <SelectItem value="msq">MSQ — Multiple Correct Answers</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OptionsBlock({ qType, qOptions, setQOptions, qAnswer, setQAnswer }: {
  qType: string; qOptions: string[]; setQOptions: (o: string[]) => void;
  qAnswer: string; setQAnswer: (a: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Options</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {qOptions.map((opt, i) => (
            <div key={i} className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                {String.fromCharCode(65 + i)}.
              </span>
              <Input
                className="pl-7 text-sm"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={e => { const o = [...qOptions]; o[i] = e.target.value; setQOptions(o); }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">
          Correct Answer{' '}
          <span className="text-xs text-muted-foreground font-normal">
            {qType === 'msq' ? '(comma-separated e.g. A,C)' : '(e.g. A)'}
          </span>
        </Label>
        <Input
          value={qAnswer}
          onChange={e => setQAnswer(e.target.value)}
          placeholder={qType === 'msq' ? 'A,C' : 'A'}
          className="font-mono uppercase text-sm"
        />
      </div>
    </>
  );
}

function MarksBlock({ qMarks, setQMarks, qNegMarks, setQNegMarks }: {
  qMarks: string; setQMarks: (v: string) => void;
  qNegMarks: string; setQNegMarks: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Marks</Label>
        <Input type="number" min="0" value={qMarks} onChange={e => setQMarks(e.target.value)} className="text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Negative Marks</Label>
        <Input type="number" min="0" value={qNegMarks} onChange={e => setQNegMarks(e.target.value)} className="text-sm" />
      </div>
    </div>
  );
}

function ExplanationBlock({ qExplanation, setQExplanation }: { qExplanation: string; setQExplanation: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">Explanation <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
      <Textarea value={qExplanation} onChange={e => setQExplanation(e.target.value)}
        placeholder="Explain the correct answer…" rows={2} className="text-sm" />
    </div>
  );
}

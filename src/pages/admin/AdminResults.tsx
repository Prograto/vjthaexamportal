import { useState, useEffect } from "react";
import { resultsAPI, userAPI, examAPI } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Download, Trophy, Users, BarChart3,
  GraduationCap, BookOpen, Building2, RefreshCw,
  FileSpreadsheet, ChevronUp, ChevronDown,
  Search, Trash2, RotateCcw, X,
} from "lucide-react";
import { toast } from "sonner";

interface ResultRow {
  attemptId:      string;
  rank:           number;
  studentName:    string;
  regNo:          string;
  course:         string;
  branch:         string;
  collegeName:    string;
  examTitle:      string;
  totalMarks:     string | number;
  obtainedMarks:  string | number;
  percentage:     string;
  correctAnswers: string | number;
  wrongAnswers:   string | number;
  skipped:        string | number;
  attemptedOn:    string;
}

type SortKey = keyof ResultRow;

export default function AdminResults() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [exams, setExams]       = useState<any[]>([]);
  const [results, setResults]   = useState<ResultRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  // Filters
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterCourse,  setFilterCourse]  = useState("all");
  const [filterBranch,  setFilterBranch]  = useState("all");
  const [filterExam,    setFilterExam]    = useState("all");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ResultRow | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    Promise.all([userAPI.getAllColleges(), examAPI.getAll()])
      .then(([colRes, exRes]) => {
        setColleges(colRes.data?.data || []);
        setExams(exRes.data?.data    || []);
      })
      .catch(() => {});
  }, []);

  // ── Fetch results ────────────────────────────────────────────────────────
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCollege !== "all") params.collegeId = filterCollege;
      if (filterCourse  !== "all") params.course    = filterCourse;
      if (filterBranch  !== "all") params.branch    = filterBranch;
      if (filterExam    !== "all") params.examId    = filterExam;
      const res = await resultsAPI.getAdminResults(params);
      setResults(res.data?.data || []);
      setFetched(true);
      toast.success(`${res.data?.total || 0} result${res.data?.total !== 1 ? "s" : ""} loaded`);
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Delete a result → student can retake ────────────────────────────────
  const handleDeleteResult = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resultsAPI.deleteResult(deleteTarget.attemptId);
      setResults(prev => prev.filter(r => r.attemptId !== deleteTarget.attemptId));
      toast.success(`Result deleted — ${deleteTarget.studentName} can now retake the exam ✓`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Delete failed: " + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const uniqueCourses  = [...new Set(results.map(r => r.course).filter(c => c && c !== "—"))];
  const uniqueBranches = [...new Set(
    results
      .filter(r => filterCourse === "all" || r.course === filterCourse)
      .map(r => r.branch).filter(b => b && b !== "—")
  )];

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...results].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  // ── Filter + search ───────────────────────────────────────────────────────
  const displayed = sorted.filter(r => {
    if (filterCourse !== "all" && r.course !== filterCourse) return false;
    if (filterBranch !== "all" && r.branch !== filterBranch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.regNo.toLowerCase().includes(q)       ||
        r.collegeName.toLowerCase().includes(q) ||
        r.examTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  // ── Download CSV ──────────────────────────────────────────────────────────
  const downloadCSV = () => {
    if (!displayed.length) return toast.error("No results to download");
    const cols: (keyof ResultRow)[] = [
      "rank","studentName","regNo","course","branch","collegeName",
      "examTitle","obtainedMarks","totalMarks","percentage",
      "correctAnswers","wrongAnswers","skipped","attemptedOn",
    ];
    const headers = [
      "Rank","Student Name","Reg No","Course","Branch","College",
      "Exam","Obtained Marks","Total Marks (Displayed)","Percentage",
      "Correct","Wrong","Skipped","Date",
    ];
    const rows = displayed.map(r =>
      cols.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    const label = [
      filterCollege !== "all" ? colleges.find(c => c._id === filterCollege)?.name : "AllColleges",
      filterCourse  !== "all" ? filterCourse : "",
      filterBranch  !== "all" ? filterBranch : "",
    ].filter(Boolean).join("_");
    a.download = `results_${label || "all"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded ✓");
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const avgPct = displayed.length
    ? (displayed.reduce((s, r) => s + parseFloat(String(r.percentage) || "0"), 0) / displayed.length).toFixed(1)
    : "0";
  const topScore = displayed.length
    ? Math.max(...displayed.map(r => Number(r.obtainedMarks) || 0))
    : 0;

  // ── Sort header ───────────────────────────────────────────────────────────
  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="p-3 font-medium text-xs cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => handleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k
          ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronDown className="w-3 h-3 opacity-20" />
        }
      </span>
    </th>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Results & Downloads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Filter, search and manage student results. Deleting a result allows the student to retake the exam.
        </p>
      </div>

      {/* ── Filter card ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filter Results</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* College */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />College
              </Label>
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Colleges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Course */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-violet-500" />Course
              </Label>
              <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterBranch("all"); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Courses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {(fetched ? uniqueCourses : ["B.Tech","Degree","Inter","M.Tech","MBA","MCA","Diploma"])
                    .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />Branch
              </Label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {(fetched ? uniqueBranches : ["CSE","ECE","EEE","ME","CE","IT","AI&ML","MPC","BiPC"])
                    .map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Exam */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />Exam
              </Label>
              <Select value={filterExam} onValueChange={setFilterExam}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Exams" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map(e => <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1 flex-wrap">
            <Button onClick={fetchResults} disabled={loading} className="gap-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</>
                : <><RefreshCw className="w-4 h-4" />Fetch Results</>
              }
            </Button>
            <Button variant="outline" onClick={downloadCSV} disabled={!displayed.length} className="gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      {fetched && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Results",  value: displayed.length,  color: "bg-violet-500",  icon: Users    },
            { label: "Avg Score",      value: avgPct + "%",      color: "bg-blue-500",    icon: BarChart3 },
            { label: "Top Score",      value: topScore,          color: "bg-emerald-500", icon: Trophy   },
            { label: "Exams Covered",  value: [...new Set(displayed.map(r => r.examTitle))].length,
              color: "bg-amber-500", icon: BookOpen },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results table ────────────────────────────────────────────────── */}
      {fetched && (
        <Card>
          <CardContent className="p-0">

            {/* Table toolbar: count + search + CSV */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
              <p className="text-sm font-semibold shrink-0">
                {displayed.length} result{displayed.length !== 1 ? "s" : ""}
                {(filterCollege !== "all" || filterCourse !== "all" ||
                  filterBranch !== "all"  || filterExam   !== "all" || searchQuery) && (
                  <span className="text-muted-foreground font-normal ml-1">(filtered)</span>
                )}
              </p>

              {/* Search bar */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student name, reg no, college…"
                  className="h-8 pl-8 pr-8 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={downloadCSV}
                disabled={!displayed.length} className="gap-1.5 text-xs shrink-0">
                <Download className="w-3.5 h-3.5" />CSV
              </Button>
            </div>

            {/* Delete hint */}
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-700">
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>
                Deleting a result permanently removes it and{" "}
                <strong>allows the student to retake the exam</strong>.
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                    <SortTh label="#"        k="rank"          />
                    <SortTh label="Student"  k="studentName"   />
                    <SortTh label="Reg No"   k="regNo"         />
                    <SortTh label="College"  k="collegeName"   />
                    <SortTh label="Course"   k="course"        />
                    <SortTh label="Branch"   k="branch"        />
                    <SortTh label="Exam"     k="examTitle"     />
                    <SortTh label="Score"    k="obtainedMarks" />
                    <SortTh label="%"        k="percentage"    />
                    <th className="p-3 font-medium text-xs whitespace-nowrap">✓ / ✗ / —</th>
                    <SortTh label="Date"     k="attemptedOn"   />
                    <th className="p-3 font-medium text-xs whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, i) => (
                    <tr key={r.attemptId || i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-center">
                        {i < 3
                          ? <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold text-white ${i===0?"bg-amber-400":i===1?"bg-slate-400":"bg-amber-600"}`}>{i+1}</span>
                          : <span className="text-xs text-muted-foreground">{i+1}</span>
                        }
                      </td>
                      <td className="p-3 font-medium text-sm whitespace-nowrap">{r.studentName}</td>
                      <td className="p-3 text-xs text-muted-foreground font-mono">{r.regNo}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{r.collegeName}</Badge></td>
                      <td className="p-3">
                        {r.course !== "—"
                          ? <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">{r.course}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {r.branch !== "—"
                          ? <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">{r.branch}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-xs max-w-[180px] truncate" title={String(r.examTitle)}>{r.examTitle}</td>
                      <td className="p-3 font-bold text-sm">
                        {r.obtainedMarks}
                        <span className="text-xs font-normal text-muted-foreground">/{r.totalMarks}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          parseFloat(String(r.percentage)) >= 75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : parseFloat(String(r.percentage)) >= 50 ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                        }`}>{r.percentage}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="text-emerald-600 font-medium">{r.correctAnswers}✓</span>
                        <span className="mx-1">/</span>
                        <span className="text-red-500 font-medium">{r.wrongAnswers}✗</span>
                        <span className="mx-1">/</span>
                        <span>{r.skipped}—</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{r.attemptedOn}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive hover:bg-red-50"
                          title="Delete result & allow retake"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-12 text-center text-muted-foreground">
                        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No results found for the selected filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!fetched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-semibold text-base">Select filters and click "Fetch Results"</p>
          <p className="text-sm mt-1">Filter by college, course, branch or exam</p>
        </div>
      )}

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />Delete Result
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">This will permanently delete the result for:</p>
                <div className="bg-muted rounded-lg p-3 space-y-1 text-foreground">
                  <p><span className="font-semibold">Student:</span> {deleteTarget?.studentName}</p>
                  <p><span className="font-semibold">Reg No:</span>  {deleteTarget?.regNo}</p>
                  <p><span className="font-semibold">Exam:</span>    {deleteTarget?.examTitle}</p>
                  <p>
                    <span className="font-semibold">Score:</span>{" "}
                    {deleteTarget?.obtainedMarks} / {deleteTarget?.totalMarks}{" "}
                    ({deleteTarget?.percentage})
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    After deletion the student will be able to{" "}
                    <strong>retake this exam</strong>.
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResult}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
              Delete & Allow Retake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

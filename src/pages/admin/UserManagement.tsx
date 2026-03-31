import { useState, useEffect, useRef } from "react";
import { userAPI } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Building2, Users, Upload, Trash2, Loader2, IdCard, Search,
  ShieldCheck, ShieldOff, FileSpreadsheet, CheckCircle2, AlertCircle,
  Download, X, Info, Pencil, GraduationCap, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface College {
  _id: string; name: string; regNo?: string; phone?: string;
  city?: string; state?: string; isAccessGranted: boolean; createdAt: string;
}
interface Student {
  _id: string; name: string; regNo?: string; email?: string;
  collegeId?: any; isActive?: boolean; course?: string; branch?: string;
}

const DEFAULT_COURSE_BRANCHES: Record<string, string[]> = {
  "B.Tech":  ["CSE", "ECE", "EEE", "ME", "CE", "IT", "AI&ML", "Data Science"],
  "Degree":  ["B.Sc", "B.Com", "B.A", "BBA", "BCA"],
  "Inter":   ["MPC", "BiPC", "CEC", "HEC", "MEC"],
  "M.Tech":  ["CSE", "ECE", "VLSI", "Embedded Systems", "Power Systems"],
  "MBA":     ["Finance", "Marketing", "HR", "Operations", "IT"],
  "MCA":     ["General"],
  "Diploma": ["CSE", "ECE", "ME", "CE", "EEE"],
};

function CourseBranchSelector({
  course, setCourse, branch, setBranch, coursesMap, setCoursesMap,
}: {
  course: string; setCourse: (v: string) => void;
  branch: string; setBranch: (v: string) => void;
  coursesMap: Record<string, string[]>;
  setCoursesMap: (m: Record<string, string[]>) => void;
}) {
  const [addingCourse, setAddingCourse] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newBranchName, setNewBranchName] = useState("");

  const courseList = Object.keys(coursesMap);
  const branchList = course && coursesMap[course] ? coursesMap[course] : [];

  const handleAddCourse = () => {
    const trimmed = newCourseName.trim();
    if (!trimmed) return;
    if (coursesMap[trimmed]) { toast.error("Course already exists"); return; }
    const updated = { ...coursesMap, [trimmed]: [] };
    setCoursesMap(updated);
    setCourse(trimmed);
    setBranch("");
    setNewCourseName("");
    setAddingCourse(false);
    toast.success(`Course "${trimmed}" added`);
  };

  const handleAddBranch = () => {
    const trimmed = newBranchName.trim();
    if (!trimmed || !course) return;
    if (branchList.includes(trimmed)) { toast.error("Branch already exists"); return; }
    const updated = { ...coursesMap, [course]: [...branchList, trimmed] };
    setCoursesMap(updated);
    setBranch(trimmed);
    setNewBranchName("");
    setAddingBranch(false);
    toast.success(`Branch "${trimmed}" added to ${course}`);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm"><GraduationCap className="w-3.5 h-3.5 text-primary" />Course</Label>
        {addingCourse ? (
          <div className="flex gap-2">
            <Input autoFocus value={newCourseName} onChange={e => setNewCourseName(e.target.value)}
              placeholder="e.g. B.Pharm" className="text-sm"
              onKeyDown={e => { if (e.key === "Enter") handleAddCourse(); if (e.key === "Escape") { setAddingCourse(false); setNewCourseName(""); } }} />
            <Button size="sm" onClick={handleAddCourse} className="shrink-0">Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingCourse(false); setNewCourseName(""); }} className="shrink-0 px-2"><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select value={course} onValueChange={v => { setCourse(v); setBranch(""); }}>
              <SelectTrigger className="text-sm flex-1"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courseList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs px-2.5" onClick={() => setAddingCourse(true)}>
              <Plus className="w-3 h-3" />New
            </Button>
          </div>
        )}
      </div>

      {course && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm"><BookOpen className="w-3.5 h-3.5 text-primary" />Branch / Stream</Label>
          {addingBranch ? (
            <div className="flex gap-2">
              <Input autoFocus value={newBranchName} onChange={e => setNewBranchName(e.target.value)}
                placeholder={`e.g. new branch for ${course}`} className="text-sm"
                onKeyDown={e => { if (e.key === "Enter") handleAddBranch(); if (e.key === "Escape") { setAddingBranch(false); setNewBranchName(""); } }} />
              <Button size="sm" onClick={handleAddBranch} className="shrink-0">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingBranch(false); setNewBranchName(""); }} className="shrink-0 px-2"><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="text-sm flex-1">
                  <SelectValue placeholder={branchList.length ? "Select branch" : "No branches — add one"} />
                </SelectTrigger>
                <SelectContent>{branchList.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs px-2.5" onClick={() => setAddingBranch(true)}>
                <Plus className="w-3 h-3" />New
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function downloadTemplate() {
  const header = "Name,RegNo,Password,Course,Branch\n";
  const samples = [
    "John Doe,21CS001,mypassword,B.Tech,CSE",
    "Jane Smith,21CS002,,Degree,B.Com",
    "Ravi Kumar,21EC003,pass123,B.Tech,ECE",
    "Priya Reddy,21MPC004,,Inter,MPC",
  ].join("\n");
  const blob = new Blob([header + samples], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "students_template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function UserManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [coursesMap, setCoursesMap] = useState<Record<string, string[]>>(DEFAULT_COURSE_BRANCHES);

  const [showAddCollege, setShowAddCollege] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editStudent, setEditStudent]       = useState<Student | null>(null);
  const [deletingCollegeId, setDeletingCollegeId] = useState<string | null>(null);

  // ── Search / filter (students tab) ───────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterCourse, setFilterCourse]   = useState("all");
  const [filterBranch, setFilterBranch]   = useState("all");


  const [colName, setColName]         = useState("");
  const [colRegNo, setColRegNo]       = useState("");
  const [colPassword, setColPassword] = useState("");
  const [colPhone, setColPhone]       = useState("");
  const [colCity, setColCity]         = useState("");
  const [colState, setColState]       = useState("");

  const [stuName, setStuName]         = useState("");
  const [stuRegNo, setStuRegNo]       = useState("");
  const [stuPassword, setStuPassword] = useState("");
  const [stuCollege, setStuCollege]   = useState("");
  const [stuCourse, setStuCourse]     = useState("");
  const [stuBranch, setStuBranch]     = useState("");

  const [editName, setEditName]       = useState("");
  const [editRegNo, setEditRegNo]     = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editCourse, setEditCourse]   = useState("");
  const [editBranch, setEditBranch]   = useState("");

  const [bulkCollege, setBulkCollege]     = useState("");
  const [bulkFile, setBulkFile]           = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult]       = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, collegesRes] = await Promise.all([userAPI.getAll(), userAPI.getAllColleges()]);
      const allUsers: Student[] = usersRes.data?.data || [];
      const fetchedStudents = allUsers.filter((u: any) => u.role === "student");
      setStudents(fetchedStudents);
      setColleges(collegesRes.data?.data || []);
      // Merge any stored courses/branches from existing students into the map
      setCoursesMap(prev => {
        const merged = { ...prev };
        fetchedStudents.forEach(s => {
          if (s.course) {
            if (!merged[s.course]) merged[s.course] = [];
            if (s.branch && !merged[s.course].includes(s.branch))
              merged[s.course] = [...merged[s.course], s.branch];
          }
        });
        return merged;
      });
    } catch (err: any) {
      toast.error("Failed to load data: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleAddCollege = async () => {
    if (!colName.trim()) return toast.error("College name is required");
    if (!colPassword.trim()) return toast.error("Password is required");
    setSaving(true);
    try {
      const res = await userAPI.createCollege({ name: colName, regNo: colRegNo, password: colPassword, phone: colPhone, city: colCity, state: colState });
      setColleges(prev => [res.data.data, ...prev]);
      setColName(""); setColRegNo(""); setColPassword(""); setColPhone(""); setColCity(""); setColState("");
      setShowAddCollege(false);
      toast.success("College created ✓");
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleToggleAccess = async (college: College) => {
    const next = !college.isAccessGranted;
    try {
      await userAPI.toggleCollegeAccess(college._id, next);
      setColleges(prev => prev.map(c => c._id === college._id ? { ...c, isAccessGranted: next } : c));
      toast.success(next ? `✅ Access GRANTED to ${college.name}` : `🚫 Access DENIED for ${college.name}`);
    } catch (err: any) { toast.error("Failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleDeleteCollege = async (id: string) => {
    try {
      const res = await userAPI.deleteCollege(id);
      setColleges(prev => prev.filter(c => c._id !== id));
      setStudents(prev => prev.filter(s => (s.collegeId?._id || s.collegeId) !== id));
      setDeletingCollegeId(null);
      toast.success(res.data.message || "College deleted");
    } catch (err: any) { toast.error("Delete failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleAddStudent = async () => {
    if (!stuName.trim() || !stuRegNo.trim() || !stuCollege)
      return toast.error("Name, Reg No, and College are required");
    setSaving(true);
    try {
      const systemEmail = `${stuRegNo.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.examportal.com`;
      const res = await userAPI.create({
        name: stuName, email: systemEmail, regNo: stuRegNo,
        password: stuPassword || "student123", role: "student",
        collegeId: stuCollege, course: stuCourse || null, branch: stuBranch || null,
      });
      setStudents(prev => [...prev, res.data.data]);
      setStuName(""); setStuRegNo(""); setStuPassword(""); setStuCollege(""); setStuCourse(""); setStuBranch("");
      setShowAddStudent(false);
      toast.success("Student saved ✓");
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const openEditStudent = (s: Student) => {
    setEditStudent(s);
    setEditName(s.name);
    setEditRegNo(s.regNo || "");
    setEditCollege(s.collegeId?._id || s.collegeId || "");
    setEditCourse(s.course || "");
    setEditBranch(s.branch || "");
  };

  const handleEditStudent = async () => {
    if (!editStudent || !editName.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const res = await userAPI.update(editStudent._id, {
        name: editName, regNo: editRegNo || null,
        collegeId: editCollege || null,
        course: editCourse || null, branch: editBranch || null,
      });
      const updated = res.data.data;
      setStudents(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
      setEditStudent(null);
      toast.success("Student updated ✓");
    } catch (err: any) {
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await userAPI.delete(id);
      setStudents(prev => prev.filter(s => s._id !== id));
      toast.success("Student deleted ✓");
    } catch (err: any) { toast.error("Delete failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !bulkCollege) return toast.error("Select a college and an Excel file");
    setBulkUploading(true); setBulkResult(null);
    try {
      const res = await userAPI.bulkUploadStudents(bulkFile, bulkCollege);
      const result = res.data.data;
      setBulkResult(result);
      if (result.created > 0) fetchData();
      toast.success(`${result.created} students uploaded!`);
    } catch (err: any) {
      toast.error("Upload failed: " + (err.response?.data?.message || err.message));
    } finally { setBulkUploading(false); }
  };

  const resetBulkUpload = () => {
    setBulkFile(null); setBulkCollege(""); setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="text-muted-foreground">Loading...</span>
    </div>
  );

  const activeColleges = colleges.filter(c => c.isAccessGranted).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">Manage colleges and students — control who can access the portal</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Colleges",      value: colleges.length,                   color: "bg-blue-500",    icon: Building2   },
          { label: "Access Granted",value: activeColleges,                    color: "bg-emerald-500", icon: ShieldCheck },
          { label: "Access Denied", value: colleges.length - activeColleges,  color: "bg-red-400",    icon: ShieldOff   },
          { label: "Students",      value: students.length,                   color: "bg-violet-500",  icon: Users       },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="colleges">
        <TabsList>
          <TabsTrigger value="colleges" className="gap-2"><Building2 className="w-4 h-4" />Colleges ({colleges.length})</TabsTrigger>
          <TabsTrigger value="students" className="gap-2"><Users className="w-4 h-4" />Students ({students.length})</TabsTrigger>
        </TabsList>

        {/* ══════════════════ COLLEGES TAB ══════════════════ */}
        <TabsContent value="colleges" className="space-y-4 mt-4">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            Toggle the <strong className="mx-0.5">Access</strong> switch to grant or deny student login access for that college.
          </div>
          <div className="flex justify-end">
            <Dialog open={showAddCollege} onOpenChange={setShowAddCollege}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add College</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create College Account</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>College Name *</Label><Input value={colName} onChange={e => setColName(e.target.value)} placeholder="e.g., SRM University" /></div>
                  <div><Label>Registration No</Label><Input value={colRegNo} onChange={e => setColRegNo(e.target.value)} placeholder="e.g., COL-2025-001" /></div>
                  <div><Label>Login Password *</Label><Input type="password" value={colPassword} onChange={e => setColPassword(e.target.value)} placeholder="College login password" /></div>
                  <div><Label>Phone</Label><Input value={colPhone} onChange={e => setColPhone(e.target.value)} placeholder="Phone number" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>City</Label><Input value={colCity} onChange={e => setColCity(e.target.value)} placeholder="City" /></div>
                    <div><Label>State</Label><Input value={colState} onChange={e => setColState(e.target.value)} placeholder="State" /></div>
                  </div>
                  <Button onClick={handleAddCollege} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save College
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {colleges.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No colleges yet</p>
                <p className="text-sm mt-1">Add your first college to get started</p>
              </div>
            ) : colleges.map(col => {
              const stuCount = students.filter(s => (s.collegeId?._id || s.collegeId) === col._id).length;
              return (
                <Card key={col._id} className={`border-2 transition-colors ${col.isAccessGranted ? "border-emerald-200 bg-emerald-50/30" : "border-red-100 bg-red-50/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${col.isAccessGranted ? "bg-emerald-100" : "bg-red-100"}`}>
                          <Building2 className={`w-5 h-5 ${col.isAccessGranted ? "text-emerald-600" : "text-red-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{col.name}</h3>
                            {col.regNo && <Badge variant="outline" className="text-xs">{col.regNo}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {[col.city, col.state].filter(Boolean).join(" · ") || "No location set"}
                            {col.phone && <span className="ml-2">· {col.phone}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-xs">{stuCount} student{stuCount !== 1 ? "s" : ""}</Badge>
                            <Badge className={`text-xs ${col.isAccessGranted ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-600 border-red-200"}`} variant="outline">
                              {col.isAccessGranted ? "✅ Access Granted" : "🚫 Access Denied"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Access</span>
                          <div className="flex items-center gap-2">
                            {col.isAccessGranted ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldOff className="w-4 h-4 text-red-400" />}
                            <Switch checked={col.isAccessGranted} onCheckedChange={() => handleToggleAccess(col)} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-destructive hover:bg-destructive/10" onClick={() => setDeletingCollegeId(col._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ══════════════════ STUDENTS TAB ══════════════════ */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex gap-2 justify-end flex-wrap">

            {/* Bulk upload */}
            <Dialog open={showBulkUpload} onOpenChange={v => { setShowBulkUpload(v); if (!v) resetBulkUpload(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />Upload Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-emerald-600" />Bulk Upload Students</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="bg-slate-50 border rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />Excel / CSV Format</p>
                    <div className="font-mono text-xs text-slate-600 bg-white border rounded p-2 space-y-0.5">
                      <div className="font-bold text-slate-700">Name | RegNo | Password | Course | Branch</div>
                      <div>John Doe | 21CS001 | pass123 | B.Tech | CSE</div>
                      <div>Jane Smith | 21CS002 |  | Degree | B.Com</div>
                      <div className="text-slate-400 text-[10px] mt-1">Password, Course, Branch are optional</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7 text-emerald-700" onClick={downloadTemplate}>
                      <Download className="w-3 h-3" />Download Sample Template
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target College *</Label>
                    <Select value={bulkCollege} onValueChange={setBulkCollege}>
                      <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                      <SelectContent>{colleges.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${bulkFile ? "border-emerald-400 bg-emerald-50/50" : "border-border hover:border-emerald-300 hover:bg-muted/30"}`}
                    onClick={() => fileInputRef.current?.click()}>
                    {bulkFile ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-7 h-7 text-emerald-500 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-medium truncate">{bulkFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setBulkFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="text-sm text-muted-foreground">Click to select .xlsx, .xls, or .csv</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) setBulkFile(e.target.files[0]); }} />
                  </div>
                  {bulkResult && (
                    <div className={`rounded-xl p-3 space-y-1.5 border ${bulkResult.created > 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {bulkResult.created} created · {bulkResult.skipped} skipped
                      </div>
                      {bulkResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{e}</p>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleBulkUpload} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={bulkUploading || !bulkFile || !bulkCollege}>
                    {bulkUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload Students</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add student */}
            <Dialog open={showAddStudent} onOpenChange={v => { setShowAddStudent(v); if (!v) { setStuName(""); setStuRegNo(""); setStuPassword(""); setStuCollege(""); setStuCourse(""); setStuBranch(""); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Student</Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Create Student Account</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <Input value={stuName} onChange={e => setStuName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Registration No *</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" value={stuRegNo} onChange={e => setStuRegNo(e.target.value)} placeholder="e.g. 21CS001" />
                    </div>
                    <p className="text-xs text-muted-foreground">Student logs in with this Reg No</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input type="password" value={stuPassword} onChange={e => setStuPassword(e.target.value)} placeholder='Leave blank → "student123"' />
                  </div>
                  <div className="space-y-1.5">
                    <Label>College *</Label>
                    <Select value={stuCollege} onValueChange={setStuCollege}>
                      <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                      <SelectContent>
                        {colleges.map(c => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}{!c.isAccessGranted && <span className="text-xs text-red-500 ml-1">(access denied)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />Academic Details <span className="font-normal normal-case">(optional)</span>
                    </p>
                    <CourseBranchSelector
                      course={stuCourse} setCourse={setStuCourse}
                      branch={stuBranch} setBranch={setStuBranch}
                      coursesMap={coursesMap} setCoursesMap={setCoursesMap}
                    />
                  </div>
                  <Button onClick={handleAddStudent} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Student
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search & Filter bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 text-sm"
                placeholder="Search by name or reg no…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Colleges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterBranch("all"); }}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Courses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {[...new Set(students.map(s => s.course).filter(Boolean))].map(c => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {[...new Set(
                    students
                      .filter(s => filterCourse === "all" || s.course === filterCourse)
                      .map(s => s.branch).filter(Boolean)
                  )].map(b => (
                    <SelectItem key={b} value={b!}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || filterCollege !== "all" || filterCourse !== "all" || filterBranch !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterCollege("all"); setFilterCourse("all"); setFilterBranch("all"); }}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive border rounded-md flex items-center gap-1">
                  <X className="w-3 h-3" />Clear
                </button>
              )}
            </div>
          </div>

          {/* Students table */}
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const filtered = students.filter(s => {
              if (q && !s.name.toLowerCase().includes(q) && !(s.regNo || "").toLowerCase().includes(q)) return false;
              if (filterCollege !== "all" && (s.collegeId?._id || s.collegeId) !== filterCollege) return false;
              if (filterCourse !== "all" && s.course !== filterCourse) return false;
              if (filterBranch !== "all" && s.branch !== filterBranch) return false;
              return true;
            });
            return (
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                      <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Name</th>
                      <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm hidden sm:table-cell">Reg No</th>
                      <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">College</th>
                      <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">Course / Branch</th>
                      <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm hidden md:table-cell">Access</th>
                      <th className="p-3 sm:p-4 font-medium text-right text-xs sm:text-sm w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const college = colleges.find(c => c._id === (s.collegeId?._id || s.collegeId));
                      const hasAccess = college?.isAccessGranted ?? false;
                      return (
                        <tr key={s._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-3 sm:p-4">
                            <div className="font-medium text-sm">{s.name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden mt-0.5 flex items-center gap-1">
                              <IdCard className="w-3 h-3" />{s.regNo || "No RegNo"}
                            </div>
                            {(s.course || s.branch) && (
                              <div className="flex gap-1 mt-1 lg:hidden flex-wrap">
                                {s.course && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-violet-700 border-violet-200 bg-violet-50">{s.course}</Badge>}
                                {s.branch && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-700 border-blue-200 bg-blue-50">{s.branch}</Badge>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                              <IdCard className="w-3.5 h-3.5" />
                              {s.regNo || <span className="italic opacity-60">Not set</span>}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <Badge variant="outline" className="text-xs">{college?.name || s.collegeId?.name || "—"}</Badge>
                          </td>
                          <td className="p-3 sm:p-4 hidden lg:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {s.course
                                ? <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">{s.course}</Badge>
                                : <span className="text-xs text-muted-foreground italic">—</span>}
                              {s.branch && <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">{s.branch}</Badge>}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 hidden md:table-cell">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${hasAccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                              {hasAccess ? <><ShieldCheck className="w-3 h-3" />Allowed</> : <><ShieldOff className="w-3 h-3" />Blocked</>}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-primary hover:bg-primary/10" onClick={() => openEditStudent(s)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStudent(s._id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p>{students.length === 0 ? "No students yet — add one or upload via Excel" : "No students match your search/filters"}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* ── Edit Student Dialog ── */}
      <Dialog open={!!editStudent} onOpenChange={v => { if (!v) setEditStudent(null); }}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />Edit Student
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Registration No</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={editRegNo} onChange={e => setEditRegNo(e.target.value)} placeholder="e.g. 21CS001" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>College</Label>
              <Select value={editCollege} onValueChange={setEditCollege}>
                <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                <SelectContent>
                  {colleges.map(c => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}{!c.isAccessGranted && <span className="text-xs text-red-500 ml-1">(denied)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-xl p-3 bg-muted/20 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />Academic Details
              </p>
              <CourseBranchSelector
                course={editCourse} setCourse={setEditCourse}
                branch={editBranch} setBranch={setEditBranch}
                coursesMap={coursesMap} setCoursesMap={setCoursesMap}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditStudent(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleEditStudent} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete College Confirmation ── */}
      <Dialog open={!!deletingCollegeId} onOpenChange={() => setDeletingCollegeId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" />Delete College?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>This will permanently delete the college <strong>and all its students</strong>. This cannot be undone.</div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingCollegeId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deletingCollegeId && handleDeleteCollege(deletingCollegeId)}>
                Delete Everything
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

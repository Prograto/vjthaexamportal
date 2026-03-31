import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { userAPI } from '@/services/api';
import {
  Users, BookOpen, GitBranch, X, ChevronDown, ChevronUp,
  Plus, Check, Loader2, Building2,
} from 'lucide-react';

// ── Fallback defaults (used when no students registered yet) ─────────────────
const DEFAULT_COURSE_BRANCHES: Record<string, string[]> = {
  'B.Tech':  ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AI&ML', 'Data Science'],
  'Degree':  ['B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA'],
  'Inter':   ['MPC', 'BiPC', 'CEC', 'HEC', 'MEC'],
  'M.Tech':  ['CSE', 'ECE', 'VLSI', 'Embedded Systems', 'Power Systems'],
  'MBA':     ['Finance', 'Marketing', 'HR', 'Operations', 'IT'],
  'MCA':     ['General'],
  'Diploma': ['CSE', 'ECE', 'ME', 'CE', 'EEE'],
};

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, color, label, count,
}: {
  icon: React.ElementType; color: string; label: string; count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {count > 0 && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 ml-auto"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {count} selected
        </Badge>
      )}
    </div>
  );
}

// ── Inline checkbox list with "Add new" ───────────────────────────────────────
function CheckboxList({
  items,
  selected,
  onToggle,
  onAdd,
  emptyText,
  addPlaceholder,
  loading,
  renderLabel,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onAdd?: (v: string) => void;
  emptyText?: string;
  addPlaceholder?: string;
  loading?: boolean;
  renderLabel?: (v: string) => React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState('');

  const handleAdd = () => {
    const v = newVal.trim();
    if (!v) return;
    onAdd?.(v);
    setNewVal('');
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Existing items */}
      {items.length === 0 && !onAdd && (
        <p className="text-xs text-muted-foreground italic py-1">{emptyText || 'No options available'}</p>
      )}
      <div className="grid grid-cols-1 gap-0.5 max-h-48 overflow-y-auto">
        {items.map(item => {
          const checked = selected.includes(item);
          return (
            <label
              key={item}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all select-none
                ${checked
                  ? 'bg-violet-50 border border-violet-200'
                  : 'hover:bg-slate-50 border border-transparent'
                }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(item)}
                className="shrink-0"
              />
              <span className="text-sm flex-1 truncate">
                {renderLabel ? renderLabel(item) : item}
              </span>
              {checked && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
            </label>
          );
        })}
      </div>

      {/* Add new inline */}
      {onAdd && (
        <div className="pt-1">
          {adding ? (
            <div className="flex items-center gap-1.5 mt-1">
              <Input
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                  if (e.key === 'Escape') { setAdding(false); setNewVal(''); }
                }}
                placeholder={addPlaceholder || 'Type and press Enter…'}
                className="h-7 text-xs flex-1"
                autoFocus
              />
              <Button
                type="button" size="sm"
                className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700"
                onClick={handleAdd}
                disabled={!newVal.trim()}
              >
                Add
              </Button>
              <Button
                type="button" size="sm" variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => { setAdding(false); setNewVal(''); }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium mt-1 py-1 w-full hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add new option
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Selected pills strip ──────────────────────────────────────────────────────
function SelectedPills({
  items,
  onRemove,
  color,
  renderLabel,
}: {
  items: string[];
  onRemove: (v: string) => void;
  color: string;
  renderLabel?: (v: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {items.map(v => (
        <Badge
          key={v}
          variant="secondary"
          className="gap-1 pr-1 text-xs font-medium"
          style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
        >
          {renderLabel ? renderLabel(v) : v}
          <button
            type="button"
            onClick={() => onRemove(v)}
            className="ml-0.5 rounded-full p-0.5 hover:opacity-70 transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  accessColleges: string[];
  accessCourses: string[];
  accessBranches: string[];
  onChangeColleges: (v: string[]) => void;
  onChangeCourses: (v: string[]) => void;
  onChangeBranches: (v: string[]) => void;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AccessControlFields({
  accessColleges, accessCourses, accessBranches,
  onChangeColleges, onChangeCourses, onChangeBranches,
}: Props) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [courseBranchMap, setCourseBranchMap] = useState<Record<string, string[]>>(DEFAULT_COURSE_BRANCHES);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Load colleges and courses/branches from real student data
  useEffect(() => {
    if (!expanded) return;

    setLoadingColleges(true);
    userAPI.getAllColleges()
      .then(r => setColleges(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingColleges(false));

    setLoadingCourses(true);
    userAPI.getCoursesBranches()
      .then(r => {
        const data = r.data?.data || {};
        // Merge with defaults so UI isn't empty on fresh installs
        setCourseBranchMap(Object.keys(data).length > 0
          ? data
          : DEFAULT_COURSE_BRANCHES
        );
      })
      .catch(() => setCourseBranchMap(DEFAULT_COURSE_BRANCHES))
      .finally(() => setLoadingCourses(false));
  }, [expanded]);

  // Derived lists
  const courseList = Object.keys(courseBranchMap).sort();

  // Branches: show only branches under selected courses; if none selected, show all
  const branchList: string[] = [...new Set(
    (accessCourses.length > 0 ? accessCourses : courseList)
      .flatMap(c => courseBranchMap[c] || [])
  )].sort();

  // ── Toggle helpers ──────────────────────────────────────────────────────
  const toggleCollege = (id: string) =>
    onChangeColleges(accessColleges.includes(id)
      ? accessColleges.filter(c => c !== id)
      : [...accessColleges, id]);

  const toggleCourse = (course: string) => {
    const next = accessCourses.includes(course)
      ? accessCourses.filter(c => c !== course)
      : [...accessCourses, course];
    onChangeCourses(next);
    // Remove branches that no longer belong to any remaining course
    if (!next.includes(course)) {
      const remaining = new Set(next.flatMap(c => courseBranchMap[c] || []));
      onChangeBranches(accessBranches.filter(b => remaining.has(b)));
    }
  };

  const toggleBranch = (branch: string) =>
    onChangeBranches(accessBranches.includes(branch)
      ? accessBranches.filter(b => b !== branch)
      : [...accessBranches, branch]);

  // Add new course (admin-defined; not yet in student DB)
  const addCourse = (name: string) => {
    if (courseBranchMap[name]) return;
    setCourseBranchMap(prev => ({ ...prev, [name]: [] }));
    if (!accessCourses.includes(name)) onChangeCourses([...accessCourses, name]);
  };

  // Add new branch under currently selected courses (or all if none selected)
  const addBranch = (name: string) => {
    const targets = accessCourses.length > 0 ? accessCourses : courseList;
    setCourseBranchMap(prev => {
      const updated = { ...prev };
      targets.forEach(c => {
        if (updated[c] && !updated[c].includes(name)) {
          updated[c] = [...updated[c], name];
        }
      });
      return updated;
    });
    if (!accessBranches.includes(name)) onChangeBranches([...accessBranches, name]);
  };

  // ── Summary badges ──────────────────────────────────────────────────────
  const totalSelected = accessColleges.length + accessCourses.length + accessBranches.length;
  const isAllAccess = totalSelected === 0;

  const collegeNameById = (id: string) =>
    colleges.find(c => c._id === id)?.name || id;

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      {/* ── Header toggle ── */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Users className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-sm font-semibold">Who Can Access</span>
          {isAllAccess ? (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
              All Students
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 border border-violet-200">
              {totalSelected} filter{totalSelected !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
        }
      </button>

      {expanded && (
        <div className="p-4 space-y-5 border-t bg-white">

          {/* Info note */}
          <div className="flex gap-2 items-start bg-blue-50 border border-blue-100 rounded-lg p-2.5">
            <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-blue-700 text-[10px] font-bold">i</span>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Leave all empty to allow <strong>all students</strong> access.
              Tick specific colleges, courses or branches to restrict who can see this content.
            </p>
          </div>

          {/* ── COLLEGES ── */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <SectionHeader icon={Building2} color="#3b82f6" label="Colleges" count={accessColleges.length} />
            <SelectedPills
              items={accessColleges}
              onRemove={toggleCollege}
              color="#3b82f6"
              renderLabel={collegeNameById}
            />
            <CheckboxList
              items={colleges.map(c => c._id)}
              selected={accessColleges}
              onToggle={toggleCollege}
              loading={loadingColleges}
              emptyText="No colleges registered yet"
              renderLabel={id => colleges.find(c => c._id === id)?.name || id}
            />
          </div>

          {/* ── COURSES ── */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <SectionHeader icon={BookOpen} color="#8b5cf6" label="Courses" count={accessCourses.length} />
            <SelectedPills
              items={accessCourses}
              onRemove={toggleCourse}
              color="#8b5cf6"
            />
            <CheckboxList
              items={courseList}
              selected={accessCourses}
              onToggle={toggleCourse}
              onAdd={addCourse}
              loading={loadingCourses}
              emptyText="No courses found — add one below"
              addPlaceholder="e.g., B.Tech, MBA, MCA…"
            />
          </div>

          {/* ── BRANCHES ── */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <SectionHeader icon={GitBranch} color="#10b981" label="Branches" count={accessBranches.length} />
            {accessCourses.length > 0 && branchList.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mb-2">
                No branches found for the selected courses — add one below.
              </p>
            )}
            {accessCourses.length === 0 && (
              <p className="text-xs text-slate-500 mb-2 italic">
                Showing all branches. Select courses above to filter.
              </p>
            )}
            <SelectedPills
              items={accessBranches}
              onRemove={toggleBranch}
              color="#10b981"
            />
            <CheckboxList
              items={branchList}
              selected={accessBranches}
              onToggle={toggleBranch}
              onAdd={addBranch}
              loading={loadingCourses}
              emptyText="No branches available"
              addPlaceholder="e.g., CSE, ECE, Mechanical…"
            />
          </div>

        </div>
      )}
    </div>
  );
}

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut, LayoutDashboard, BookOpen, Users, BarChart3,
  Trophy, ClipboardList, FileText, Presentation, Sparkles,
  ImagePlay, GalleryHorizontalEnd, BookMarked, Menu, X, ChevronRight, Bell
} from "lucide-react";
import StudentAdsBanner from "@/components/StudentAdsBanner";

interface NavItem { label: string; href: string; icon: React.ElementType; group?: string; badge?: string; }

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard",       href: "/dashboard",            icon: LayoutDashboard, group: "Overview"  },
    { label: "Exam Management", href: "/dashboard/exams",      icon: BookOpen,        group: "Content"   },
    { label: "User Management", href: "/dashboard/users",      icon: Users,           group: "Content"   },
    { label: "Analytics",       href: "/dashboard/analytics",  icon: BarChart3,       group: "Content"   },
    { label: "Results",         href: "/dashboard/admin-results", icon: Trophy,          group: "Content"   },
    { label: "PDF Upload",      href: "/dashboard/pdf-upload", icon: FileText,        group: "Materials" },
    { label: "PPT Upload",      href: "/dashboard/ppt-upload", icon: Presentation,    group: "Materials" },
    { label: "Ads",             href: "/dashboard/ads",        icon: Sparkles,        group: "Materials", badge: "AD" },
    { label: "Media",           href: "/dashboard/media-lib",  icon: GalleryHorizontalEnd, group: "Materials" },
    { label: "Magazines",       href: "/dashboard/magazines",  icon: BookMarked,      group: "Materials" },
  ],
  college: [
    { label: "Dashboard",           href: "/dashboard",             icon: LayoutDashboard },
    { label: "Student Performance", href: "/dashboard/performance", icon: Trophy },
    { label: "Rank Table",          href: "/dashboard/ranks",       icon: BarChart3 },
  ],
  student: [
    { label: "Dashboard",     href: "/dashboard",            icon: LayoutDashboard, group: "Home"      },
    { label: "Exams",         href: "/dashboard/exams",      icon: ClipboardList,   group: "Academics" },
    { label: "Results",       href: "/dashboard/results",    icon: FileText,        group: "Academics" },
    { label: "PDF Materials", href: "/dashboard/study-pdfs", icon: BookOpen,        group: "Resources" },
    { label: "PPT Materials", href: "/dashboard/study-ppts", icon: Presentation,    group: "Resources" },
    { label: "Media Gallery", href: "/dashboard/media",      icon: ImagePlay,       group: "Resources" },
    { label: "Magazines",     href: "/dashboard/magazines",  icon: BookMarked,      group: "Resources" },
  ],
};

const roleConfig: Record<string, { label: string; grad: string; dot: string; avatarRing: string }> = {
  admin:   { label: "Administrator", grad: "from-violet-500 to-purple-600", dot: "bg-violet-500", avatarRing: "ring-violet-200" },
  college: { label: "College",       grad: "from-sky-400 to-blue-500",      dot: "bg-sky-400",    avatarRing: "ring-sky-200"    },
  student: { label: "Student",       grad: "from-indigo-400 to-violet-500", dot: "bg-indigo-400", avatarRing: "ring-indigo-200" },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (!user) return null;

  const navItems = navByRole[user.role] || [];
  const rc = roleConfig[user.role] || roleConfig.student;

  const groups: Record<string, NavItem[]> = {};
  navItems.forEach(item => {
    const g = item.group || "Main";
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });
  const hasGroups = Object.keys(groups).length > 1;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-black flex items-center justify-center shrink-0 shadow-md">
            <img src="/vjtha-logo.png" alt="Vjtha Learning" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none mb-0.5 truncate">Vjtha Learning</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot} animate-pulse shrink-0`} />
              <span className="text-[11px] font-semibold text-slate-400 truncate">{rc.label}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)}
          className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {hasGroups ? (
          Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 px-3 mb-1.5">{group}</p>
              <div className="space-y-0.5">
                {items.map(item => <SideNavLink key={item.href} item={item} isActive={location.pathname === item.href} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-0.5">
            {navItems.map(item => <SideNavLink key={item.href} item={item} isActive={location.pathname === item.href} />)}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 bg-slate-50 border border-slate-100">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${rc.grad} flex items-center justify-center text-white text-sm font-extrabold shadow-sm ring-2 ${rc.avatarRing} shrink-0`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              {rc.label}{user.role === "student" && (user as any).regNo ? ` · ${(user as any).regNo}` : ""}
            </p>
          </div>
          <Bell className="w-4 h-4 text-slate-300 shrink-0" />
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-rose-500 transition-all duration-150">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex app-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 gradient-sidebar flex-col shrink-0 fixed top-0 left-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-72 max-w-[85vw] gradient-sidebar z-50 flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-xl border-b border-violet-100/50 shadow-sm flex items-center gap-3 px-4">
          <button onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-black flex items-center justify-center shrink-0 shadow">
              <img src="/vjtha-logo.png" alt="Vjtha Learning" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 truncate">Vjtha Learning</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-violet-400" />
            </button>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rc.grad} flex items-center justify-center text-white text-xs font-extrabold shadow`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Student ads — floating square bottom-right */}
      {user.role === 'student' && <StudentAdsBanner />}
    </div>
  );
}

function SideNavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
        isActive
          ? "nav-active text-white font-bold shadow-sm"
          : "text-slate-500 font-bold hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <item.icon className={`w-4 h-4 shrink-0 transition-all duration-150 ${
          isActive ? "text-white" : "text-slate-400 group-hover:text-violet-500 group-hover:scale-110"
        }`} />
        <span>{item.label}</span>
        {item.badge && !isActive && (
          <span className="text-[9px] font-black bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">{item.badge}</span>
        )}
      </div>
      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
    </Link>
  );
}

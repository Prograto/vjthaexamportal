import { LucideIcon, TrendingUp } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  trend?: number;
  color?: string;
  delay?: number;
}

const colorMap: Record<string, { bg: string; icon: string; soft: string; grad: string }> = {
  violet: { bg: 'from-violet-500 to-indigo-500',  icon: 'text-violet-500',  soft: 'bg-violet-50  border-violet-100', grad: 'from-violet-500 to-indigo-500' },
  sky:    { bg: 'from-sky-400 to-blue-500',        icon: 'text-sky-500',     soft: 'bg-sky-50     border-sky-100',    grad: 'from-sky-400 to-blue-500'      },
  indigo: { bg: 'from-indigo-400 to-violet-500',   icon: 'text-indigo-500',  soft: 'bg-indigo-50  border-indigo-100', grad: 'from-indigo-400 to-violet-500' },
  rose:   { bg: 'from-rose-400 to-pink-500',       icon: 'text-rose-500',    soft: 'bg-rose-50    border-rose-100',   grad: 'from-rose-400 to-pink-500'     },
  teal:   { bg: 'from-teal-400 to-cyan-500',       icon: 'text-teal-500',    soft: 'bg-teal-50    border-teal-100',   grad: 'from-teal-400 to-cyan-500'     },
  amber:  { bg: 'from-amber-400 to-orange-500',    icon: 'text-amber-500',   soft: 'bg-amber-50   border-amber-100',  grad: 'from-amber-400 to-orange-500'  },
  blue:   { bg: 'from-blue-500 to-cyan-500',       icon: 'text-blue-500',    soft: 'bg-blue-50    border-blue-100',   grad: 'from-blue-500 to-cyan-500'     },
};

export default function StatCard({ label, value, icon: Icon, sub, trend, color = 'violet', delay = 0 }: Props) {
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className="stat-card card-accent-bottom group cursor-default animate-fade-up"
      style={{ animationDelay: `${delay}s`, opacity: 0, animationFillMode: 'forwards' }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${c.soft} border flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 mb-0.5 animate-count-up">{value}</div>
        <div className="text-sm font-medium text-slate-400">{label}</div>
        {sub && <div className="text-xs text-slate-300 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

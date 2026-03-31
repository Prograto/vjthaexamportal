import { useEffect, useState } from 'react';
import { examAPI } from '@/services/api';
import { Zap } from 'lucide-react';

export default function FloatingMediaTicker() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    examAPI.getPublished()
      .then(res => {
        const exams = res.data?.data || [];
        const labels = exams.flatMap((e: any) =>
          (e.sections||[]).map((s: any) => `📋 ${e.title} — ${s.name}`)
        );
        if (labels.length > 0) setItems(labels);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-9 flex items-center overflow-hidden lg:left-64"
      style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #38bdf8)' }}>
      <div className="flex items-center gap-2.5 px-3 shrink-0 border-r border-white/20 mr-3">
        <Zap className="w-3.5 h-3.5 text-yellow-300" />
        <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
      </div>
      <div className="ticker-wrap flex-1">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span key={i} className="inline-block text-white/85 text-xs font-medium mr-14">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

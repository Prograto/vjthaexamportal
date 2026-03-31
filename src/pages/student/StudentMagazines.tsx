import { useState, useEffect } from 'react';
import { magazineAPI } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BookMarked, FileText, Eye, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getDocumentPreviewUrl } from '@/lib/preview';

interface Magazine {
  _id: string;
  title: string;
  description: string;
  edition: string;
  size: string;
  s3Url?: string;
  createdAt: string;
}

export default function StudentMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [reading, setReading]     = useState<Magazine | null>(null);

  useEffect(() => {
    magazineAPI.getAll({ active: true })
      .then(res => setMagazines(res.data?.data || []))
      .catch(() => toast.error('Failed to load magazines'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = magazines.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.edition?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      <span className="text-slate-400 font-medium text-sm">Loading magazines...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Magazines</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">{magazines.length} magazine{magazines.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <Input
          className="pl-10 h-11 rounded-xl bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-medium text-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-100 shadow-sm"
          placeholder="Search magazines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-violet-200" />
          </div>
          <p className="text-slate-500 font-bold mb-1">{search ? "No magazines match your search" : "No magazines available yet"}</p>
          <p className="text-slate-300 text-xs font-medium">Check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, idx) => (
            <div key={m._id} className="glass-card card-accent-bottom p-5 flex flex-col gap-4 animate-fade-up"
              style={{ animationDelay: `${idx * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <BookMarked className="w-6 h-6 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-800 truncate text-sm">{m.title}</h3>
                  {m.edition && (
                    <span className="text-[10px] font-black bg-violet-50 text-violet-500 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 inline-block">
                      {m.edition}
                    </span>
                  )}
                  {m.description && (
                    <p className="text-xs text-slate-400 font-medium mt-1.5 line-clamp-2">{m.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-violet-50 mt-auto">
                <span className="text-xs text-slate-400 font-semibold">
                  {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  {m.size && ` · ${m.size}`}
                </span>
                <Button size="sm" onClick={() => setReading(m)}
                  className="h-8 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs border-0 shadow-sm gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Read
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!reading} onOpenChange={() => setReading(null)}>
        <DialogContent className="max-w-4xl h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 font-extrabold text-slate-800">
              <FileText className="w-5 h-5 text-violet-500" />
              {reading?.title}
              {reading?.edition && (
                <span className="text-xs font-bold bg-violet-50 text-violet-500 border border-violet-100 px-2 py-0.5 rounded-full ml-1">{reading.edition}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {reading?.s3Url && (
              <iframe
                src={getDocumentPreviewUrl(reading.s3Url, 'magazine')}
                className="w-full h-full"
                title={reading.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

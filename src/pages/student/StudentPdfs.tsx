import { useState, useEffect } from "react";
import { FileText, Download, Eye, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { materialAPI } from "@/services/api";
import { toast } from "sonner";
import { getDocumentPreviewUrl } from "@/lib/preview";

export default function StudentPdfs() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    materialAPI.getAll('pdf')
      .then(res => setMaterials(res.data?.data || []))
      .catch(() => toast.error("Failed to load PDFs"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = async (m: any) => {
    setLoadingFile(true);
    try {
      const res = await materialAPI.getById(m._id);
      setViewing(res.data.data);
    } catch {
      toast.error("Failed to load file");
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDownload = async (m: any) => {
    setLoadingFile(true);
    try {
      const res = await materialAPI.getById(m._id);
      const s3Url = res.data.data.s3Url;
      if (!s3Url) { toast.error("File URL not available"); return; }
      const link = document.createElement("a");
      link.href = s3Url;
      link.target = "_blank";
      link.download = res.data.data.originalName || `${m.title}.pdf`;
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    } finally {
      setLoadingFile(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      <span className="text-slate-400 font-medium text-sm">Loading PDFs...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">PDF Materials</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">Study documents uploaded by your admin</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <Input
          className="pl-10 h-11 rounded-xl bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-medium text-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-100 shadow-sm"
          placeholder="Search PDFs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-slate-500 font-bold mb-1">{search ? "No PDFs match your search" : "No PDFs available yet"}</p>
          <p className="text-slate-300 text-xs font-medium">Check back later — your admin will upload study materials here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, idx) => (
            <div key={m._id} className="glass-card card-accent-bottom p-5 flex flex-col gap-4 animate-fade-up"
              style={{ animationDelay: `${idx * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-800 truncate text-sm">{m.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-widest">PDF</span>
                    {m.size && <span className="text-xs text-slate-400 font-semibold">{m.size}</span>}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Added {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline"
                  className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 font-bold text-xs hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50"
                  onClick={() => handleView(m)} disabled={loadingFile}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                </Button>
                <Button size="sm"
                  className="flex-1 h-9 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs border-0 shadow-sm"
                  onClick={() => handleDownload(m)} disabled={loadingFile}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold text-slate-800">
              <FileText className="w-5 h-5 text-rose-500" />
              {viewing?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-100">
            {viewing?.s3Url && (
              <iframe src={getDocumentPreviewUrl(viewing.s3Url, 'pdf')} className="w-full h-full" title={viewing.title} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

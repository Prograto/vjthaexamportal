import { useState, useEffect } from "react";
import { Presentation, FileUp, X, CheckCircle, Loader2, Pencil, Plus, FolderOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { materialAPI } from "@/services/api";
import { toast } from "sonner";
import AccessControlFields from "@/components/AccessControlFields";

interface PptCategory { id: string; name: string; accessColleges: string[]; accessCourses: string[]; accessBranches: string[]; }
interface MaterialItem { _id: string; title: string; size: string; createdAt: string; category?: string; accessColleges?: string[]; accessCourses?: string[]; accessBranches?: string[]; }

function CategoryFormDialog({ open, onClose, onSaved, existing }: { open: boolean; onClose: () => void; onSaved: (c: PptCategory) => void; existing?: PptCategory | null }) {
  const isEdit = !!existing;
  const [name, setName] = useState('');
  const [accessColleges, setAccessColleges] = useState<string[]>([]);
  const [accessCourses, setAccessCourses] = useState<string[]>([]);
  const [accessBranches, setAccessBranches] = useState<string[]>([]);
  useEffect(() => { if (open) { setName(existing?.name || ''); setAccessColleges(existing?.accessColleges || []); setAccessCourses(existing?.accessCourses || []); setAccessBranches(existing?.accessBranches || []); } }, [open, existing]);
  const handleSave = () => {
    if (!name.trim()) { toast.error('Category name is required'); return; }
    onSaved({ id: existing?.id || Date.now().toString(), name: name.trim(), accessColleges, accessCourses, accessBranches });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2">{isEdit ? <Pencil className="w-5 h-5 text-orange-500" /> : <Plus className="w-5 h-5 text-orange-500" />}{isEdit ? 'Edit PPT Category' : 'New PPT Category'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5"><Label>Category Name <span className="text-destructive">*</span></Label><Input placeholder="e.g., Computer Networks, DBMS…" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
          <AccessControlFields accessColleges={accessColleges} accessCourses={accessCourses} accessBranches={accessBranches} onChangeColleges={setAccessColleges} onChangeCourses={setAccessCourses} onChangeBranches={setAccessBranches} />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={!name.trim()}>{isEdit ? <><Pencil className="w-4 h-4 mr-2" />Save</> : <><Plus className="w-4 h-4 mr-2" />Create</>}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onClose, onUploaded, category }: { open: boolean; onClose: () => void; onUploaded: (m: MaterialItem) => void; category: PptCategory }) {
  const [title, setTitle] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const processFile = async (file: File) => {
    if (!file) return;
    const allowed = file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx');
    if (!allowed) { toast.error('Only PPT/PPTX files allowed'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const res = await materialAPI.upload(
        file,
        { title: title.trim() || file.name, category: category.name, accessColleges: category.accessColleges, accessCourses: category.accessCourses, accessBranches: category.accessBranches },
        (pct) => setProgress(pct)
      );
      setTitle(''); toast.success(`PPT uploaded to "${category.name}" ✓`); onUploaded(res.data.data); onClose();
    } catch (err: any) { toast.error('Upload failed: ' + (err.response?.data?.message || err.message)); }
    finally { setUploading(false); setProgress(0); }
  };

  const uploadFromUrl = async () => {
    if (!sourceUrl.trim()) {
      toast.error('Enter a Google Drive or direct PPT/PPTX URL');
      return;
    }
    setUploading(true);
    try {
      const res = await materialAPI.createFromUrl({
        sourceUrl: sourceUrl.trim(),
        type: 'ppt',
        title: title.trim() || undefined,
        category: category.name,
        accessColleges: category.accessColleges,
        accessCourses: category.accessCourses,
        accessBranches: category.accessBranches,
      });
      setTitle('');
      setSourceUrl('');
      toast.success(`PPT URL added to "${category.name}" ✓`);
      onUploaded(res.data.data);
      onClose();
    } catch (err: any) {
      toast.error('URL upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileUp className="w-5 h-5 text-orange-500" />Upload PPT to "{category.name}"</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>File Title (optional)</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a title" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={uploadMode === 'file' ? 'default' : 'outline'} className={uploadMode === 'file' ? 'bg-orange-500 hover:bg-orange-600' : ''} onClick={() => setUploadMode('file')} disabled={uploading}>Upload File</Button>
            <Button type="button" variant={uploadMode === 'url' ? 'default' : 'outline'} className={uploadMode === 'url' ? 'bg-orange-500 hover:bg-orange-600' : ''} onClick={() => setUploadMode('url')} disabled={uploading}>Use URL</Button>
          </div>
          {uploadMode === 'file' ? (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <input type="file" accept=".ppt,.pptx" className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                  <p className="text-sm text-muted-foreground">Uploading… {progress > 0 ? `${progress}%` : ''}</p>
                  {progress > 0 && <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><FileUp className="w-6 h-6 text-orange-500" /></div>
                  <p className="font-medium text-sm">Drop PPT/PPTX here or click to browse</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 border rounded-xl p-3">
              <div>
                <Label>Google Drive / PPT URL</Label>
                <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://drive.google.com/file/... or https://...pptx" className="mt-1" />
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={uploadFromUrl} disabled={uploading || !sourceUrl.trim()}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving URL...</> : 'Add PPT URL'}
              </Button>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={onClose} disabled={uploading}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMaterialDialog({ open, onClose, onSaved, material }: { open: boolean; onClose: () => void; onSaved: (m: MaterialItem) => void; material: MaterialItem | null }) {
  const [title, setTitle] = useState('');
  const [accessColleges, setAccessColleges] = useState<string[]>([]);
  const [accessCourses, setAccessCourses] = useState<string[]>([]);
  const [accessBranches, setAccessBranches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open && material) { setTitle(material.title); setAccessColleges(material.accessColleges || []); setAccessCourses(material.accessCourses || []); setAccessBranches(material.accessBranches || []); } }, [open, material]);
  const handleSave = async () => {
    if (!material) return; setSaving(true);
    try { const res = await materialAPI.update(material._id, { title, accessColleges, accessCourses, accessBranches }); toast.success('PPT updated'); onSaved(res.data.data); onClose(); }
    catch (err: any) { toast.error('Update failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-orange-500" />Edit PPT</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <AccessControlFields accessColleges={accessColleges} accessCourses={accessCourses} accessBranches={accessBranches} onChangeColleges={setAccessColleges} onChangeCourses={setAccessCourses} onChangeBranches={setAccessBranches} />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PptUpload() {
  const [categories, setCategories] = useState<PptCategory[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<PptCategory | null>(null);
  const [openCat, setOpenCat] = useState<PptCategory | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editMaterial, setEditMaterial] = useState<MaterialItem | null>(null);

  useEffect(() => { const s = localStorage.getItem('ppt_categories'); if (s) setCategories(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('ppt_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    setLoadingList(true);
    try { const res = await materialAPI.getAll('ppt'); setMaterials(res.data?.data || []); }
    catch { toast.error('Failed to load PPTs'); }
    finally { setLoadingList(false); }
  };

  const handleDelete = async (id: string) => {
    try { await materialAPI.delete(id); setMaterials(prev => prev.filter(m => m._id !== id)); toast.success('PPT removed'); }
    catch (err: any) { toast.error('Delete failed: ' + (err.response?.data?.message || err.message)); }
  };

  const catMaterials = openCat ? materials.filter(m => m.category === openCat.name) : [];

  if (openCat) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setOpenCat(null)} className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate"><Presentation className="w-5 h-5 text-orange-500 shrink-0" /><span className="truncate">{openCat.name}</span></h1>
            <p className="text-xs text-muted-foreground">{catMaterials.length} PPT{catMaterials.length !== 1 ? 's' : ''}</p>
          </div>
          <Button className="gap-1.5 bg-orange-500 hover:bg-orange-600 shrink-0 text-sm px-3" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add PPT</span><span className="sm:hidden">Add</span></Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {loadingList ? <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
            : catMaterials.length === 0 ? (
              <div className="p-8 sm:p-10 text-center text-muted-foreground">
                <Presentation className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No PPTs yet</p>
                <Button className="mt-4 gap-2 bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" />Add First PPT</Button>
              </div>
            ) : (
              <div className="divide-y">
                {catMaterials.map(m => (
                  <div key={m._id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0"><Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" /></div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{m.title}</p><p className="text-xs text-muted-foreground">{m.size} · {new Date(m.createdAt).toLocaleDateString()}</p></div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs hidden sm:flex"><CheckCircle className="w-3 h-3 mr-1" />PPT</Badge>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-600" onClick={() => setEditMaterial(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(m._id)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <UploadDialog open={showUpload} category={openCat} onClose={() => setShowUpload(false)} onUploaded={m => setMaterials(prev => [m, ...prev])} />
        <EditMaterialDialog open={!!editMaterial} material={editMaterial} onClose={() => setEditMaterial(null)} onSaved={updated => setMaterials(prev => prev.map(m => m._id === updated._id ? updated : m))} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">PPT Materials</h1>
          <p className="text-muted-foreground text-sm">Organise presentations into categories and control student access</p>
        </div>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600 shrink-0 self-start" onClick={() => { setEditCat(null); setShowCatForm(true); }}><Plus className="w-4 h-4" />New Category</Button>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-muted-foreground border-2 border-dashed rounded-xl">
          <FolderOpen className="w-12 h-12 sm:w-14 sm:h-14 opacity-20 mb-3" /><p className="font-medium">No categories yet</p>
          <Button className="mt-5 gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => setShowCatForm(true)}><Plus className="w-4 h-4" />Create First Category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(cat => {
            const count = materials.filter(m => m.category === cat.name).length;
            const totalAccess = cat.accessColleges.length + cat.accessCourses.length + cat.accessBranches.length;
            return (
              <Card key={cat.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenCat(cat)}>
                <div className="h-20 sm:h-24 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center"><Presentation className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" /></div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{cat.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">{count} PPT{count !== 1 ? 's' : ''}</p>
                        {totalAccess === 0 ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700">All Students</Badge> : <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-700">Restricted</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-600" onClick={() => { setEditCat(cat); setShowCatForm(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => setCategories(prev => prev.filter(c => c.id !== cat.id))}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <CategoryFormDialog open={showCatForm} existing={editCat} onClose={() => { setShowCatForm(false); setEditCat(null); }} onSaved={cat => { if (editCat) setCategories(prev => prev.map(c => c.id === cat.id ? cat : c)); else setCategories(prev => [...prev, cat]); }} />
    </div>
  );
}

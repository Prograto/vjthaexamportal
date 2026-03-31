import { useState, useEffect, useRef } from 'react';
import { magazineAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, Loader2, Eye, FileText, BookMarked, X,
  ExternalLink, Pencil, FolderOpen, ChevronRight, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import AccessControlFields from '@/components/AccessControlFields';
import { getDocumentPreviewUrl } from '@/lib/preview';

interface Magazine {
  _id: string; title: string; description: string; edition: string;
  category?: string; originalName: string; size: string; isActive: boolean; order: number; createdAt: string;
  s3Url?: string;
  accessColleges?: string[]; accessCourses?: string[]; accessBranches?: string[];
}

interface MagCategory {
  id: string; name: string;
  accessColleges: string[]; accessCourses: string[]; accessBranches: string[];
}


// ── Category Form Dialog ──────────────────────────────────────────────────────
function CategoryFormDialog({ open, onClose, onSaved, existing }: { open: boolean; onClose: () => void; onSaved: (c: MagCategory) => void; existing?: MagCategory | null }) {
  const isEdit = !!existing;
  const [name, setName] = useState('');
  const [accessColleges, setAccessColleges] = useState<string[]>([]);
  const [accessCourses, setAccessCourses]   = useState<string[]>([]);
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
        <DialogHeader><DialogTitle className="flex items-center gap-2">{isEdit ? <Pencil className="w-5 h-5 text-rose-500" /> : <Plus className="w-5 h-5 text-rose-500" />}{isEdit ? 'Edit Magazine Category' : 'New Magazine Category'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5"><Label>Category Name <span className="text-destructive">*</span></Label><Input placeholder="e.g., Tech Monthly, Campus Life…" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
          <AccessControlFields accessColleges={accessColleges} accessCourses={accessCourses} accessBranches={accessBranches} onChangeColleges={setAccessColleges} onChangeCourses={setAccessCourses} onChangeBranches={setAccessBranches} />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleSave} disabled={!name.trim()}>{isEdit ? <><Pencil className="w-4 h-4 mr-2" />Save</> : <><Plus className="w-4 h-4 mr-2" />Create</>}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Magazine Dialog ────────────────────────────────────────────────────
function UploadMagazineDialog({ open, onClose, onUploaded, category, magazines }: {
  open: boolean; onClose: () => void; onUploaded: () => void; category: MagCategory; magazines: Magazine[];
}) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [edition, setEdition]   = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
  };

  const handleUpload = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (uploadMode === 'file' && !file) { toast.error('PDF file is required'); return; }
    if (uploadMode === 'url' && !sourceUrl.trim()) { toast.error('Google Drive or PDF URL is required'); return; }
    setSaving(true);
    try {
      if (uploadMode === 'file' && file) {
        await magazineAPI.create(file, {
          title: title.trim(), description: description.trim(), edition: edition.trim(),
          order: magazines.length, category: category.name,
          accessColleges: category.accessColleges, accessCourses: category.accessCourses, accessBranches: category.accessBranches,
        });
      } else {
        await magazineAPI.createFromUrl({
          sourceUrl: sourceUrl.trim(),
          title: title.trim(),
          description: description.trim(),
          edition: edition.trim(),
          order: magazines.length,
          category: category.name,
          accessColleges: category.accessColleges,
          accessCourses: category.accessCourses,
          accessBranches: category.accessBranches,
        });
      }
      toast.success(`📖 Magazine published to "${category.name}"!`);
      setTitle(''); setDesc(''); setEdition(''); setFile(null); setSourceUrl('');
      onUploaded(); onClose();
    } catch (err: any) { toast.error('Upload failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BookMarked className="w-5 h-5 text-rose-500" />Add Magazine to &quot;{category.name}&quot;</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Title <span className="text-destructive">*</span></Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Magazine title…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Edition</Label><Input value={edition} onChange={e => setEdition(e.target.value)} placeholder="e.g., Vol. 1, Jan 2025" /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Short description…" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={uploadMode === 'file' ? 'default' : 'outline'} className={uploadMode === 'file' ? 'bg-rose-500 hover:bg-rose-600' : ''} onClick={() => setUploadMode('file')} disabled={saving}>Upload File</Button>
            <Button type="button" variant={uploadMode === 'url' ? 'default' : 'outline'} className={uploadMode === 'url' ? 'bg-rose-500 hover:bg-rose-600' : ''} onClick={() => setUploadMode('url')} disabled={saving}>Use URL</Button>
          </div>
          {uploadMode === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-rose-400 bg-rose-50/50' : file ? 'border-emerald-400 bg-emerald-50/30' : 'border-border hover:border-rose-300'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                  <div className="text-left min-w-0"><p className="font-medium text-sm truncate">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }} className="ml-auto shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <BookMarked className="w-8 h-8 text-rose-400" /><p className="text-sm font-medium">Drop PDF here or click to browse</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Google Drive / PDF URL</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://drive.google.com/file/... or https://...pdf" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleUpload} disabled={saving || !title.trim() || (uploadMode === 'file' ? !file : !sourceUrl.trim())}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading…</> : <><BookMarked className="w-4 h-4 mr-2" />Publish</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Magazine Dialog ──────────────────────────────────────────────────────
function EditMagazineDialog({ open, onClose, onSaved, magazine }: { open: boolean; onClose: () => void; onSaved: (m: Magazine) => void; magazine: Magazine | null }) {
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [edition, setEdition] = useState('');
  const [accessColleges, setAccessColleges] = useState<string[]>([]);
  const [accessCourses, setAccessCourses]   = useState<string[]>([]);
  const [accessBranches, setAccessBranches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open && magazine) { setTitle(magazine.title); setDesc(magazine.description); setEdition(magazine.edition); setAccessColleges(magazine.accessColleges || []); setAccessCourses(magazine.accessCourses || []); setAccessBranches(magazine.accessBranches || []); } }, [open, magazine]);
  const handleSave = async () => {
    if (!magazine) return; setSaving(true);
    try { const res = await magazineAPI.update(magazine._id, { title, description, edition, accessColleges, accessCourses, accessBranches }); toast.success('Magazine updated'); onSaved(res.data.data); onClose(); }
    catch (err: any) { toast.error('Update failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-rose-500" />Edit Magazine</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Edition</Label><Input value={edition} onChange={e => setEdition(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} /></div>
          <AccessControlFields accessColleges={accessColleges} accessCourses={accessCourses} accessBranches={accessBranches} onChangeColleges={setAccessColleges} onChangeCourses={setAccessCourses} onChangeBranches={setAccessBranches} />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MagazineManagement() {
  const [categories, setCategories] = useState<MagCategory[]>([]);
  const [magazines,  setMagazines]  = useState<Magazine[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat]         = useState<MagCategory | null>(null);
  const [openCat, setOpenCat]         = useState<MagCategory | null>(null);
  const [showUpload, setShowUpload]   = useState(false);
  const [editMag, setEditMag]         = useState<Magazine | null>(null);
  const [preview, setPreview]         = useState<Magazine | null>(null);

  useEffect(() => { const s = localStorage.getItem('mag_categories'); if (s) setCategories(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('mag_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { fetchMagazines(); }, []);

  const fetchMagazines = async () => {
    setLoading(true);
    try { const res = await magazineAPI.getAll(); setMagazines(res.data?.data || []); }
    catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };

  const handleToggle = async (mag: Magazine) => {
    try { await magazineAPI.update(mag._id, { isActive: !mag.isActive }); setMagazines(prev => prev.map(m => m._id === mag._id ? { ...m, isActive: !m.isActive } : m)); }
    catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleDelete = async (id: string) => {
    try { await magazineAPI.delete(id); setMagazines(prev => prev.filter(m => m._id !== id)); toast.success('Deleted'); }
    catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const catMags = openCat ? magazines.filter(m => m.category === openCat.name) : [];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (openCat) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setOpenCat(null)} className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate"><BookMarked className="w-5 h-5 text-rose-500 shrink-0" /><span className="truncate">{openCat.name}</span></h1>
            <p className="text-xs text-muted-foreground">{catMags.length} magazine{catMags.length !== 1 ? 's' : ''}</p>
          </div>
          <Button className="gap-1.5 bg-rose-500 hover:bg-rose-600 shrink-0 text-sm px-3" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Magazine</span><span className="sm:hidden">Add</span></Button>
        </div>

        {catMags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            <BookMarked className="w-12 h-12 opacity-20 mb-3" /><p>No magazines in this category yet</p>
            <Button className="mt-4 gap-2 bg-rose-500 hover:bg-rose-600" size="sm" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" />Add First Magazine</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {catMags.map(mag => (
              <Card key={mag._id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-36 bg-gradient-to-br from-rose-50 to-rose-100 flex flex-col items-center justify-center cursor-pointer relative" onClick={() => setPreview(mag)}>
                  <div className="w-14 h-16 rounded-lg bg-rose-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"><FileText className="w-7 h-7 text-white" /></div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-t-xl"><Eye className="w-5 h-5 text-white" /><span className="text-white text-sm font-medium">Read</span></div>
                  {!mag.isActive && <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-xs px-2 py-0.5 rounded-full">Hidden</div>}
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm truncate">{mag.title}</p>
                  {mag.edition && <p className="text-xs text-rose-600 font-medium mt-0.5">{mag.edition}</p>}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2"><Switch checked={mag.isActive} onCheckedChange={() => handleToggle(mag)} /><span className="text-xs text-muted-foreground">{mag.isActive ? 'Visible' : 'Hidden'}</span></div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-600" onClick={() => setEditMag(mag)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(mag._id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <UploadMagazineDialog open={showUpload} category={openCat} magazines={magazines} onClose={() => setShowUpload(false)} onUploaded={fetchMagazines} />
        <EditMagazineDialog open={!!editMag} magazine={editMag} onClose={() => setEditMag(null)} onSaved={updated => setMagazines(prev => prev.map(m => m._id === updated._id ? updated : m))} />

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="w-[98vw] max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2"><BookMarked className="w-5 h-5 text-rose-500" />{preview?.title}{preview?.edition && <Badge variant="outline" className="text-xs ml-2">{preview.edition}</Badge>}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">{preview?.s3Url && <iframe src={getDocumentPreviewUrl(preview.s3Url, 'magazine')} className="w-full h-full min-h-[70vh]" title={preview.title} />}</div>
            {preview?.s3Url && <div className="px-5 py-3 border-t shrink-0 flex items-center justify-between"><p className="text-xs text-muted-foreground">{preview.size}</p><a href={preview.s3Url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Open in new tab</Button></a></div>}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold">Magazines</h1><p className="text-muted-foreground text-sm">Organise magazines into categories and control student access</p></div>
        <Button className="gap-2 bg-rose-500 hover:bg-rose-600 shrink-0 self-start" onClick={() => { setEditCat(null); setShowCatForm(true); }}><Plus className="w-4 h-4" />New Category</Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-muted-foreground border-2 border-dashed rounded-xl">
          <FolderOpen className="w-12 h-12 sm:w-14 sm:h-14 opacity-20 mb-3" /><p className="font-medium">No categories yet</p>
          <Button className="mt-5 gap-2 bg-rose-500 hover:bg-rose-600" onClick={() => setShowCatForm(true)}><Plus className="w-4 h-4" />Create First Category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(cat => {
            const count = magazines.filter(m => m.category === cat.name).length;
            const totalAccess = cat.accessColleges.length + cat.accessCourses.length + cat.accessBranches.length;
            return (
              <Card key={cat.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenCat(cat)}>
                <div className="h-24 bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center"><BookMarked className="w-10 h-10 text-rose-400" /></div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{cat.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-xs text-muted-foreground">{count} magazine{count !== 1 ? 's' : ''}</p>
                        {totalAccess === 0 ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700">All Students</Badge> : <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-700">Restricted</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-rose-500 transition-colors" />
                  </div>
                  <div className="flex items-center justify-end mt-3 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
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

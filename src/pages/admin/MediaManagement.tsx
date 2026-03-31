import { useState, useEffect, useRef } from 'react';
import { mediaCategoryAPI, mediaGalleryAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, Loader2, ImageIcon, VideoIcon, Eye, Upload,
  Film, Image, CheckCircle2, X, GalleryHorizontalEnd,
  FolderOpen, FolderPlus, ChevronRight, AlertCircle, ArrowLeft, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import AccessControlFields from '@/components/AccessControlFields';
import { getVideoPreviewUrl } from '@/lib/preview';

interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  order: number;
  totalItems: number;
  imageCount: number;
  videoCount: number;
  coverId: string | null;
  coverUrl: string | null;   // s3Url of the cover MediaGallery item
  accessColleges: string[];
  accessCourses: string[];
  accessBranches: string[];
}

interface MediaItem {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  sourceProvider?: 's3' | 'google-drive' | 'youtube' | 'external';
  mimeType: string;
  size: string;
  s3Url: string;
  isActive: boolean;
  order: number;
  categoryId: string;
}

// ── Category Form Dialog (Create / Edit) ─────────────────────────────────────
function CategoryFormDialog({
  open, onClose, onSaved, existing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (cat: Category) => void;
  existing?: Category | null;
}) {
  const isEdit = !!existing;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessColleges, setAccessColleges] = useState<string[]>([]);
  const [accessCourses,  setAccessCourses]  = useState<string[]>([]);
  const [accessBranches, setAccessBranches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(existing?.name || '');
      setDescription(existing?.description || '');
      setAccessColleges(existing?.accessColleges || []);
      setAccessCourses(existing?.accessCourses   || []);
      setAccessBranches(existing?.accessBranches  || []);
    }
  }, [open, existing]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      let res;
      if (isEdit && existing) {
        res = await mediaCategoryAPI.update(existing._id, {
          name: name.trim(), description: description.trim(),
          accessColleges, accessCourses, accessBranches,
        });
        toast.success(`Category "${name}" updated`);
      } else {
        res = await mediaCategoryAPI.create({
          name: name.trim(), description: description.trim(),
          accessColleges, accessCourses, accessBranches,
        } as any);
        toast.success(`Category "${name}" created`);
      }
      onSaved(res.data.data);
      onClose();
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="w-5 h-5 text-violet-600" /> : <FolderPlus className="w-5 h-5 text-violet-600" />}
            {isEdit ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Category Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g., Campus Events, Graduation 2024…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea placeholder="Short description…" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <AccessControlFields
            accessColleges={accessColleges} accessCourses={accessCourses} accessBranches={accessBranches}
            onChangeColleges={setAccessColleges} onChangeCourses={setAccessCourses} onChangeBranches={setAccessBranches}
          />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isEdit ? <Pencil className="w-4 h-4 mr-2" /> : <FolderPlus className="w-4 h-4 mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Upload Dialog ────────────────────────────────────────────────────────
function BulkUploadDialog({
  open, category, onClose, onUploaded,
}: { open: boolean; category: Category | null; onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlMediaType, setUrlMediaType] = useState<'image' | 'video'>('image');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlDescription, setUrlDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (valid.length < newFiles.length) toast.warning('Some files were skipped (only images/videos allowed)');
    const all = [...files, ...valid];
    setFiles(all);
    setPreviews(all.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
  };

  const removeFile = (i: number) => {
    if (previews[i]) URL.revokeObjectURL(previews[i]);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    previews.forEach(u => u && URL.revokeObjectURL(u));
    setFiles([]); setPreviews([]); setDescription(''); setProgress(0);
    setUrlInput(''); setUrlTitle(''); setUrlDescription(''); setUrlMediaType('image');
  };

  const handleUpload = async () => {
    if (!files.length || !category) return;
    setSaving(true);
    try {
      const res = await mediaGalleryAPI.bulkCreate(files, { categoryId: category._id, description }, setProgress);
      const { data } = res.data;
      toast.success(`✅ ${data.length} file${data.length !== 1 ? 's' : ''} uploaded to "${category.name}"`);
      reset(); onUploaded(); onClose();
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleAddUrl = async () => {
    if (!category) return;
    if (!urlInput.trim()) {
      toast.error('Please enter a media URL');
      return;
    }
    setSaving(true);
    try {
      await mediaGalleryAPI.createFromUrl({
        categoryId: category._id,
        sourceUrl: urlInput.trim(),
        mediaType: urlMediaType,
        title: urlTitle.trim() || undefined,
        description: urlDescription.trim() || undefined,
      });
      toast.success(`URL media added to "${category.name}"`);
      reset();
      onUploaded();
      onClose();
    } catch (err: any) {
      toast.error('URL upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const images = files.filter(f => f.type.startsWith('image/'));
  const videos = files.filter(f => f.type.startsWith('video/'));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="w-[98vw] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-violet-600" />
            Upload to &ldquo;{category?.name}&rdquo;
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${dragOver ? 'border-violet-400 bg-violet-50/50' : files.length ? 'border-emerald-400 bg-emerald-50/30' : 'border-border hover:border-violet-300 hover:bg-muted/30'}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Image className="w-6 h-6 text-blue-500" /></div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Film className="w-6 h-6 text-purple-500" /></div>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Drop multiple images &amp; videos here</p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse · up to 200 MB each</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }} />
          </div>
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                  {images.length > 0 && <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 gap-1"><ImageIcon className="w-3 h-3" />{images.length}</Badge>}
                  {videos.length > 0 && <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 gap-1"><Film className="w-3 h-3" />{videos.length}</Badge>}
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-destructive h-7 gap-1" onClick={() => { previews.forEach(u => u && URL.revokeObjectURL(u)); setFiles([]); setPreviews([]); }}><X className="w-3 h-3" />Clear</Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
                    {f.type.startsWith('image/') && previews[i] ? (
                      <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-purple-50">
                        <Film className="w-5 h-5 text-purple-500" />
                        <span className="text-[9px] text-purple-600 text-center px-1 truncate w-full">{f.name}</span>
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-violet-400 flex flex-col items-center justify-center gap-1 transition-all">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Add more</span>
                </button>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g., Annual Sports Day 2024…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="border rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Add from URL</Label>
              <div className="grid grid-cols-2 gap-1">
                <Button type="button" size="sm" variant={urlMediaType === 'image' ? 'default' : 'outline'} className={urlMediaType === 'image' ? 'h-7 bg-blue-600 hover:bg-blue-700 px-2' : 'h-7 px-2'} onClick={() => setUrlMediaType('image')} disabled={saving}>Image</Button>
                <Button type="button" size="sm" variant={urlMediaType === 'video' ? 'default' : 'outline'} className={urlMediaType === 'video' ? 'h-7 bg-purple-600 hover:bg-purple-700 px-2' : 'h-7 px-2'} onClick={() => setUrlMediaType('video')} disabled={saving}>Video</Button>
              </div>
            </div>
            <Input placeholder="Google Drive / YouTube / direct URL" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Title (optional)" value={urlTitle} onChange={e => setUrlTitle(e.target.value)} />
              <Input placeholder="Description (optional)" value={urlDescription} onChange={e => setUrlDescription(e.target.value)} />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleAddUrl} disabled={saving || !urlInput.trim()}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving URL...</> : 'Add URL Media'}
            </Button>
          </div>
        </div>
        <div className="px-6 pt-3 pb-5 border-t shrink-0 bg-background space-y-2">
          {saving && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Uploading…</span><span>{progress}%</span></div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden"><div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button>
            <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold" disabled={saving || !files.length} onClick={handleUpload}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading…</> : <><Upload className="w-4 h-4 mr-2" />Upload {files.length > 0 ? files.length : ''} File{files.length !== 1 ? 's' : ''}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, onOpen, onEdit, onDelete, onToggle }: {
  cat: Category; onOpen: (c: Category) => void; onEdit: (c: Category) => void;
  onDelete: (c: Category) => void; onToggle: (c: Category) => void;
}) {
  const totalAccess = (cat.accessColleges?.length || 0) + (cat.accessCourses?.length || 0) + (cat.accessBranches?.length || 0);
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => onOpen(cat)}>
      <div className="h-32 bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center relative overflow-hidden">
        {cat.coverUrl ? (
          <img src={cat.coverUrl} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FolderOpen className="w-12 h-12 text-violet-400" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Eye className="w-5 h-5 text-white" /><span className="text-white text-sm font-medium">Open</span>
        </div>
        {!cat.isActive && <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-xs px-2 py-0.5 rounded-full">Hidden</div>}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {cat.imageCount > 0 && <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" />{cat.imageCount}</span>}
          {cat.videoCount > 0 && <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"><Film className="w-2.5 h-2.5" />{cat.videoCount}</span>}
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{cat.name}</p>
            {cat.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-xs text-muted-foreground">{cat.totalItems} item{cat.totalItems !== 1 ? 's' : ''}</p>
              {totalAccess === 0
                ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700">All</Badge>
                : <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-700">Restricted</Badge>
              }
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-violet-600 transition-colors" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Switch checked={cat.isActive} onCheckedChange={() => onToggle(cat)} />
            <span className="text-xs text-muted-foreground">{cat.isActive ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10" onClick={() => onDelete(cat)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Category Detail View ──────────────────────────────────────────────────────
function CategoryDetail({ category, onBack, onRefresh }: { category: Category; onBack: () => void; onRefresh: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await mediaGalleryAPI.getAll({ categoryId: category._id });
      setItems(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [category._id]);

  const handleDelete = async (id: string) => {
    try { await mediaGalleryAPI.delete(id); setItems(prev => prev.filter(i => i._id !== id)); onRefresh(); toast.success('Deleted'); }
    catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleToggle = async (item: MediaItem) => {
    try { await mediaGalleryAPI.update(item._id, { isActive: !item.isActive }); setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: !i.isActive } : i)); }
    catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const images = items.filter(i => i.mediaType === 'image');
  const videos = items.filter(i => i.mediaType === 'video');

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="min-w-0">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate"><FolderOpen className="w-5 h-5 text-violet-500 shrink-0" /><span className="truncate">{category.name}</span></h2>
            <p className="text-xs text-muted-foreground">{items.length} items · {images.length} images · {videos.length} videos</p>
          </div>
        </div>
        <Button className="gap-1.5 bg-violet-600 hover:bg-violet-700 shrink-0 text-sm px-3" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Files</span><span className="sm:hidden">Add</span></Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-muted-foreground border-2 border-dashed rounded-xl">
          <FolderOpen className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-medium text-sm">No files yet</p>
          <Button className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700" size="sm" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4" />Add Files</Button>
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-blue-600" /></div><span className="font-medium text-sm">Images</span><Badge variant="outline" className="text-xs">{images.length}</Badge></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {images.map(item => <MediaThumb key={item._id} item={item} onPreview={() => setPreviewItem(item)} onToggle={() => handleToggle(item)} onDelete={() => handleDelete(item._id)} />)}
              </div>
            </div>
          )}
          {videos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center"><Film className="w-3.5 h-3.5 text-purple-600" /></div><span className="font-medium text-sm">Videos</span><Badge variant="outline" className="text-xs">{videos.length}</Badge></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {videos.map(item => <MediaThumb key={item._id} item={item} onPreview={() => setPreviewItem(item)} onToggle={() => handleToggle(item)} onDelete={() => handleDelete(item._id)} />)}
              </div>
            </div>
          )}
        </>
      )}

      <BulkUploadDialog open={showUpload} category={category} onClose={() => setShowUpload(false)} onUploaded={() => { fetchItems(); onRefresh(); }} />

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="w-[98vw] max-w-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{previewItem?.mediaType === 'image' ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <Film className="w-5 h-5 text-purple-500" />}{previewItem?.title}</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="mt-2">
              {previewItem.mediaType === 'image' ? (
                <img src={previewItem.s3Url} alt={previewItem.title} className="w-full max-h-[60vh] object-contain rounded-xl" />
              ) : (
                (() => {
                  const video = getVideoPreviewUrl(previewItem.s3Url);
                  return video.isIframe
                    ? <iframe src={video.embedUrl} className="w-full min-h-[60vh] rounded-xl" title={previewItem.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    : <video src={video.embedUrl} controls autoPlay className="w-full max-h-[60vh] rounded-xl" />;
                })()
              )}
              {previewItem.description && <p className="text-sm text-muted-foreground mt-3">{previewItem.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Media Thumbnail ───────────────────────────────────────────────────────────
function MediaThumb({ item, onPreview, onToggle, onDelete }: { item: MediaItem; onPreview: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-muted aspect-square shadow-sm hover:shadow-md transition-shadow">
      {item.mediaType === 'image' ? (
        <img src={item.s3Url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex flex-col items-center justify-center gap-2">
          <Film className="w-8 h-8 text-purple-500" /><span className="text-[10px] text-purple-600 font-medium px-2 text-center truncate w-full">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button onClick={onPreview} className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center"><Eye className="w-4 h-4 text-slate-700" /></button>
        <button onClick={onDelete} className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center"><Trash2 className="w-4 h-4 text-white" /></button>
      </div>
      {!item.isActive && <div className="absolute top-1.5 left-1.5 bg-slate-800/80 text-white text-[9px] px-1.5 py-0.5 rounded-full">Hidden</div>}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await mediaCategoryAPI.getAll();
      setCategories(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleToggle = async (cat: Category) => {
    try {
      await mediaCategoryAPI.update(cat._id, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
      toast.success(cat.isActive ? 'Hidden from students' : 'Now visible to students');
    } catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleDelete = async (cat: Category) => {
    try {
      await mediaCategoryAPI.delete(cat._id);
      setCategories(prev => prev.filter(c => c._id !== cat._id));
      setDeleteConfirm(null);
      toast.success(`"${cat.name}" deleted`);
    } catch (err: any) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 gap-3"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (openCategory) {
    const current = categories.find(c => c._id === openCategory._id) || openCategory;
    return <CategoryDetail category={current} onBack={() => setOpenCategory(null)} onRefresh={fetchCategories} />;
  }

  const totalItems = categories.reduce((s, c) => s + c.totalItems, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><GalleryHorizontalEnd className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />Media</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Organise images &amp; videos into categories — control which students can see them</p>
        </div>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700 shrink-0 self-start" onClick={() => { setEditCategory(null); setShowForm(true); }}>
          <FolderPlus className="w-4 h-4" />New Category
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Categories', value: categories.length, icon: FolderOpen, color: 'bg-violet-500' },
          { label: 'Total Media', value: totalItems,       icon: GalleryHorizontalEnd, color: 'bg-blue-500' },
          { label: 'Active',     value: categories.filter(c => c.isActive).length, icon: Eye, color: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
            <div><p className="text-lg sm:text-2xl font-bold leading-tight">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-muted-foreground border-2 border-dashed rounded-xl">
          <FolderOpen className="w-12 h-12 sm:w-14 sm:h-14 opacity-20 mb-3" />
          <p className="font-medium">No categories yet</p>
          <Button className="mt-5 gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(true)}><FolderPlus className="w-4 h-4" />Create First Category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(cat => (
            <CategoryCard key={cat._id} cat={cat} onOpen={setOpenCategory}
              onEdit={c => { setEditCategory(c); setShowForm(true); }}
              onDelete={setDeleteConfirm} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={showForm}
        existing={editCategory}
        onClose={() => { setShowForm(false); setEditCategory(null); }}
        onSaved={cat => {
          if (editCategory) {
            setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, ...cat } : c));
          } else {
            setCategories(prev => [cat as any, ...prev]);
          }
        }}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">Delete Category?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            This will permanently delete <strong>"{deleteConfirm?.name}"</strong> and all <strong>{deleteConfirm?.totalItems} media file{deleteConfirm?.totalItems !== 1 ? 's' : ''}</strong> inside it.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}><Trash2 className="w-4 h-4 mr-2" />Delete Everything</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

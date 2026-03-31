import { useState, useEffect, useRef } from 'react';
import { adAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, Loader2, ImageIcon, Eye,
  Upload, Sparkles, Image, AlertCircle, CheckCircle2, X, Timer
} from 'lucide-react';
import { toast } from 'sonner';

interface Ad {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  originalName: string;
  mimeType: string;
  size: string;
  s3Url: string;
  isActive: boolean;
  order: number;
  displayMinutes: number;
  createdAt: string;
}

export default function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [preview, setPreview] = useState<Ad | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayMinutes, setDisplayMinutes] = useState('30');
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');
  const [fileLoaded, setFileLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adAPI.getAll({ type: 'image' });
      setAds(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load ads: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDisplayMinutes('30');
    setFile(null); setLocalPreview(''); setFileLoaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed in Adds'); return;
    }
    setFile(selectedFile);
    setFileLoaded(false);
    if (!title) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
    setLocalPreview(URL.createObjectURL(selectedFile));
    setFileLoaded(true);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPreview) URL.revokeObjectURL(localPreview);
    resetForm();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) { toast.error('Title and file are required'); return; }
    setSaving(true);
    try {
      await adAPI.create(file, {
        title: title.trim(),
        description: description.trim(),
        order: ads.length,
        displayMinutes: parseInt(displayMinutes) || 30,
      });
      toast.success('🖼️ Ad image published to students!');
      if (localPreview) URL.revokeObjectURL(localPreview);
      resetForm(); setShowAdd(false); fetchAds();
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      await adAPI.update(ad._id, { isActive: !ad.isActive });
      setAds(prev => prev.map(a => a._id === ad._id ? { ...a, isActive: !a.isActive } : a));
      toast.success(ad.isActive ? 'Hidden from students' : 'Now visible to students');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateMinutes = async (ad: Ad, mins: number) => {
    try {
      await adAPI.update(ad._id, { displayMinutes: mins });
      setAds(prev => prev.map(a => a._id === ad._id ? { ...a, displayMinutes: mins } : a));
      toast.success(`Re-display interval set to ${mins} min`);
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adAPI.delete(id);
      setAds(prev => prev.filter(a => a._id !== id));
      toast.success('Deleted');
    } catch (err: any) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePreview = (ad: Ad) => {
    setPreview(ad);
    setPreviewUrl(ad.s3Url || '');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-muted-foreground font-medium">Loading ads...</span>
    </div>
  );

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Adds
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Upload ad images — they appear as a floating ticker on the student portal. Set how many minutes before the ad re-displays after being closed.
          </p>
        </div>

        <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm shrink-0">
              <Plus className="w-4 h-4" /> Add Image
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Upload Ad Image
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
                  dragOver ? 'border-primary bg-primary/5'
                  : fileLoaded ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
                }`}
                onClick={() => { if (!fileLoaded) fileInputRef.current?.click(); }}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {localPreview ? (
                  <div className="p-3 relative">
                    <button onClick={handleRemoveFile}
                      className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <img src={localPreview} alt="preview" className="w-full max-h-52 object-contain rounded-lg" />
                    <p className="text-xs text-center text-muted-foreground mt-2 truncate px-6">{file?.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Image className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">Drop image here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">or click to browse · JPG, PNG, GIF, WebP</p>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
              </div>

              {fileLoaded && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700">
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span><strong>Image</strong> ready · {(file!.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g., Exam Notification Banner" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea placeholder="Short description shown to students..." value={description}
                  onChange={e => setDescription(e.target.value)} rows={2} />
              </div>

              {/* Re-display timer */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  Re-display After (minutes)
                </Label>
                <Input
                  type="number" min="1" max="1440"
                  value={displayMinutes}
                  onChange={e => setDisplayMinutes(e.target.value)}
                  placeholder="e.g. 30"
                />
                <p className="text-xs text-muted-foreground">
                  After a student closes the ad, it will automatically reappear after this many minutes.
                  The student will see a countdown timer.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                Ad images appear as a floating pop-up on the student dashboard.
              </div>
            </div>

            {/* Fixed footer */}
            <div className="px-6 pt-3 pb-6 border-t shrink-0 bg-background space-y-2">
              {fileLoaded ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    Image loaded — click Publish to make it live.
                  </div>
                  <Button onClick={handleUpload}
                    className="w-full gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    disabled={saving || !title.trim()}>
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                      : <><Upload className="w-4 h-4" /> Publish to Students</>}
                  </Button>
                </>
              ) : (
                <Button className="w-full gap-2 h-11" disabled variant="outline">
                  <Upload className="w-4 h-4" /> Upload an image above to publish
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Ads', value: ads.length, icon: Sparkles, color: 'bg-amber-500' },
          { label: 'Images',    value: ads.length, icon: Image,    color: 'bg-blue-500'  },
          { label: 'Active',    value: ads.filter(a => a.isActive).length, icon: Eye, color: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Images grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-base">
            Ad Images <span className="text-muted-foreground font-normal text-sm">({ads.length})</span>
          </h2>
        </div>
        {ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <Image className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No ad images yet — click Add Image to upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map(ad => (
              <AdCard key={ad._id} ad={ad}
                onToggle={handleToggleActive}
                onDelete={handleDelete}
                onPreview={handlePreview}
                onUpdateMinutes={handleUpdateMinutes}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => { setPreview(null); setPreviewUrl(''); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              {preview?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {previewUrl
              ? <img src={previewUrl} alt={preview?.title} className="w-full max-h-[60vh] object-contain rounded-xl" />
              : <div className="flex items-center justify-center h-48 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
            }
            {preview?.description && <p className="text-sm text-muted-foreground mt-3">{preview.description}</p>}
            {preview && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 shrink-0" />
                Re-displays after <strong>{preview.displayMinutes} minutes</strong> when closed by a student
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdCard({ ad, onToggle, onDelete, onPreview, onUpdateMinutes }: {
  ad: Ad;
  onToggle: (ad: Ad) => void;
  onDelete: (id: string) => void;
  onPreview: (ad: Ad) => void;
  onUpdateMinutes: (ad: Ad, mins: number) => void;
}) {
  const [editingMins, setEditingMins] = useState(false);
  const [minsVal, setMinsVal] = useState(String(ad.displayMinutes ?? 30));

  const saveMins = () => {
    const v = parseInt(minsVal);
    if (!isNaN(v) && v > 0) onUpdateMinutes(ad, v);
    setEditingMins(false);
  };

  return (
    <Card className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={() => onPreview(ad)}>
        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
          <ImageIcon className="w-7 h-7 text-blue-500" />
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Eye className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">Preview</span>
        </div>
        {!ad.isActive && (
          <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-xs px-2 py-0.5 rounded-full">Hidden</div>
        )}
      </div>

      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{ad.title}</p>
        {ad.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{ad.description}</p>}

        <div className="flex items-center gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">image</Badge>
          {ad.size && <span className="text-xs text-muted-foreground">{ad.size}</span>}
        </div>

        {/* Re-display timer row */}
        <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
          <Timer className="w-3 h-3 text-amber-500 shrink-0" />
          {editingMins ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="number" min="1" max="1440"
                value={minsVal}
                onChange={e => setMinsVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveMins(); if (e.key === 'Escape') setEditingMins(false); }}
                className="w-16 text-xs border border-amber-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
              <span className="text-xs text-amber-700">min</span>
              <button onClick={saveMins} className="text-xs text-amber-700 font-semibold ml-1 hover:text-amber-900">Save</button>
            </div>
          ) : (
            <button
              onClick={() => { setMinsVal(String(ad.displayMinutes ?? 30)); setEditingMins(true); }}
              className="flex-1 text-left"
            >
              <span className="text-xs text-amber-700">
                Re-shows in <strong>{ad.displayMinutes ?? 30} min</strong>
              </span>
              <span className="text-xs text-amber-500 ml-1">(edit)</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Switch checked={ad.isActive} onCheckedChange={() => onToggle(ad)} />
            <span className="text-xs text-muted-foreground">{ad.isActive ? 'Visible' : 'Hidden'}</span>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(ad._id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useRef } from 'react';
import { mediaCategoryAPI, mediaGalleryAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Loader2, ImageIcon, Film, Maximize2, Play,
  Volume2, VolumeX, X, GalleryHorizontalEnd,
  FolderOpen, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getVideoPreviewUrl } from '@/lib/preview';

interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  totalItems: number;
  imageCount: number;
  videoCount: number;
  coverId: string | null;
  coverUrl: string | null;
}

interface MediaItem {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  size: string;
  s3Url: string;
  isActive: boolean;
}

// ── Image Grid + Fullscreen ───────────────────────────────────────────────────
function ImageGrid({ images }: { images: MediaItem[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const open  = (i: number) => setLightbox(i);
  const close = ()          => setLightbox(null);
  const prev  = () => setLightbox(i => (i! - 1 + images.length) % images.length);
  const next  = () => setLightbox(i => (i! + 1) % images.length);

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, images.length]);

  if (images.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <ImageIcon className="w-12 h-12 opacity-20 mb-3" />
      <p className="text-sm">No images in this category</p>
    </div>
  );

  return (
    <>
      {/* Masonry-style responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {images.map((img, i) => (
          <button
            key={img._id}
            onClick={() => open(i)}
            className="group relative rounded-xl overflow-hidden bg-muted aspect-square hover:z-10 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <img
              src={img.s3Url}
              alt={img.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
              <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
            {/* Title tooltip on hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-[11px] font-medium truncate">{img.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen lightbox */}
      <Dialog open={lightbox !== null} onOpenChange={close}>
        <DialogContent className="max-w-none w-screen h-screen max-h-screen p-0 bg-black border-0 rounded-none flex flex-col items-center justify-center">
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          {lightbox !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              {lightbox + 1} / {images.length}
            </div>
          )}

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          {lightbox !== null && (
            <div className="w-full h-full flex flex-col items-center justify-center px-16 py-14">
              <img
                src={images[lightbox].s3Url}
                alt={images[lightbox].title}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
              {/* Caption */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white font-semibold text-sm drop-shadow">{images[lightbox].title}</p>
                {images[lightbox].description && (
                  <p className="text-white/60 text-xs mt-0.5">{images[lightbox].description}</p>
                )}
              </div>
            </div>
          )}

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && lightbox !== null && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-xs overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img._id}
                  onClick={() => setLightbox(i)}
                  className={`shrink-0 w-10 h-7 rounded overflow-hidden border-2 transition-all ${
                    i === lightbox ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                  }`}
                >
                  <img src={img.s3Url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Video Grid + Player ───────────────────────────────────────────────────────
function VideoGrid({ videos }: { videos: MediaItem[] }) {
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openVideo = (v: MediaItem) => { setPlaying(v); setMuted(false); };
  const closeVideo = () => { setPlaying(null); setFullscreen(false); };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (videos.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Film className="w-12 h-12 opacity-20 mb-3" />
      <p className="text-sm">No videos in this category</p>
    </div>
  );

  return (
    <>
      {/* Video grid — cards with play button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(v => (
          <button
            key={v._id}
            onClick={() => openVideo(v)}
            className="group text-left rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Thumbnail placeholder */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 aspect-video flex items-center justify-center overflow-hidden">
              {/* Play button */}
              <div className="w-14 h-14 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-110">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              {/* Film icon bg */}
              <Film className="absolute w-32 h-32 text-white/5 -bottom-4 -right-4" />
              {/* Duration-like badge */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                {v.size}
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm truncate group-hover:text-violet-700 transition-colors">{v.title}</p>
              {v.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{v.description}</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Video player dialog */}
      <Dialog open={!!playing} onOpenChange={closeVideo}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0 overflow-hidden rounded-2xl">
          <div ref={containerRef} className="relative w-full bg-black">
            {/* Controls bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white font-semibold text-sm truncate max-w-xs">{playing?.title}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(m => !m)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                  title="Maximise"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeVideo}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video */}
            {playing && (
              (() => {
                const video = getVideoPreviewUrl(playing.s3Url);
                return video.isIframe ? (
                  <iframe
                    key={playing._id}
                    src={video.embedUrl}
                    className="w-full min-h-[80vh]"
                    title={playing.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={playing._id}
                    src={video.embedUrl}
                    className="w-full max-h-[80vh] object-contain"
                    autoPlay
                    muted={muted}
                    controls
                    style={{ display: 'block' }}
                  />
                );
              })()
            )}

            {/* Caption */}
            {playing?.description && (
              <div className="px-4 py-2.5 bg-black/80">
                <p className="text-white/70 text-xs">{playing.description}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Category Detail with Tabs ─────────────────────────────────────────────────
function CategoryView({ category, onBack }: { category: Category; onBack: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'images' | 'videos'>('images');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await mediaGalleryAPI.getAll({ categoryId: category._id, active: true });
        const all: MediaItem[] = res.data?.data || [];
        setItems(all);
        // Default to whichever tab has content
        const hasImages = all.some(i => i.mediaType === 'image');
        const hasVideos = all.some(i => i.mediaType === 'video');
        if (!hasImages && hasVideos) setTab('videos');
        else setTab('images');
      } catch { toast.error('Failed to load media'); }
      finally { setLoading(false); }
    })();
  }, [category._id]);

  const images = items.filter(i => i.mediaType === 'image');
  const videos = items.filter(i => i.mediaType === 'video');

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold flex items-center gap-2 truncate">
            <FolderOpen className="w-5 h-5 text-violet-500 shrink-0" />
            {category.name}
          </h2>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{category.description}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-56 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FolderOpen className="w-12 h-12 opacity-20 mb-3" />
          <p className="text-sm">No media in this category yet</p>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('images')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'images'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images
              {images.length > 0 && (
                <Badge
                  variant={tab === 'images' ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0 h-5 min-w-[1.25rem]"
                >
                  {images.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setTab('videos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'videos'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Film className="w-4 h-4" />
              Videos
              {videos.length > 0 && (
                <Badge
                  variant={tab === 'videos' ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0 h-5 min-w-[1.25rem]"
                >
                  {videos.length}
                </Badge>
              )}
            </button>
          </div>

          {/* ── Tab content ── */}
          {tab === 'images' && <ImageGrid images={images} />}
          {tab === 'videos' && <VideoGrid videos={videos} />}
        </>
      )}
    </div>
  );
}

// ── Category Grid Card ────────────────────────────────────────────────────────
function CategoryCard({ cat, onClick }: { cat: Category; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-100 to-purple-200" style={{ aspectRatio: '4/3' }}>
        {cat.coverUrl ? (
          <img
            src={cat.coverUrl}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-14 h-14 text-violet-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {cat.imageCount > 0 && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <ImageIcon className="w-3 h-3" /> {cat.imageCount}
            </span>
          )}
          {cat.videoCount > 0 && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <Film className="w-3 h-3" /> {cat.videoCount}
            </span>
          )}
        </div>

        <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shadow-sm">
          <ChevronRight className="w-4 h-4 text-violet-600" />
        </div>
      </div>

      <div className="p-3.5">
        <p className="font-semibold text-sm group-hover:text-violet-700 transition-colors">{cat.name}</p>
        {cat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>}
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">
          {cat.totalItems} item{cat.totalItems !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentMedia() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<Category | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await mediaCategoryAPI.getAll({ active: true });
        setCategories(res.data?.data || []);
      } catch { toast.error('Failed to load media'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-muted-foreground font-medium">Loading media…</span>
    </div>
  );

  if (openCategory) {
    return <CategoryView category={openCategory} onBack={() => setOpenCategory(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GalleryHorizontalEnd className="w-6 h-6 text-violet-500" /> Media Gallery
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Browse photos and videos from your institution
          {categories.length > 0 && (
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-violet-300" />
          </div>
          <p className="font-medium">No media available yet</p>
          <p className="text-sm mt-1">Your admin will upload images and videos here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map(cat => (
            <CategoryCard key={cat._id} cat={cat} onClick={() => setOpenCategory(cat)} />
          ))}
        </div>
      )}
    </div>
  );
}

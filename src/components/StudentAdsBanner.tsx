import { useState, useEffect, useCallback, useRef } from 'react';
import { adAPI } from '@/services/api';
import { X, Clock } from 'lucide-react';

interface Ad {
  _id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  s3Url: string;
  isActive: boolean;
  displayMinutes?: number;
}

export default function StudentAdsBanner() {
  const [ads, setAds]             = useState<Ad[]>([]);
  const [index, setIndex]         = useState(0);
  const [visible, setVisible]     = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const redisplayTimer  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownTicker = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    adAPI.getAll({ active: true })
      .then(res => {
        // Only image ads, must be active
        const imageAds: Ad[] = (res.data?.data || []).filter(
          (a: Ad) => a.isActive && a.mediaType === 'image'
        );
        setAds(imageAds);
        if (imageAds.length > 0) setVisible(true);
        // If no image ads → stay hidden, show nothing
      })
      .catch(() => {/* silent — stay hidden */})
      .finally(() => setLoaded(true));
  }, []);

  // Auto-advance every 5s while visible
  useEffect(() => {
    if (!visible || ads.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [visible, ads.length]);

  // Clamp index
  useEffect(() => {
    if (ads.length && index >= ads.length) setIndex(0);
  }, [ads.length, index]);

  const startRedisplayTimer = useCallback((ad: Ad) => {
    const totalSecs = (ad.displayMinutes ?? 30) * 60;
    let remaining = totalSecs;
    setCountdown(remaining);

    if (countdownTicker.current) clearInterval(countdownTicker.current);
    countdownTicker.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownTicker.current!);
        countdownTicker.current = null;
        setCountdown(null);
        setIndex(i => (i + 1) % ads.length);
        setVisible(true);
      }
    }, 1000);

    if (redisplayTimer.current) clearTimeout(redisplayTimer.current);
    redisplayTimer.current = setTimeout(() => {
      setVisible(true);
      setCountdown(null);
    }, totalSecs * 1000);
  }, [ads.length]);

  useEffect(() => () => {
    if (redisplayTimer.current)  clearTimeout(redisplayTimer.current);
    if (countdownTicker.current) clearInterval(countdownTicker.current);
  }, []);

  const handleClose = () => {
    const ad = ads[index];
    setVisible(false);
    if (ad) startRedisplayTimer(ad);
  };

  // No image ads at all → render nothing (sleeping stage)
  if (!loaded || ads.length === 0) return null;

  const ad = ads[index];
  if (!ad) return null;

  const mediaUrl = ad.s3Url;

  const fmt = (s: number) =>
    s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
    : s >= 60  ? `${Math.floor(s / 60)}m ${s % 60}s`
    : `${s}s`;

  return (
    <>
      {/* Square floating ad — bottom-right */}
      {visible && (
        <div
          className="fixed bottom-5 right-5 z-50 w-56 rounded-2xl overflow-hidden shadow-2xl border border-slate-100"
          style={{
            animation: 'adPopIn 0.35s cubic-bezier(.34,1.56,.64,1) both',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* top accent bar */}
          <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />

          {/* close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-white" />
          </button>

          {/* AD label */}
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white px-1.5 py-0.5 rounded-full shadow">
              Ad
            </span>
          </div>

          {/* Image — square crop */}
          <div className="w-full aspect-square bg-slate-100 overflow-hidden">
            <img
              src={mediaUrl}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={e => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                if (el.parentElement) {
                  el.parentElement.innerHTML =
                    `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ede9fe,#e0f2fe)">
                       <span style="font-size:11px;color:#a0a0c0;font-weight:600">Image unavailable</span>
                     </div>`;
                }
              }}
            />
          </div>

          {/* Footer */}
          <div className="px-3 py-2.5">
            <p className="text-xs font-bold text-slate-800 leading-snug truncate">{ad.title}</p>
            {ad.description && (
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{ad.description}</p>
            )}
            {/* dot indicators */}
            {ads.length > 1 && (
              <div className="flex items-center gap-1 mt-2">
                {ads.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === index
                        ? 'bg-violet-500 w-4 h-1.5'
                        : 'bg-slate-200 hover:bg-violet-300 w-1.5 h-1.5'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown pill — shown only while waiting to redisplay */}
      {!visible && countdown !== null && countdown > 0 && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-white/90 backdrop-blur border border-slate-200 shadow-lg rounded-xl px-3 py-2"
          style={{ animation: 'adPopIn 0.3s ease both' }}
        >
          <Clock className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-slate-600">
            Ad in <span className="text-violet-600 font-bold">{fmt(countdown)}</span>
          </span>
        </div>
      )}
    </>
  );
}

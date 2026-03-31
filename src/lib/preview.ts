export function normalizeHttpUrl(rawUrl: string): string | null {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getGoogleDriveFileId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes('drive.google.com')) return null;

    const direct = parsed.searchParams.get('id');
    if (direct) return direct;

    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/i);
    if (fileMatch?.[1]) return fileMatch[1];

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const match = parsed.pathname.match(/\/embed\/([^/]+)/i);
      if (match?.[1]) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function getDocumentPreviewUrl(url: string, type: 'pdf' | 'ppt' | 'magazine'): string {
  const normalized = normalizeHttpUrl(url) || url;
  const driveId = getGoogleDriveFileId(normalized);

  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  if (type === 'ppt') {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(normalized)}`;
  }

  return normalized;
}

export function getVideoPreviewUrl(url: string): { embedUrl: string; isIframe: boolean } {
  const normalized = normalizeHttpUrl(url) || url;
  const youtubeEmbed = getYouTubeEmbedUrl(normalized);
  if (youtubeEmbed) {
    return { embedUrl: youtubeEmbed, isIframe: true };
  }
  return { embedUrl: normalized, isIframe: false };
}

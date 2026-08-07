export const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.split('/')[1] || '';
      return id.length === 11 ? id : null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v') || '';
        return id.length === 11 ? id : null;
      }
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      return match ? match[1] : null;
    }
  } catch (e) {
    return null;
  }

  return null;
};

export const isYouTubeUrl = (url) => Boolean(getYouTubeVideoId(url));

export const getYouTubeEmbedUrl = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&autoplay=1` : null;
};

export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
};

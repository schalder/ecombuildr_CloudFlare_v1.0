export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'wistia' | 'hosted' | 'unknown';
  id?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Extract video ID and type from various video URLs
 */
export function parseVideoUrl(url: string): VideoInfo {
  if (!url) return { type: 'unknown' };

  // YouTube patterns - includes support for Shorts
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      type: 'youtube',
      id,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
    };
  }

  // Vimeo patterns
  const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)(?:\?.*)?/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      type: 'vimeo',
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnailUrl: `https://vumbnail.com/${id}.jpg`
    };
  }

  // Wistia patterns
  const wistiaRegex = /(?:wistia\.(?:com|net)\/(?:medias|embed)\/|wi\.st\/)([a-zA-Z0-9]+)/;
  const wistiaMatch = url.match(wistiaRegex);
  if (wistiaMatch) {
    const id = wistiaMatch[1];
    return {
      type: 'wistia',
      id,
      embedUrl: `https://fast.wistia.net/embed/iframe/${id}`,
    };
  }

  // Check if it's a direct video file (MP4, WebM, etc.)
  const videoFileRegex = /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i;
  if (videoFileRegex.test(url)) {
    return {
      type: 'hosted',
      embedUrl: url
    };
  }

  return { type: 'unknown' };
}

/**
 * Get responsive width classes for video containers
 */
export function getVideoWidthClasses(width: string): string {
  switch (width) {
    case 'full':
      return 'w-full';
    case 'three-quarters':
      return 'w-3/4 mx-auto';
    case 'half':
      return 'w-1/2 mx-auto';
    default:
      return 'w-full';
  }
}

/**
 * Build embed URL with additional parameters
 */
export function buildEmbedUrl(
  baseUrl: string, 
  type: VideoInfo['type'], 
  options: {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
  } = {}
): string {
  const url = new URL(baseUrl);
  
  switch (type) {
    case 'youtube':
      if (options.autoplay) url.searchParams.set('autoplay', '1');
      if (!options.controls) url.searchParams.set('controls', '0');
      if (options.muted) url.searchParams.set('mute', '1');
      url.searchParams.set('rel', '0'); // Don't show related videos
      break;
      
    case 'vimeo':
      if (options.autoplay) url.searchParams.set('autoplay', '1');
      if (!options.controls) url.searchParams.set('controls', '0');
      if (options.muted) url.searchParams.set('muted', '1');
      break;
      
    case 'wistia':
      if (options.autoplay) url.searchParams.set('autoPlay', 'true');
      if (!options.controls) url.searchParams.set('playbar', 'false');
      if (options.muted) url.searchParams.set('volume', '0');
      break;
  }
  
  return url.toString();
}

/**
 * Sanitize custom embed code for security
 */
export function sanitizeEmbedCode(embedCode: string): string {
  // Basic sanitization - remove dangerous scripts but allow iframe and video tags
  return embedCode
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
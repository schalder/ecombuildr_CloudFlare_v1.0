import { Node, mergeAttributes } from '@tiptap/core';
import { parseVideoUrl, sanitizeEmbedCode, buildEmbedUrl, VideoInfo } from '@/components/page-builder/utils/videoUtils';

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src?: string; width?: string; embedCode?: string }) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 'full',
      },
      embedCode: {
        default: null,
      },
      videoInfo: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const iframe = element.querySelector('iframe');
          const errorDiv = element.querySelector('.border-destructive');
          
          // If it's an error div, extract src from the error message
          if (errorDiv) {
            const errorText = errorDiv.textContent || '';
            const srcMatch = errorText.match(/Invalid video URL: (.+)/);
            if (srcMatch && srcMatch[1] !== 'null') {
              return { src: srcMatch[1] };
            }
            return {};
          }
          
          // Extract attributes from data attributes or iframe src
          const src = element.getAttribute('data-video-src') || iframe?.getAttribute('src');
          const embedCode = element.getAttribute('data-video-embed');
          const width = element.getAttribute('data-video-width') || 'full';
          
          // If we find an iframe src, determine if it's a known video service or embed code
          if (src) {
            const videoInfo = parseVideoUrl(src);
            if (videoInfo.type !== 'unknown') {
              return { src, width, videoInfo };
            } else {
              // It's likely a custom embed, reconstruct the embed code
              return { 
                embedCode: iframe?.outerHTML || `<iframe src="${src}" frameborder="0" allowfullscreen></iframe>`,
                width 
              };
            }
          }
          
          if (embedCode) {
            return { embedCode, width };
          }
          
          return {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, width = 'full', embedCode, videoInfo } = HTMLAttributes;
    
    // Add debugging
    console.log('Video renderHTML called with:', { src, width, embedCode, videoInfo });
    
    // If custom embed code is provided, use it (sanitized)
    if (embedCode) {
      const sanitizedCode = sanitizeEmbedCode(embedCode);
      console.log('Original embed code:', embedCode);
      console.log('Sanitized embed code:', sanitizedCode);
      
      // Parse the iframe from the sanitized code
      const iframeSrcMatch = sanitizedCode.match(/src=["']([^"']+)["']/i);
      
      if (iframeSrcMatch) {
        return [
          'div',
          mergeAttributes(
            {
              'data-video': '',
              'data-video-embed': embedCode,
              'data-video-width': width,
              class: getVideoWidthClasses(width),
            },
            this.options.HTMLAttributes
          ),
          [
            'div',
            {
              class: 'relative w-full aspect-video',
            },
            [
              'iframe',
              {
                src: iframeSrcMatch[1],
                class: 'w-full h-full rounded-lg',
                frameborder: '0',
                allowfullscreen: 'true',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              },
            ],
          ],
        ];
      } else {
        console.error('Could not extract iframe src from embed code');
        return [
          'div',
          mergeAttributes(
            {
              'data-video': '',
              'data-video-embed': embedCode,
              'data-video-width': width,
              class: getVideoWidthClasses(width),
            },
            this.options.HTMLAttributes
          ),
          [
            'div',
            {
              class: 'border border-destructive bg-destructive/10 text-destructive p-4 rounded text-center',
            },
            'Invalid embed code - could not extract iframe source',
          ],
        ];
      }
    }

    // Parse video URL and create responsive embed
    const parsedVideo: VideoInfo = videoInfo || parseVideoUrl(src || '');
    
    if (parsedVideo.type === 'unknown') {
      return [
        'div',
        mergeAttributes(
          {
            'data-video': '',
            class: getVideoWidthClasses(width),
          },
          this.options.HTMLAttributes
        ),
        [
          'div',
          {
            class: 'border border-destructive bg-destructive/10 text-destructive p-4 rounded text-center',
          },
          `Invalid video URL: ${src}`,
        ],
      ];
    }

    // Build final embed URL with options
    const finalEmbedUrl = buildEmbedUrl(parsedVideo.embedUrl || '', parsedVideo.type, {
      autoplay: false,
      controls: true,
      muted: false,
    });

    return [
      'div',
      mergeAttributes(
        {
          'data-video': '',
          'data-video-src': src,
          'data-video-width': width,
          class: getVideoWidthClasses(width),
        },
        this.options.HTMLAttributes
      ),
      [
        'div',
        {
          class: 'relative w-full aspect-video',
        },
        [
          'iframe',
          {
            src: finalEmbedUrl,
            class: 'w-full h-full rounded-lg',
            frameborder: '0',
            allowfullscreen: 'true',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          const { src, width = 'full', embedCode } = options;
          
          // Parse video info if it's a URL
          let videoInfo: VideoInfo | null = null;
          if (src && !embedCode) {
            videoInfo = parseVideoUrl(src);
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src,
              width,
              embedCode,
              videoInfo,
            },
          });
        },
    };
  },
});

function getVideoWidthClasses(width: string): string {
  switch (width) {
    case 'full':
      return 'w-full mb-4';
    case 'three-quarters':
      return 'w-3/4 mx-auto mb-4';
    case 'half':
      return 'w-1/2 mx-auto mb-4';
    default:
      return 'w-full mb-4';
  }
}
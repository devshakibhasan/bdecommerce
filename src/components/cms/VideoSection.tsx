'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoSectionProps {
  config: {
    video_url: string;
    thumbnail_url?: string;
    title_en?: string;
  };
}

export function VideoSection({ config }: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to get youtube embed url
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) {
          videoId = url.split('/').pop()?.split('?')[0] || '';
        } else {
          const urlParams = new URLSearchParams(new URL(url).search);
          videoId = urlParams.get('v') || '';
        }
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      return url; // Assume direct mp4 or already embed
    } catch {
      return url;
    }
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {config.title_en && (
          <h2 className="text-2xl font-bold mb-6 text-center">{config.title_en}</h2>
        )}
        
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg bg-black aspect-video relative">
          {!isPlaying && config.thumbnail_url ? (
            <div 
              className="absolute inset-0 bg-cover bg-center cursor-pointer group flex items-center justify-center"
              style={{ backgroundImage: `url(${config.thumbnail_url})` }}
              onClick={() => setIsPlaying(true)}
            >
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="relative z-10 w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" />
              </div>
            </div>
          ) : (
            <iframe
              src={isPlaying ? getEmbedUrl(config.video_url) : config.video_url}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </section>
  );
}

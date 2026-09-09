import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface MiniVideoPlayerProps {
  videoUrl: string;
  thumbnail?: string;
  exerciseName: string;
  instructions?: string;
  tips?: string;
  onOpenModal?: () => void;
  autoPlayLoop?: boolean;
}

export const MiniVideoPlayer: React.FC<MiniVideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  exerciseName,
  onOpenModal,
  autoPlayLoop = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Convert youtube watch URL to embed URL if needed
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&controls=1&mute=1&loop=1`;
      }
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        const id = urlParams.get('v');
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&controls=1&mute=1&loop=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    if (autoPlayLoop) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with muted might be delayed or blocked by browser policy
            setIsPlaying(false);
          });
      }
    }
  }, [videoUrl, autoPlayLoop, isYouTube]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const restartVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  if (isYouTube) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
        <iframe
          src={getYouTubeEmbedUrl(videoUrl)}
          title={`Demonstração - ${exerciseName}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {onOpenModal && (
          <button
            id={`expand-yt-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={onOpenModal}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 backdrop-blur-xs transition"
            title="Expandir detalhes"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="group relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-md cursor-pointer select-none"
      onClick={onOpenModal}
    >
      {/* Video Element */}
      {!hasError ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnail}
          loop
          muted={isMuted}
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
          {thumbnail ? (
            <img src={thumbnail} alt={exerciseName} className="w-full h-full object-cover absolute inset-0 opacity-60" />
          ) : null}
          <div className="relative z-10 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            Demonstração em Vídeo
          </div>
        </div>
      )}

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* Mini Video Badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md border border-slate-700/50 text-[11px] font-medium text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Mini Vídeo
      </div>

      {/* Floating Controls Overlay */}
      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            id={`play-btn-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={togglePlay}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-emerald-600 text-white backdrop-blur-xs transition shadow"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            id={`restart-btn-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={restartVideo}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-xs transition shadow"
            title="Reiniciar loop"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id={`mute-btn-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-xs transition shadow"
            title={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {onOpenModal && (
          <button
            id={`expand-btn-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-emerald-600 text-white backdrop-blur-xs transition shadow"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Ver Detalhes</span>
          </button>
        )}
      </div>
    </div>
  );
};

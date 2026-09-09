import React, { useState, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, AlertCircle, Gauge } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({ exercise, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!exercise) return null;

  const isYouTube = exercise.videoUrl.includes('youtube.com') || exercise.videoUrl.includes('youtu.be');

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=1&mute=0&loop=1`;
      }
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        const id = urlParams.get('v');
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=1&mute=0&loop=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="exercise-modal-container"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {exercise.muscleGroup}
              </span>
              <span className="text-xs text-slate-500">Demonstração de Execução</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{exercise.name}</h2>
          </div>
          <button
            id="close-video-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Stage */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          {isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(exercise.videoUrl)}
              title={exercise.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={exercise.videoUrl}
                poster={exercise.thumbnail}
                loop
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />

              {/* In-video Control Bar */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <button
                    id="modal-play-btn"
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition font-medium cursor-pointer"
                    title={isPlaying ? 'Pausar' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    id="modal-restart-btn"
                    onClick={restartVideo}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    title="Reiniciar vídeo"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    id="modal-mute-btn"
                    onClick={toggleMute}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    title={isMuted ? 'Ativar áudio' : 'Mutar áudio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Slow Motion / Speed Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mr-1 hidden sm:flex">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Velocidade:</span>
                  </div>
                  {[0.5, 0.75, 1.0].map((speed) => (
                    <button
                      key={speed}
                      id={`speed-btn-${speed}`}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {speed === 0.5 ? '0.5x (Lento)' : `${speed}x`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content & Form Instructions */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Target Parameters */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500">Séries & Reps</span>
              <p className="font-bold text-slate-900">{exercise.sets} séries × {exercise.reps}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Carga Sugerida</span>
              <p className="font-bold text-indigo-600">{exercise.suggestedWeight || 'A definir'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Descanso</span>
              <p className="font-bold text-slate-900">{exercise.restSeconds}s entre séries</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Execução Correta Passo a Passo
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {exercise.instructions || 'Siga a cadência indicada pelo instrutor mantendo a postura estabilizada e respiração contínua.'}
            </p>
          </div>

          {/* Instructor Tips */}
          {exercise.tips && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-900 block text-xs">Dica Técnica do Professor:</span>
                <p className="text-xs text-amber-800 mt-0.5">{exercise.tips}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            id="close-modal-bottom-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Fechar Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};

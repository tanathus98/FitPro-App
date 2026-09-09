import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Bell, Plus, Minus, CheckCircle2, Volume2 } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  exerciseName?: string;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds, exerciseName, onClose }) => {
  const [totalDuration, setTotalDuration] = useState<number>(initialSeconds || 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds || 60);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync state if initialSeconds changes
  useEffect(() => {
    const s = initialSeconds > 0 ? initialSeconds : 60;
    setTotalDuration(s);
    setSecondsLeft(s);
    setIsActive(true);
    setIsFinished(false);
  }, [initialSeconds]);

  // Audio & Vibration Alert Function
  const playAlarm = () => {
    // Vibrate device on mobile if supported
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch {
      // ignore
    }

    // Audio tone synthesis
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 2-tone chime: E5 (659Hz) to A5 (880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {
      // Audio playback might be restricted if no user gesture occurred
    }
  };

  // Timer interval countdown
  useEffect(() => {
    let interval: any = null;

    if (isActive && !isFinished && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsFinished(true);
            setIsActive(false);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isFinished, secondsLeft]);

  const toggleActive = () => {
    if (isFinished) {
      // If finished, tapping toggle restarts with total duration
      setSecondsLeft(totalDuration);
      setIsFinished(false);
      setIsActive(true);
    } else {
      setIsActive((prev) => !prev);
    }
  };

  const resetTimer = () => {
    setSecondsLeft(totalDuration);
    setIsFinished(false);
    setIsActive(true);
  };

  const addSeconds = (amount: number) => {
    setSecondsLeft((prev) => {
      const next = Math.max(0, prev + amount);
      if (next > 0 && isFinished) {
        setIsFinished(false);
        setIsActive(true);
      }
      return next;
    });

    setTotalDuration((prev) => Math.max(prev, secondsLeft + amount));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Calculate percentage safely
  const progressPercent = totalDuration > 0
    ? Math.max(0, Math.min(100, ((totalDuration - secondsLeft) / totalDuration) * 100))
    : 100;

  return (
    <div
      id="floating-rest-timer-card"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-96 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl animate-slideUp overflow-hidden max-w-[calc(100vw-1.5rem)] mx-auto"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div
            className={`p-2 rounded-xl shrink-0 transition-colors ${
              isFinished
                ? 'bg-emerald-600 text-white animate-bounce'
                : isActive
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isFinished ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider truncate">
              Cronômetro de Descanso
            </h4>
            {exerciseName && (
              <p className="text-[11px] text-indigo-600 font-semibold truncate" title={exerciseName}>
                {exerciseName}
              </p>
            )}
          </div>
        </div>

        <button
          id="close-rest-timer-btn"
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Fechar cronômetro"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Countdown Display */}
      <div className="my-3.5 text-center">
        <div
          className={`text-4xl sm:text-5xl font-black tracking-tight font-mono transition-colors ${
            isFinished
              ? 'text-emerald-600 animate-pulse'
              : isActive
              ? 'text-slate-900'
              : 'text-slate-400'
          }`}
        >
          {formatTime(secondsLeft)}
        </div>

        <p className="text-xs mt-1 font-medium transition-colors">
          {isFinished ? (
            <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Descanso concluído! Próxima série.
            </span>
          ) : isActive ? (
            <span className="text-slate-500">Respire fundo e recupere o fôlego...</span>
          ) : (
            <span className="text-amber-600 font-semibold">Cronômetro pausado</span>
          )}
        </p>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFinished ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Time Adjustments (+15s, -15s, +30s) */}
      <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
        <button
          id="timer-minus-15-btn"
          type="button"
          onClick={() => addSeconds(-15)}
          disabled={secondsLeft <= 5}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          title="Diminuir 15 segundos"
        >
          <Minus className="w-3 h-3" />
          <span>15s</span>
        </button>

        <button
          id="timer-plus-15-btn"
          type="button"
          onClick={() => addSeconds(15)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          title="Adicionar 15 segundos"
        >
          <Plus className="w-3 h-3" />
          <span>15s</span>
        </button>

        <button
          id="timer-plus-30-btn"
          type="button"
          onClick={() => addSeconds(30)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          title="Adicionar 30 segundos"
        >
          <Plus className="w-3 h-3" />
          <span>30s</span>
        </button>
      </div>

      {/* Primary Action Controls */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2">
        <button
          id="timer-reset-btn"
          type="button"
          onClick={resetTimer}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
          title="Reiniciar cronômetro"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Reiniciar</span>
        </button>

        <div className="flex items-center gap-2 flex-1 justify-end">
          {isFinished ? (
            <button
              id="timer-finish-action-btn"
              type="button"
              onClick={onClose}
              className="w-full xs:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Próxima Série</span>
            </button>
          ) : (
            <button
              id="timer-toggle-active-btn"
              type="button"
              onClick={toggleActive}
              className={`w-full xs:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Continuar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

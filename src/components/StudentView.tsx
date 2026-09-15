import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, CheckCircle2, Clock, Dumbbell, Flame, Info, 
  Sparkles, Trophy, User, ChevronRight, Play, HeartHandshake,
  RotateCcw, ShieldCheck, Video, Star, MessageSquare, AlertCircle, Camera, Scale,
  Bike, Footprints, TrendingUp, Activity
} from 'lucide-react';
import { DayOfWeek, Exercise, Student, WorkoutPlan, Instructor, ExecutionSubmission, CardioLog, DayProgress, BodyMeasurement } from '../types';
import { DAYS_CONFIG, getTodayDayOfWeek } from '../data/initialData';
import { MiniVideoPlayer } from './MiniVideoPlayer';
import { ExerciseVideoModal } from './ExerciseVideoModal';
import { RestTimer } from './RestTimer';
import { RecordExecutionModal } from './RecordExecutionModal';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { CardioTrackerModal } from './CardioTrackerModal';
import { HistoryModal } from './HistoryModal';
import { MeasurementsModal } from './MeasurementsModal';
import { AvatarUploadModal } from './AvatarUploadModal';

interface StudentViewProps {
  student: Student;
  plan?: WorkoutPlan;
  instructor?: Instructor;
  submissions?: ExecutionSubmission[];
  cardioLogs?: CardioLog[];
  dayProgressList?: DayProgress[];
  measurements?: BodyMeasurement[];
  onSubmitExecution?: (submission: ExecutionSubmission) => void;
  onUpdateStudent?: (student: Student) => void;
  onSaveCardioLog?: (log: CardioLog) => void | Promise<void>;
  onDeleteCardioLog?: (logId: string) => void;
  onSaveDayProgress?: (progress: DayProgress) => void | Promise<void>;
  onSaveMeasurement?: (measurement: BodyMeasurement) => void | Promise<void>;
  onDeleteMeasurement?: (measurementId: string) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  student,
  plan,
  instructor,
  submissions = [],
  cardioLogs = [],
  dayProgressList = [],
  measurements = [],
  onSubmitExecution,
  onUpdateStudent,
  onSaveCardioLog,
  onDeleteCardioLog,
  onSaveDayProgress,
  onSaveMeasurement,
  onDeleteMeasurement,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [activeExerciseForModal, setActiveExerciseForModal] = useState<Exercise | null>(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerExerciseName, setTimerExerciseName] = useState<string>('');
  const [timerKey, setTimerKey] = useState<number>(0);
  
  // Video execution recording and evaluation review states
  const [recordingExercise, setRecordingExercise] = useState<Exercise | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<ExecutionSubmission | null>(null);
  const [submissionSuccessToast, setSubmissionSuccessToast] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showCardioModal, setShowCardioModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState<boolean>(false);

  // Student cardio analytics
  const studentCardioLogs = cardioLogs.filter((l) => l.studentId === student.id);
  const totalCardioCalories = studentCardioLogs.reduce((acc, l) => acc + (l.caloriesBurned || 0), 0);
  const totalCardioMinutes = studentCardioLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Registro de medidas mais recente do aluno (substitui a antiga vitrine de IMC)
  const studentMeasurements = measurements
    .filter((m) => m.studentId === student.id)
    .sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1));
  const latestMeasurement = studentMeasurements[0];

  const startRestTimer = (seconds: number, name: string) => {
    setActiveTimerSeconds(seconds > 0 ? seconds : 60);
    setTimerExerciseName(name);
    setTimerKey(Date.now());
  };
  
  // Track completed sets in local state: key = `${selectedDay}_${exerciseId}_${setIndex}`
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  // Track custom weight notes per exercise
  const [customWeights, setCustomWeights] = useState<Record<string, string>>({});
  // Track if workout completed for the day
  const [dayCompleted, setDayCompleted] = useState<Record<string, boolean>>({});

  // Data de hoje (YYYY-MM-DD) — é sob esta chave que o progresso é
  // persistido no Firestore, para que o professor veja se o aluno treinou
  // "naquele dia" (data real do calendário, não apenas o dia da semana).
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayProgressDoc = dayProgressList.find((p) => p.dateStr === todayDateStr);

  // Ao carregar (ou quando o registro de hoje muda vindo do Firestore —
  // por exemplo, aberto em outro dispositivo), hidrata o estado local do
  // dia de hoje com o que já foi salvo, para não perder o progresso ao
  // recarregar a página.
  useEffect(() => {
    if (!todayProgressDoc || todayProgressDoc.dayOfWeek !== todayDayKey) return;
    setCompletedSets((prev) => ({ ...prev, ...todayProgressDoc.completedSets }));
    setDayCompleted((prev) => ({ ...prev, [todayDayKey]: !!todayProgressDoc.completed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayProgressDoc?.dateStr, todayProgressDoc?.completed]);

  // Persiste o progresso de HOJE no Firestore (uma série marcada, ou o
  // treino inteiro concluído), para o professor conseguir ver no painel
  // dele se o aluno já treinou no dia. Só grava quando o dia selecionado
  // é o dia de hoje — navegar por outros dias da semana continua sendo
  // apenas uma prévia local, sem sobrescrever o registro real de hoje.
  const persistTodayProgress = (nextCompletedSets: Record<string, boolean>, nextCompleted: boolean) => {
    if (!onSaveDayProgress || selectedDay !== todayDayKey) return;
    onSaveDayProgress({
      studentId: student.id,
      studentName: student.name,
      dateStr: todayDateStr,
      dayOfWeek: todayDayKey,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      completedSets: nextCompletedSets,
      exerciseWeights: customWeights,
    });
  };
  // Selected exercise for right demonstration panel
  const [featuredExerciseId, setFeaturedExerciseId] = useState<string | null>(null);
  // Mobile active sub-tab for optimal viewing on phone screens
  const [mobileTab, setMobileTab] = useState<'exercises' | 'video' | 'evaluations'>('exercises');

  const todayDayKey = getTodayDayOfWeek();
  const currentDayWorkout = plan?.schedule?.[selectedDay];
  const isRestDay = !currentDayWorkout || currentDayWorkout.isRestDay || currentDayWorkout.exercises.length === 0;

  const handleRecordSubmit = (submission: ExecutionSubmission) => {
    if (onSubmitExecution) {
      onSubmitExecution(submission);
    }
    setSubmissionSuccessToast(`Vídeo de "${submission.exerciseName}" enviado com sucesso para a avaliação do professor!`);
    setTimeout(() => setSubmissionSuccessToast(null), 5000);
  };

  // Pick first exercise as featured if none selected or if active exercise changes
  const activeFeaturedExercise = currentDayWorkout?.exercises?.find(e => e.id === featuredExerciseId) 
    || currentDayWorkout?.exercises?.[0] 
    || null;

  const toggleSet = (exerciseId: string, setIndex: number, defaultRestSeconds: number, exerciseName: string) => {
    const key = `${selectedDay}_${exerciseId}_${setIndex}`;
    const willBeCompleted = !completedSets[key];
    const nextCompletedSets = { ...completedSets, [key]: willBeCompleted };

    setCompletedSets(nextCompletedSets);
    persistTodayProgress(nextCompletedSets, !!dayCompleted[todayDayKey]);

    // If student just checked the set, offer to start the rest timer
    if (willBeCompleted) {
      startRestTimer(defaultRestSeconds || 60, `${exerciseName} (Série ${setIndex + 1})`);
    }
  };

  const calculateExerciseProgress = (ex: Exercise) => {
    let done = 0;
    for (let i = 0; i < ex.sets; i++) {
      if (completedSets[`${selectedDay}_${ex.id}_${i}`]) {
        done++;
      }
    }
    return { done, total: ex.sets, isComplete: done === ex.sets };
  };

  const totalExercises = currentDayWorkout?.exercises?.length || 0;
  const completedExercisesCount = currentDayWorkout?.exercises?.filter(
    (ex) => calculateExerciseProgress(ex).isComplete
  ).length || 0;

  const overallProgressPercent = totalExercises > 0
    ? Math.round((completedExercisesCount / totalExercises) * 100)
    : 0;

  const handleFinishWorkout = () => {
    setDayCompleted((prev) => ({ ...prev, [selectedDay]: true }));
    persistTodayProgress(completedSets, true);
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#6366f1', '#10b981', '#f59e0b']
      });
    } catch {
      // fallback
    }
  };

  const handleResetDayProgress = () => {
    if (window.confirm('Deseja reiniciar as séries marcadas deste dia?')) {
      const prefix = `${selectedDay}_`;
      let nextCompletedSets: Record<string, boolean> = {};
      setCompletedSets((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(prefix)) delete next[key];
        });
        nextCompletedSets = next;
        return next;
      });
      setDayCompleted((prev) => ({ ...prev, [selectedDay]: false }));
      persistTodayProgress(nextCompletedSets, false);
    }
  };

  const mySubmissions = submissions.filter((s) => s.studentId === student.id);
  const pendingCount = mySubmissions.filter((s) => s.status === 'pending').length;
  const reviewedCount = mySubmissions.filter((s) => s.status === 'reviewed').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification when video is submitted */}
      {submissionSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{submissionSuccessToast}</span>
          </div>
          <button
            onClick={() => setSubmissionSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Student Profile & Active Plan Card - Sleek White Card */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 w-full flex-1">
            <button
              type="button"
              id="btn-edit-student-avatar"
              onClick={() => setShowAvatarModal(true)}
              className="relative group shrink-0 mt-0.5 sm:mt-0 cursor-pointer"
              title="Alterar foto de perfil"
            >
              <img
                src={student.avatar}
                alt={student.name}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">{student.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                  {student.level}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 break-words">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-700 font-medium shrink-0">Objetivo:</span> <span className="truncate">{student.goal}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 mt-1.5">
                <span>Peso: <strong className="text-slate-800">{latestMeasurement?.weightKg ?? student.weightKg} kg</strong></span>
                <span>•</span>
                <span>Altura: <strong className="text-slate-800">{student.heightCm} cm</strong></span>
                <span>•</span>
                <button
                  id="student-view-open-measurements-btn"
                  type="button"
                  onClick={() => setShowMeasurementsModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-bold transition cursor-pointer group shadow-2xs"
                  title="Registrar e ver evolução das medidas corporais"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  {latestMeasurement ? (
                    <>
                      <span>Gordura: {latestMeasurement.bodyFatPercent ?? '—'}%</span>
                      {latestMeasurement.leanMassKg !== undefined && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          M. Magra {latestMeasurement.leanMassKg}kg
                        </span>
                      )}
                    </>
                  ) : (
                    <span>Registrar Medidas</span>
                  )}
                </button>
                <span>•</span>
                <button
                  id="student-view-open-cardio-btn"
                  type="button"
                  onClick={() => setShowCardioModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-700 font-bold transition cursor-pointer group shadow-2xs"
                  title="Calcular e Registrar Perda de Calorias (Esteira, Bike, Escada, etc.)"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span>Cardio: {totalCardioCalories} kcal</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    {studentCardioLogs.length} reg
                  </span>
                </button>
                <span>•</span>
                <button
                  id="student-view-open-history-btn"
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 font-bold transition cursor-pointer group shadow-2xs"
                  title="Ver histórico de treinos e cardio por data"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-600 group-hover:scale-110 transition-transform" />
                  <span>Histórico</span>
                </button>
                {instructor && (
                  <>
                    <span className="hidden xs:inline">•</span>
                    <span className="hidden xs:flex items-center gap-1 text-indigo-600 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {instructor.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Individual Student Profile & Subscription Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status da Mensalidade do Aluno */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              (student.paymentStatus || 'em_dia') === 'em_dia'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {(student.paymentStatus || 'em_dia') === 'em_dia' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-[11px]">Mensalidade em Dia</span>
                    <span className="text-[10px] text-emerald-600 block">Vencimento: todo dia {student.dueDay || 10}</span>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-[11px]">Mensalidade Pendente</span>
                    <span className="text-[10px] text-rose-600 block">Vencimento: dia {student.dueDay || 10}</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-slate-900 block truncate">Acesso Individual</span>
                <span className="text-[10px] text-slate-500 block truncate">{student.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sheet Banner */}
        {plan && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700 truncate">
              <Dumbbell className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">Ficha ativa: <strong className="text-slate-900">{plan.title}</strong></span>
            </div>
            {plan.notes && (
              <span className="text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] truncate max-w-full sm:max-w-md">
                "{plan.notes}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Weekday Selector & Focus of the Day - Horizontally scrollable on mobile */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {DAYS_CONFIG.map((day) => {
            const isSelected = selectedDay === day.key;
            const isToday = todayDayKey === day.key;
            const dayWorkout = plan?.schedule?.[day.key];
            const isCompleted = dayCompleted[day.key];

            return (
              <button
                key={day.key}
                id={`day-tab-${day.key}`}
                onClick={() => {
                  setSelectedDay(day.key);
                  setFeaturedExerciseId(null);
                }}
                className={`px-3.5 sm:px-5 py-2 rounded-full font-medium transition-all text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px] ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <span className="sm:hidden">{day.shortLabel}</span>
                <span className="hidden sm:inline">{day.fullLabel}</span>
                {isToday && (
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full uppercase font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    Hoje
                  </span>
                )}
                {isCompleted && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold">
            Foco de {DAYS_CONFIG.find(d => d.key === selectedDay)?.fullLabel}:
          </span>
          <span className="text-xs sm:text-sm font-bold text-indigo-700">
            {currentDayWorkout?.focus || (isRestDay ? 'Descanso Ativo' : 'Treino do Dia')}
          </span>
        </div>
      </div>

      {/* Mobile Tab Switcher: Exercícios / Vídeo & Dicas / Minhas Avaliações */}
      <div className="lg:hidden flex bg-slate-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setMobileTab('exercises')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'exercises' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Exercícios</span>
        </button>

        <button
          onClick={() => setMobileTab('video')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Vídeo & Técnica</span>
        </button>

        <button
          onClick={() => setMobileTab('evaluations')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            mobileTab === 'evaluations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Avaliações</span>
          {mySubmissions.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {mySubmissions.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: 7 cols exercises list + 5 cols demonstration & weekly progress */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Exercises Column */}
        <div className={`col-span-12 lg:col-span-7 flex flex-col gap-4 ${
          mobileTab === 'exercises' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* If Rest Day */}
          {isRestDay ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-800">Dia de Descanso e Recuperação</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Nenhum exercício prescrito para hoje. O descanso muscular é essencial para a síntese proteica, recuperação das articulações e crescimento.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2 text-left">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 block">Hidratação</span>
                  <p className="text-xs text-slate-500 mt-1">Beba ao menos 2.5 a 3L de água ao longo do dia.</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 block">Sono Reparador</span>
                  <p className="text-xs text-slate-500 mt-1">Busque entre 7 a 9 horas de descanso profundo.</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 block">Mobilidade Leve</span>
                  <p className="text-xs text-slate-500 mt-1">Alongamentos suaves ou caminhada regenerativa.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Exercise Cards */
            <div className="space-y-4">
              {currentDayWorkout.exercises.map((exercise, index) => {
                const progress = calculateExerciseProgress(exercise);
                const isFeatured = activeFeaturedExercise?.id === exercise.id;
                const customWeight = customWeights[exercise.id] || exercise.suggestedWeight;
                const latestSubmissionForExercise = submissions.find(
                  (s) => s.exerciseId === exercise.id && s.studentId === student.id
                );

                return (
                  <div
                    key={exercise.id}
                    id={`exercise-card-${exercise.id}`}
                    onClick={() => setFeaturedExerciseId(exercise.id)}
                    className={`bg-white p-5 rounded-2xl border shadow-xs transition-all cursor-pointer group ${
                      isFeatured
                        ? 'border-indigo-200 shadow-md ring-2 ring-indigo-500/10'
                        : 'border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-5">
                      {/* Mini Video / Thumbnail Box */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative">
                        {exercise.videoUrl ? (
                          <MiniVideoPlayer
                            videoUrl={exercise.videoUrl}
                            thumbnail={exercise.thumbnail}
                            exerciseName={exercise.name}
                            instructions={exercise.instructions}
                            tips={exercise.tips}
                            onOpenModal={() => setActiveExerciseForModal(exercise)}
                          />
                        ) : exercise.thumbnail ? (
                          <img
                            src={exercise.thumbnail}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <Dumbbell className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveExerciseForModal(exercise);
                          }}
                          className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Assistir demonstração completa"
                        >
                          <div className="w-7 h-7 bg-white/95 rounded-full flex items-center justify-center text-indigo-600 shadow-lg">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Exercise Name & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-sm sm:text-lg truncate">
                            {exercise.name}
                          </h3>
                          {progress.isComplete && (
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] sm:text-[11px] font-bold rounded-full">
                              Concluído
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-4 mt-1 text-[11px] sm:text-xs text-slate-500">
                          <span className="bg-slate-50 sm:bg-transparent px-1.5 py-0.5 rounded sm:p-0"><strong>{exercise.sets}</strong> Séries</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="bg-slate-50 sm:bg-transparent px-1.5 py-0.5 rounded sm:p-0"><strong>{exercise.reps}</strong> Reps</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="bg-slate-50 sm:bg-transparent px-1.5 py-0.5 rounded sm:p-0">Carga: <strong className="text-slate-700">{customWeight || 'Livre'}</strong></span>
                          <span className="hidden sm:inline">•</span>
                          <span className="bg-slate-50 sm:bg-transparent px-1.5 py-0.5 rounded sm:p-0">Descanso: <strong>{exercise.restSeconds}s</strong></span>
                        </div>
                      </div>

                      {/* Status / Quick Action Badge */}
                      <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                        {isFeatured ? (
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-bold rounded-full uppercase">
                            Ativo
                          </span>
                        ) : (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveExerciseForModal(exercise);
                            }}
                            className="p-1.5 sm:p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Ver vídeo ampliado"
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Sets Checklist */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Séries:
                        </span>
                        {Array.from({ length: exercise.sets }).map((_, sIdx) => {
                          const isSetDone = completedSets[`${selectedDay}_${exercise.id}_${sIdx}`];
                          return (
                            <button
                              key={sIdx}
                              id={`set-btn-${exercise.id}-${sIdx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSet(exercise.id, sIdx, exercise.restSeconds, exercise.name);
                              }}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                                isSetDone
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isSetDone ? 'fill-current' : 'text-slate-400'}`} />
                              <span>S{sIdx + 1}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Action Buttons: Video Recording & Rest Timer */}
                      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 pt-1">
                        {/* Video Execution Button */}
                        {latestSubmissionForExercise ? (
                          <button
                            id={`submission-status-btn-${exercise.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSubmission(latestSubmissionForExercise);
                            }}
                            className={`flex-1 xs:flex-initial px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                              latestSubmissionForExercise.status === 'reviewed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Ver vídeo enviado e avaliação do professor"
                          >
                            {latestSubmissionForExercise.status === 'reviewed' ? (
                              <>
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                <span>{latestSubmissionForExercise.feedback?.rating}★ Avaliado pelo Prof.</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Vídeo Enviado (Pendente)</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            id={`record-execution-btn-${exercise.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecordingExercise(exercise);
                            }}
                            className="flex-1 xs:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-[38px]"
                            title="Gravar vídeo da execução para o professor avaliar"
                          >
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Gravar Execução</span>
                          </button>
                        )}

                        {/* Trigger Rest Timer Button */}
                        <button
                          id={`quick-timer-${exercise.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            startRestTimer(exercise.restSeconds || 60, exercise.name);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Descansar {exercise.restSeconds}s</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile completion card at bottom of exercise list */}
              <div className="lg:hidden bg-indigo-600 rounded-2xl p-4 text-white shadow-md mt-2">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-bold">Progresso de Hoje</h4>
                    <p className="text-[11px] text-indigo-100">
                      {completedExercisesCount} de {totalExercises} concluídos
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold">{overallProgressPercent}%</span>
                </div>
                <div className="w-full bg-indigo-800 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className="bg-white h-full transition-all duration-300 rounded-full"
                    style={{ width: `${overallProgressPercent}%` }}
                  />
                </div>
                <button
                  onClick={handleFinishWorkout}
                  disabled={isRestDay}
                  className="w-full py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>{dayCompleted[selectedDay] ? 'Treino Concluído! 🎉' : 'Finalizar Treino de Hoje'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Demonstration & Progress Column */}
        <div className={`col-span-12 lg:col-span-5 flex flex-col gap-6 ${
          mobileTab !== 'exercises' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Demonstration Card (Dark Sleek Highlight from HTML) - visible on desktop or when mobileTab === 'video' */}
          <div className={`${mobileTab === 'evaluations' ? 'hidden lg:block' : 'block'} bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden`}>
            <div className="relative z-10">
              <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                Demonstração de Execução
              </h4>
              <h2 className="text-2xl font-bold mb-4">
                {activeFeaturedExercise ? activeFeaturedExercise.name : 'Selecione um Exercício'}
              </h2>

              {activeFeaturedExercise ? (
                <div>
                  <div className="aspect-video bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative shadow-inner">
                    <MiniVideoPlayer
                      videoUrl={activeFeaturedExercise.videoUrl}
                      thumbnail={activeFeaturedExercise.thumbnail}
                      exerciseName={activeFeaturedExercise.name}
                      instructions={activeFeaturedExercise.instructions}
                      tips={activeFeaturedExercise.tips}
                      onOpenModal={() => setActiveExerciseForModal(activeFeaturedExercise)}
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      "{activeFeaturedExercise.instructions || 'Mantenha a postura alinhada e controle o movimento durante toda a fase excêntrica.'}"
                    </p>

                    {activeFeaturedExercise.tips && (
                      <div className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-2 rounded-xl">
                        <strong>Dica do Coach:</strong> {activeFeaturedExercise.tips}
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 border-t border-slate-800 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs shadow-md">
                          {instructor?.name ? instructor.name[0] : 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{instructor?.name || 'Prof. Carlos Silva'}</p>
                          <p className="text-[10px] text-slate-400">Personal Trainer • CREF {instructor?.cref || '019283-G'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveExerciseForModal(activeFeaturedExercise)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1 shadow-md shadow-indigo-500/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Câmera Lenta</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhum exercício para demonstrar hoje.</p>
              )}
            </div>
          </div>

          {/* Weekly / Day Progress Card (Indigo Theme from Design HTML) */}
          <div className={`${mobileTab === 'evaluations' ? 'hidden lg:block' : 'block'} bg-indigo-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-200`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold">Progresso do Treino</h4>
                <p className="text-xs text-indigo-100">
                  {completedExercisesCount} de {totalExercises} exercícios concluídos hoje
                </p>
              </div>
              <span className="text-3xl font-extrabold">{overallProgressPercent}%</span>
            </div>

            <div className="w-full bg-indigo-800 h-2.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>

            {/* Finish Workout CTA */}
            <div className="flex items-center gap-2">
              {dayCompleted[selectedDay] ? (
                <>
                  <button
                    id="reset-day-progress-btn"
                    onClick={handleResetDayProgress}
                    className="px-4 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refazer</span>
                  </button>
                  <div className="flex-1 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs text-center shadow-sm">
                    Treino Concluído! 🎉
                  </div>
                </>
              ) : (
                <button
                  id="finish-workout-btn"
                  onClick={handleFinishWorkout}
                  disabled={isRestDay}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Finalizar Treino de Hoje</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Submissions & Teacher Feedback Card */}
          <div className={`${mobileTab === 'video' ? 'hidden lg:block' : 'block'} bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Avaliações do Professor</h4>
                  <p className="text-[11px] text-slate-500">Vídeos enviados para análise técnica</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  {mySubmissions.length} no total
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                    {pendingCount} pendente
                  </span>
                )}
              </div>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Você ainda não enviou nenhum vídeo de execução. Clique em <strong>"Gravar Execução"</strong> em qualquer exercício para que o instrutor analise sua postura!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setViewingSubmission(sub)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 relative overflow-hidden">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                          {sub.exerciseName}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{new Date(sub.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                          {sub.weightUsed && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">{sub.weightUsed}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {sub.status === 'reviewed' ? (
                        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{sub.feedback?.rating}★ Avaliado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Aguardando</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cardio & Calorie Loss Tracking Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cardio & Gasto Calórico</h4>
                  <p className="text-[11px] text-slate-500">Esteira, bike, escada e aeróbicos</p>
                </div>
              </div>
              <button
                id="student-view-cardio-card-open-btn"
                type="button"
                onClick={() => setShowCardioModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Calcular / Registrar</span>
              </button>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Queima Total</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono block leading-tight mt-0.5">
                  {totalCardioCalories} <span className="text-[11px] font-bold text-orange-600">kcal</span>
                </span>
              </div>
              <div className="text-center border-x border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duração</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono block leading-tight mt-0.5">
                  {totalCardioMinutes} <span className="text-[11px] font-bold text-indigo-600">min</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sessões</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono block leading-tight mt-0.5">
                  {studentCardioLogs.length} <span className="text-[11px] font-bold text-slate-500">treinos</span>
                </span>
              </div>
            </div>

            {/* Recent Logs List */}
            {studentCardioLogs.length === 0 ? (
              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-center space-y-2">
                <Footprints className="w-6 h-6 text-orange-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Nenhum treino de cardio registrado.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCardioModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Calcular Gasto Calórico Agora
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {studentCardioLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setShowCardioModal(true)}
                    className="p-2.5 bg-slate-50 hover:bg-orange-50/50 rounded-xl border border-slate-200/80 hover:border-orange-200 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-orange-600 shrink-0">
                        {log.equipment === 'esteira' ? (
                          <Footprints className="w-3.5 h-3.5" />
                        ) : log.equipment === 'bike' ? (
                          <Bike className="w-3.5 h-3.5" />
                        ) : log.equipment === 'escada' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {log.equipmentLabel}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>{new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                          <span>•</span>
                          <span>{log.durationMinutes} min</span>
                          {log.distanceKm && (
                            <>
                              <span>•</span>
                              <span>{log.distanceKm} km</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-slate-900 font-mono shrink-0">
                      {log.caloriesBurned} <span className="text-[10px] font-bold text-orange-600">kcal</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal with Slow Motion & Technique Guidance */}
      {activeExerciseForModal && (
        <ExerciseVideoModal
          exercise={activeExerciseForModal}
          onClose={() => setActiveExerciseForModal(null)}
        />
      )}

      {/* Record Execution Modal */}
      {recordingExercise && (
        <RecordExecutionModal
          exercise={recordingExercise}
          student={student}
          dayOfWeek={selectedDay}
          onClose={() => setRecordingExercise(null)}
          onSubmit={handleRecordSubmit}
        />
      )}

      {/* Submission Detail Modal (Video playback & instructor feedback) */}
      {viewingSubmission && (
        <SubmissionDetailModal
          submission={viewingSubmission}
          userRole="aluno"
          instructorName={instructor?.name}
          onClose={() => setViewingSubmission(null)}
        />
      )}

      {/* Floating Rest Timer */}
      {activeTimerSeconds !== null && (
        <RestTimer
          key={timerKey}
          initialSeconds={activeTimerSeconds}
          exerciseName={timerExerciseName}
          onClose={() => setActiveTimerSeconds(null)}
        />
      )}

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <AvatarUploadModal
          currentAvatar={student.avatar}
          name={student.name}
          onClose={() => setShowAvatarModal(false)}
          onSave={(dataUrl) => {
            if (onUpdateStudent) {
              onUpdateStudent({ ...student, avatar: dataUrl });
            }
          }}
        />
      )}

      {/* Registro de Medidas Corporais */}
      {showMeasurementsModal && (
        <MeasurementsModal
          student={student}
          measurements={measurements}
          onClose={() => setShowMeasurementsModal(false)}
          onSaveMeasurement={async (m) => {
            if (onSaveMeasurement) {
              await onSaveMeasurement(m);
            }
            // Mantém o peso do perfil sincronizado com o último registro,
            // já que outras telas (ex: calculadora de cardio) usam
            // `student.weightKg` como padrão.
            if (onUpdateStudent && m.weightKg) {
              onUpdateStudent({ ...student, weightKg: m.weightKg });
            }
          }}
          onDeleteMeasurement={(id) => {
            if (onDeleteMeasurement) onDeleteMeasurement(id);
          }}
        />
      )}

      {/* Cardio & Calorie Calculator / Log Modal */}
      {showCardioModal && (
        <CardioTrackerModal
          student={student}
          cardioLogs={cardioLogs}
          onClose={() => setShowCardioModal(false)}
          onSaveCardioLog={async (newLog) => {
            if (onSaveCardioLog) {
              // O `await`/`return` aqui é essencial: é o que permite ao
              // modal aguardar a gravação real no Firestore antes de exibir
              // "sucesso" ao usuário.
              await onSaveCardioLog(newLog);
            }
          }}
          onDeleteCardioLog={(logId) => {
            if (onDeleteCardioLog) {
              onDeleteCardioLog(logId);
            }
          }}
        />
      )}

      {/* Histórico de treinos, cardio e vídeos por data */}
      {showHistoryModal && (
        <HistoryModal
          student={student}
          plan={plan}
          dayProgressList={dayProgressList}
          cardioLogs={cardioLogs}
          submissions={submissions}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

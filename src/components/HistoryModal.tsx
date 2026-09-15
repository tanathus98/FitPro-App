import React, { useMemo, useState } from 'react';
import {
  X, CalendarDays, CheckCircle2, XCircle, Flame, Dumbbell,
  Video, Star, ChevronRight, Footprints, Bike, TrendingUp, Zap, Activity,
} from 'lucide-react';
import {
  CardioEquipment, CardioLog, DayProgress, ExecutionSubmission,
  Student, WorkoutPlan,
} from '../types';
import { DAYS_CONFIG } from '../data/initialData';

interface HistoryModalProps {
  student: Student;
  plan?: WorkoutPlan;
  dayProgressList: DayProgress[];
  cardioLogs: CardioLog[];
  submissions?: ExecutionSubmission[];
  onClose: () => void;
}

const dayLabel = (dayOfWeek?: string) =>
  DAYS_CONFIG.find((d) => d.key === dayOfWeek)?.fullLabel || dayOfWeek || '';

const formatDatePtBR = (dateStr: string) => {
  // dateStr é sempre YYYY-MM-DD; construir manualmente evita problemas de
  // fuso horário do `new Date('YYYY-MM-DD')` (que interpreta como UTC e
  // pode "voltar" um dia dependendo do horário local do navegador).
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const renderEquipmentIcon = (eq: CardioEquipment, className = 'w-3.5 h-3.5') => {
  switch (eq) {
    case 'esteira':
      return <Footprints className={className} />;
    case 'bike':
      return <Bike className={className} />;
    case 'escada':
      return <TrendingUp className={className} />;
    case 'remo':
      return <Zap className={className} />;
    case 'corda':
      return <Flame className={className} />;
    default:
      return <Activity className={className} />;
  }
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  student,
  plan,
  dayProgressList,
  cardioLogs,
  submissions = [],
  onClose,
}) => {
  const studentProgress = useMemo(
    () => dayProgressList.filter((p) => p.studentId === student.id),
    [dayProgressList, student.id]
  );
  const studentCardio = useMemo(
    () => cardioLogs.filter((l) => l.studentId === student.id),
    [cardioLogs, student.id]
  );
  const studentSubmissions = useMemo(
    () => submissions.filter((s) => s.studentId === student.id),
    [submissions, student.id]
  );

  // União de todas as datas (YYYY-MM-DD) em que houve QUALQUER atividade:
  // treino de musculação concluído/em andamento, cardio registrado, ou
  // vídeo de execução enviado.
  const allDates = useMemo(() => {
    const set = new Set<string>();
    studentProgress.forEach((p) => set.add(p.dateStr));
    studentCardio.forEach((l) => set.add(l.date));
    studentSubmissions.forEach((s) => set.add(s.submittedAt.split('T')[0]));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [studentProgress, studentCardio, studentSubmissions]);

  const [selectedDate, setSelectedDate] = useState<string | null>(allDates[0] || null);

  const progressForSelected = studentProgress.find((p) => p.dateStr === selectedDate);
  const cardioForSelected = studentCardio.filter((l) => l.date === selectedDate);
  const submissionsForSelected = studentSubmissions.filter(
    (s) => s.submittedAt.split('T')[0] === selectedDate
  );

  const dayWorkout = progressForSelected
    ? plan?.schedule?.[progressForSelected.dayOfWeek]
    : undefined;

  const cardioCaloriesForSelected = cardioForSelected.reduce(
    (acc, l) => acc + (l.caloriesBurned || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="history-modal-container"
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100/90 text-indigo-600 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Histórico de Treinos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  {student.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte o que foi feito em cada dia: séries, pesos, cardio e vídeos enviados
              </p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Date list */}
          <div className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 p-3 space-y-1.5 max-h-56 md:max-h-full overflow-y-auto">
            {allDates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum registro encontrado ainda. Assim que o aluno marcar séries, concluir um treino ou registrar cardio, as datas aparecem aqui.
              </div>
            ) : (
              allDates.map((dateStr) => {
                const p = studentProgress.find((pp) => pp.dateStr === dateStr);
                const hasCardio = studentCardio.some((l) => l.date === dateStr);
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{formatDatePtBR(dateStr)}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {p ? dayLabel(p.dayOfWeek) : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p?.completed && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Treino concluído" />
                      )}
                      {hasCardio && <Flame className="w-3.5 h-3.5 text-orange-500" title="Cardio registrado" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 p-4 sm:p-5 space-y-5">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 py-16">
                Selecione uma data à esquerda para ver os detalhes.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {formatDatePtBR(selectedDate)}
                    {progressForSelected && (
                      <span className="text-slate-500 font-medium"> • {dayLabel(progressForSelected.dayOfWeek)}</span>
                    )}
                  </h4>
                  {progressForSelected && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        progressForSelected.completed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {progressForSelected.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Treino concluído
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Treino iniciado, não finalizado
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Musculação */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Musculação
                    </h5>
                  </div>
                  {!progressForSelected || !dayWorkout ? (
                    <p className="text-xs text-slate-500">
                      Nenhum registro de série de musculação para esta data
                      {!dayWorkout && progressForSelected ? ' (a ficha atual não tem mais este dia configurado)' : ''}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayWorkout.exercises.map((ex) => {
                        let done = 0;
                        for (let i = 0; i < ex.sets; i++) {
                          if (progressForSelected.completedSets?.[`${progressForSelected.dayOfWeek}_${ex.id}_${i}`]) done++;
                        }
                        const weight = progressForSelected.exerciseWeights?.[ex.id];
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{ex.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {ex.reps} reps {weight ? `• Carga: ${weight}` : ''}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                done === ex.sets
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : done > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {done}/{ex.sets} séries
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cardio */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cardio</h5>
                    </div>
                    {cardioForSelected.length > 0 && (
                      <span className="text-[11px] font-bold text-orange-700">
                        {cardioCaloriesForSelected} kcal no total
                      </span>
                    )}
                  </div>
                  {cardioForSelected.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum cardio registrado nesta data.</p>
                  ) : (
                    <div className="space-y-2">
                      {cardioForSelected.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="p-1.5 rounded-lg bg-orange-50 border border-orange-200/80 text-orange-600 shrink-0">
                              {renderEquipmentIcon(log.equipment)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{log.equipmentLabel}</p>
                              <p className="text-[10px] text-slate-500">
                                {log.durationMinutes} min • {log.intensityLabel}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-900 shrink-0">
                            {log.caloriesBurned} kcal
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vídeos enviados */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-4 h-4 text-slate-700" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Vídeos Enviados para Avaliação
                    </h5>
                  </div>
                  {submissionsForSelected.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum vídeo enviado nesta data.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissionsForSelected.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{sub.exerciseName}</p>
                            {sub.feedback && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-500" /> {sub.feedback.rating}/5 — {sub.feedback.statusVerdict}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              sub.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {sub.status === 'reviewed' ? 'Avaliado' : 'Aguardando'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
          <button
            id="close-history-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

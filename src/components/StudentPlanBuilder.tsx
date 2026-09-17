import React, { useState } from 'react';
import {
  X, Dumbbell, Sparkles, Plus, Trash2, Edit3, ChevronLeft, Save, Moon,
} from 'lucide-react';
import {
  CustomExercise, DayOfWeek, DayWorkout, Exercise, Student, WorkoutPlan, WorkoutTemplate,
} from '../types';
import { DAYS_CONFIG } from '../data/initialData';
import { WORKOUT_TEMPLATES } from '../data/workoutTemplates';
import { ExerciseEditorModal } from './InstructorView';

interface StudentPlanBuilderProps {
  student: Student;
  existingPlan?: WorkoutPlan;
  customExercises?: CustomExercise[];
  onClose: () => void;
  onSave: (plan: WorkoutPlan) => Promise<void>;
  onSaveToLibrary: (exercise: CustomExercise) => void | Promise<void>;
  onDeleteFromLibrary: (exerciseId: string) => void;
}

const BLANK_SCHEDULE: Record<DayOfWeek, DayWorkout> = {
  segunda: { dayOfWeek: 'segunda', title: 'Treino A', focus: 'Defina o foco do dia', isRestDay: false, exercises: [] },
  terca: { dayOfWeek: 'terca', title: 'Treino B', focus: 'Defina o foco do dia', isRestDay: false, exercises: [] },
  quarta: { dayOfWeek: 'quarta', title: 'Descanso', focus: 'Recuperação', isRestDay: true, exercises: [] },
  quinta: { dayOfWeek: 'quinta', title: 'Treino C', focus: 'Defina o foco do dia', isRestDay: false, exercises: [] },
  sexta: { dayOfWeek: 'sexta', title: 'Treino D', focus: 'Defina o foco do dia', isRestDay: false, exercises: [] },
  sabado: { dayOfWeek: 'sabado', title: 'Descanso Ativo', focus: 'Caminhada ou mobilidade', isRestDay: true, exercises: [] },
  domingo: { dayOfWeek: 'domingo', title: 'Descanso Total', focus: 'Regeneração', isRestDay: true, exercises: [] },
};

// Dá um id novo pra cada exercício do modelo escolhido, pra manter o
// padrão de ids únicos por ficha usado no resto do app.
const cloneScheduleWithFreshIds = (schedule: Record<DayOfWeek, DayWorkout>): Record<DayOfWeek, DayWorkout> => {
  const cloned: Partial<Record<DayOfWeek, DayWorkout>> = {};
  (Object.keys(schedule) as DayOfWeek[]).forEach((day) => {
    const dw = schedule[day];
    cloned[day] = {
      ...dw,
      exercises: dw.exercises.map((e) => ({ ...e, id: `ex_${Math.random().toString(36).substring(2, 9)}` })),
    };
  });
  return cloned as Record<DayOfWeek, DayWorkout>;
};

export const StudentPlanBuilder: React.FC<StudentPlanBuilderProps> = ({
  student,
  existingPlan,
  customExercises = [],
  onClose,
  onSave,
  onSaveToLibrary,
  onDeleteFromLibrary,
}) => {
  const [step, setStep] = useState<'choose' | 'edit'>(existingPlan ? 'edit' : 'choose');
  const [workingPlan, setWorkingPlan] = useState<WorkoutPlan | null>(existingPlan || null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('segunda');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startFromTemplate = (template: WorkoutTemplate) => {
    setWorkingPlan({
      id: existingPlan?.id || `plan_${student.id}`,
      studentId: student.id,
      title: template.title,
      startDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      notes: '',
      schedule: cloneScheduleWithFreshIds(template.schedule),
    });
    setStep('edit');
  };

  const startFromScratch = () => {
    setWorkingPlan({
      id: existingPlan?.id || `plan_${student.id}`,
      studentId: student.id,
      title: 'Minha Ficha de Treino',
      startDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      notes: '',
      schedule: cloneScheduleWithFreshIds(BLANK_SCHEDULE),
    });
    setStep('edit');
  };

  const currentDay = workingPlan?.schedule[selectedDay];

  const updateDay = (patch: Partial<DayWorkout>) => {
    if (!workingPlan) return;
    setWorkingPlan({
      ...workingPlan,
      schedule: {
        ...workingPlan.schedule,
        [selectedDay]: { ...workingPlan.schedule[selectedDay], ...patch },
      },
    });
  };

  const handleAddOrUpdateExercise = (exercise: Exercise) => {
    if (!workingPlan) return;
    const existing = workingPlan.schedule[selectedDay].exercises;
    const isEditing = existing.some((e) => e.id === exercise.id);
    const nextExercises = isEditing
      ? existing.map((e) => (e.id === exercise.id ? exercise : e))
      : [...existing, exercise];
    updateDay({ exercises: nextExercises, isRestDay: false });
    setShowAddExerciseModal(false);
    setEditingExercise(null);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!currentDay) return;
    updateDay({ exercises: currentDay.exercises.filter((e) => e.id !== exerciseId) });
  };

  const handleSave = async () => {
    if (!workingPlan) return;
    setIsSaving(true);
    try {
      await onSave({ ...workingPlan, updatedAt: new Date().toISOString().split('T')[0] });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="student-plan-builder-container"
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            {step === 'edit' && !existingPlan && (
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2.5 rounded-2xl bg-indigo-100/90 text-indigo-600 shadow-2xs">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {step === 'choose' ? 'Montar Minha Ficha de Treino' : 'Editando: ' + (workingPlan?.title || '')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'choose'
                  ? 'Escolha um modelo pronto pra começar, ou monte do zero'
                  : 'Adicione exercícios em cada dia da semana'}
              </p>
            </div>
          </div>
          <button
            id="close-plan-builder-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 'choose' ? (
            <div className="space-y-4">
              <button
                type="button"
                id="plan-builder-from-scratch-btn"
                onClick={startFromScratch}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Montar do zero</h4>
                  <p className="text-xs text-slate-500">Comece com uma semana em branco e monte exercício por exercício.</p>
                </div>
              </button>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Ou comece com um modelo pronto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {WORKOUT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      id={`plan-template-${tpl.id}`}
                      onClick={() => startFromTemplate(tpl)}
                      className="text-left p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer flex flex-col gap-2"
                    >
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 w-fit">
                        <Sparkles className="w-2.5 h-2.5" /> {tpl.level}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">{tpl.title}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            workingPlan && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Day tabs */}
                <div className="lg:col-span-3 space-y-1.5">
                  {DAYS_CONFIG.map((day) => {
                    const dw = workingPlan.schedule[day.key];
                    const isSelected = selectedDay === day.key;
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setSelectedDay(day.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold">{day.fullLabel}</div>
                          <div className="text-[10px] text-slate-500 truncate">{dw.title}</div>
                        </div>
                        {dw.isRestDay ? (
                          <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600 shrink-0">{dw.exercises.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Day editor */}
                <div className="lg:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Nome do treino do dia
                      </label>
                      <input
                        type="text"
                        value={currentDay?.title || ''}
                        onChange={(e) => updateDay({ title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Foco do dia
                      </label>
                      <input
                        type="text"
                        value={currentDay?.focus || ''}
                        onChange={(e) => updateDay({ focus: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={currentDay?.isRestDay || false}
                      onChange={(e) => updateDay({ isRestDay: e.target.checked })}
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                    Este é um dia de descanso (sem exercícios)
                  </label>

                  {!currentDay?.isRestDay && (
                    <div className="space-y-2">
                      {currentDay?.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{exercise.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {exercise.sets} séries × {exercise.reps} • {exercise.restSeconds}s
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExercise(exercise);
                                setShowAddExerciseModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(exercise.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        id="plan-builder-add-exercise-btn"
                        onClick={() => {
                          setEditingExercise(null);
                          setShowAddExerciseModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Exercício
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {step === 'edit' && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="plan-builder-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar Ficha'}
            </button>
          </div>
        )}
      </div>

      {showAddExerciseModal && (
        <ExerciseEditorModal
          initialExercise={editingExercise}
          instructorId={student.id}
          customExercises={customExercises}
          onClose={() => {
            setShowAddExerciseModal(false);
            setEditingExercise(null);
          }}
          onSave={handleAddOrUpdateExercise}
          onSaveToLibrary={onSaveToLibrary}
          onDeleteFromLibrary={onDeleteFromLibrary}
        />
      )}
    </div>
  );
};

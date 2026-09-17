import { DayOfWeek, DayWorkout, Exercise, WorkoutTemplate } from '../types';
import { EXERCISE_LIBRARY, ExerciseLibraryItem } from './exerciseLibrary';

const REST_DAY = (dayOfWeek: DayOfWeek, title = 'Descanso', focus = 'Recuperação'): DayWorkout => ({
  dayOfWeek,
  title,
  focus,
  isRestDay: true,
  exercises: [],
});

const findLib = (id: string): ExerciseLibraryItem => {
  const item = EXERCISE_LIBRARY.find((e) => e.id === id);
  if (!item) throw new Error(`Exercício de biblioteca não encontrado: ${id}`);
  return item;
};

// Converte um item da biblioteca padrão em um Exercise "pronto para uso" —
// um id novo é gerado quando o modelo é efetivamente aplicado (ver
// applyTemplateExerciseIds em StudentPlanBuilder), aqui basta um id estável.
let seq = 0;
const ex = (libId: string, overrides?: Partial<Exercise>): Exercise => {
  const item = findLib(libId);
  seq += 1;
  return {
    id: `tpl_${libId}_${seq}`,
    name: item.name,
    muscleGroup: item.muscleGroup,
    sets: item.defaultSets,
    reps: item.defaultReps,
    suggestedWeight: 'Carga progressiva',
    restSeconds: item.defaultRestSeconds,
    videoUrl: item.videoUrl,
    thumbnail: item.thumbnail,
    instructions: item.instructions,
    tips: item.tips,
    ...overrides,
  };
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl_full_body_iniciante',
    title: 'Full Body — Iniciante (3x por semana)',
    description: 'Um treino de corpo inteiro por sessão, com bom volume geral e descanso entre os dias — ideal para quem está começando.',
    level: 'Iniciante',
    schedule: {
      segunda: {
        dayOfWeek: 'segunda',
        title: 'Full Body A',
        focus: 'Corpo inteiro',
        isRestDay: false,
        exercises: [
          ex('lib_agachamento_livre'),
          ex('lib_supino_reto'),
          ex('lib_puxada_alta'),
          ex('lib_elevacao_lateral'),
          ex('lib_prancha_abdominal'),
        ],
      },
      terca: REST_DAY('terca'),
      quarta: {
        dayOfWeek: 'quarta',
        title: 'Full Body B',
        focus: 'Corpo inteiro',
        isRestDay: false,
        exercises: [
          ex('lib_leg_press_45'),
          ex('lib_supino_inclinado'),
          ex('lib_remada_curvada'),
          ex('lib_rosca_direta'),
          ex('lib_triceps_corda'),
        ],
      },
      quinta: REST_DAY('quinta'),
      sexta: {
        dayOfWeek: 'sexta',
        title: 'Full Body C',
        focus: 'Corpo inteiro',
        isRestDay: false,
        exercises: [
          ex('lib_cadeira_extensora'),
          ex('lib_crucifixo_maquina'),
          ex('lib_desenvolvimento_halteres'),
          ex('lib_puxada_alta'),
          ex('lib_prancha_abdominal'),
        ],
      },
      sabado: REST_DAY('sabado', 'Descanso Ativo', 'Caminhada ou mobilidade'),
      domingo: REST_DAY('domingo', 'Descanso Total', 'Regeneração'),
    },
  },
  {
    id: 'tpl_abc_intermediario',
    title: 'ABC — Intermediário (3x por semana)',
    description: 'Divisão clássica em 3 treinos (A, B, C) por grupo muscular, com mais volume por região a cada sessão.',
    level: 'Intermediário',
    schedule: {
      segunda: {
        dayOfWeek: 'segunda',
        title: 'Treino A — Peito, Ombro e Tríceps',
        focus: 'Empurrar (Push)',
        isRestDay: false,
        exercises: [
          ex('lib_supino_reto'),
          ex('lib_supino_inclinado'),
          ex('lib_desenvolvimento_halteres'),
          ex('lib_elevacao_lateral'),
          ex('lib_triceps_corda'),
        ],
      },
      terca: REST_DAY('terca'),
      quarta: {
        dayOfWeek: 'quarta',
        title: 'Treino B — Costas e Bíceps',
        focus: 'Puxar (Pull)',
        isRestDay: false,
        exercises: [
          ex('lib_puxada_alta'),
          ex('lib_remada_curvada'),
          ex('lib_rosca_direta'),
        ],
      },
      quinta: REST_DAY('quinta'),
      sexta: {
        dayOfWeek: 'sexta',
        title: 'Treino C — Pernas e Abdômen',
        focus: 'Membros inferiores',
        isRestDay: false,
        exercises: [
          ex('lib_agachamento_livre'),
          ex('lib_leg_press_45'),
          ex('lib_cadeira_extensora'),
          ex('lib_prancha_abdominal'),
        ],
      },
      sabado: REST_DAY('sabado', 'Descanso Ativo', 'Caminhada ou mobilidade'),
      domingo: REST_DAY('domingo', 'Descanso Total', 'Regeneração'),
    },
  },
  {
    id: 'tpl_upper_lower_4x',
    title: 'Upper / Lower — 4x por semana',
    description: 'Alterna treino de membros superiores e inferiores, permitindo mais frequência semanal por grupo muscular.',
    level: 'Intermediário',
    schedule: {
      segunda: {
        dayOfWeek: 'segunda',
        title: 'Upper A',
        focus: 'Superiores',
        isRestDay: false,
        exercises: [
          ex('lib_supino_reto'),
          ex('lib_puxada_alta'),
          ex('lib_desenvolvimento_halteres'),
          ex('lib_rosca_direta'),
          ex('lib_triceps_corda'),
        ],
      },
      terca: {
        dayOfWeek: 'terca',
        title: 'Lower A',
        focus: 'Inferiores',
        isRestDay: false,
        exercises: [
          ex('lib_agachamento_livre'),
          ex('lib_leg_press_45'),
          ex('lib_cadeira_extensora'),
          ex('lib_prancha_abdominal'),
        ],
      },
      quarta: REST_DAY('quarta'),
      quinta: {
        dayOfWeek: 'quinta',
        title: 'Upper B',
        focus: 'Superiores',
        isRestDay: false,
        exercises: [
          ex('lib_supino_inclinado'),
          ex('lib_remada_curvada'),
          ex('lib_elevacao_lateral'),
          ex('lib_crucifixo_maquina'),
        ],
      },
      sexta: {
        dayOfWeek: 'sexta',
        title: 'Lower B',
        focus: 'Inferiores',
        isRestDay: false,
        exercises: [
          ex('lib_leg_press_45'),
          ex('lib_agachamento_livre'),
          ex('lib_prancha_abdominal'),
        ],
      },
      sabado: REST_DAY('sabado', 'Descanso Ativo', 'Caminhada ou mobilidade'),
      domingo: REST_DAY('domingo', 'Descanso Total', 'Regeneração'),
    },
  },
];

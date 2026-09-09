import { AuthSession, DayOfWeek, Exercise, ExecutionSubmission, Instructor, Student, WorkoutPlan, CardioLog } from '../types';
import { EXERCISE_LIBRARY } from './exerciseLibrary';

export const DAYS_CONFIG: { key: DayOfWeek; shortLabel: string; fullLabel: string; jsDayIndex: number }[] = [
  { key: 'segunda', shortLabel: 'SEG', fullLabel: 'Segunda-feira', jsDayIndex: 1 },
  { key: 'terca', shortLabel: 'TER', fullLabel: 'Terça-feira', jsDayIndex: 2 },
  { key: 'quarta', shortLabel: 'QUA', fullLabel: 'Quarta-feira', jsDayIndex: 3 },
  { key: 'quinta', shortLabel: 'QUI', fullLabel: 'Quinta-feira', jsDayIndex: 4 },
  { key: 'sexta', shortLabel: 'SEX', fullLabel: 'Sexta-feira', jsDayIndex: 5 },
  { key: 'sabado', shortLabel: 'SÁB', fullLabel: 'Sábado', jsDayIndex: 6 },
  { key: 'domingo', shortLabel: 'DOM', fullLabel: 'Domingo', jsDayIndex: 0 },
];

export function getTodayDayOfWeek(): DayOfWeek {
  const day = new Date().getDay();
  const match = DAYS_CONFIG.find(d => d.jsDayIndex === day);
  return match ? match.key : 'segunda';
}

export const INITIAL_INSTRUCTORS: Instructor[] = [];

export const INITIAL_INSTRUCTOR: Instructor | undefined = INITIAL_INSTRUCTORS[0];

const getLibEx = (id: string, overrides: Partial<Exercise> = {}): Exercise => {
  const item = EXERCISE_LIBRARY.find(e => e.id === id) || EXERCISE_LIBRARY[0];
  return {
    id: `ex_${Math.random().toString(36).substring(2, 9)}`,
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
    videoType: 'direct',
    ...overrides
  };
};

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_PLANS: Record<string, WorkoutPlan> = {};

export const INITIAL_SUBMISSIONS: ExecutionSubmission[] = [];

export const INITIAL_CARDIO_LOGS: CardioLog[] = [];

const STORAGE_KEYS = {
  STUDENTS: 'fitpro_students_v2',
  INSTRUCTOR: 'fitpro_instructor_v1',
  INSTRUCTORS: 'fitpro_instructors_v2',
  PLANS: 'fitpro_plans_v2',
  SESSION: 'fitpro_auth_session_v2',
  DAY_PROGRESS: 'fitpro_day_progress_v1',
  SUBMISSIONS: 'fitpro_submissions_v1',
  CARDIO_LOGS: 'fitpro_cardio_logs_v1'
};

export function loadStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession | null) {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Error saving session:', err);
  }
}

export function loadStoredData() {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawInstructors = localStorage.getItem(STORAGE_KEYS.INSTRUCTORS);
    const rawPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
    const rawSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);

    // Instructors
    let instructors: Instructor[] = INITIAL_INSTRUCTORS;
    if (rawInstructors) {
      try {
        const parsed = JSON.parse(rawInstructors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          instructors = parsed;
        }
      } catch (e) {
        instructors = INITIAL_INSTRUCTORS;
      }
    }

    // Students
    const rawLoadedStudents: Student[] = rawStudents ? JSON.parse(rawStudents) : INITIAL_STUDENTS;
    const students: Student[] = rawLoadedStudents.map((st, idx) => ({
      ...st,
      instructorId: st.instructorId || (idx < 2 ? 'inst_1' : idx < 4 ? 'inst_2' : 'inst_3'),
      paymentStatus: st.paymentStatus || (idx % 3 === 2 ? 'atrasado' : 'em_dia'),
      monthlyFee: st.monthlyFee || (idx === 1 ? 180 : idx === 4 ? 190 : 160),
      dueDay: st.dueDay || (idx === 1 ? 5 : (idx === 2 ? 1 : 10)),
      lastPaymentDate: st.lastPaymentDate || '2026-03-01'
    }));

    const instructor: Instructor = instructors[0];
    const plans: Record<string, WorkoutPlan> = rawPlans ? { ...INITIAL_PLANS, ...JSON.parse(rawPlans) } : INITIAL_PLANS;
    const submissions: ExecutionSubmission[] = rawSubmissions ? JSON.parse(rawSubmissions) : INITIAL_SUBMISSIONS;

    // Cardio Logs
    const rawCardioLogs = localStorage.getItem(STORAGE_KEYS.CARDIO_LOGS);
    let cardioLogs: CardioLog[] = INITIAL_CARDIO_LOGS;
    if (rawCardioLogs) {
      try {
        const parsed = JSON.parse(rawCardioLogs);
        if (Array.isArray(parsed)) {
          cardioLogs = parsed;
        }
      } catch (e) {
        cardioLogs = INITIAL_CARDIO_LOGS;
      }
    }

    return { students, instructors, instructor, plans, submissions, cardioLogs };
  } catch (err) {
    console.error('Error loading stored data:', err);
    return {
      students: INITIAL_STUDENTS,
      instructors: INITIAL_INSTRUCTORS,
      instructor: INITIAL_INSTRUCTORS[0],
      plans: INITIAL_PLANS,
      submissions: INITIAL_SUBMISSIONS,
      cardioLogs: INITIAL_CARDIO_LOGS
    };
  }
}

export function saveStoredData(data: {
  students?: Student[];
  instructor?: Instructor;
  instructors?: Instructor[];
  plans?: Record<string, WorkoutPlan>;
  submissions?: ExecutionSubmission[];
  cardioLogs?: CardioLog[];
}) {
  try {
    if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.instructors) localStorage.setItem(STORAGE_KEYS.INSTRUCTORS, JSON.stringify(data.instructors));
    if (data.plans) localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(data.plans));
    if (data.submissions) localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(data.submissions));
    if (data.cardioLogs) localStorage.setItem(STORAGE_KEYS.CARDIO_LOGS, JSON.stringify(data.cardioLogs));
  } catch (err) {
    console.error('Error saving stored data:', err);
  }
}

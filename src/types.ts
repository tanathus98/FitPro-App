export type UserRole = 'aluno' | 'instrutor';

export interface AuthSession {
  role: UserRole;
  userId: string;
}

export type DayOfWeek = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  suggestedWeight: string;
  restSeconds: number;
  videoUrl: string;
  videoType?: 'direct' | 'youtube' | 'preset';
  instructions: string;
  tips?: string;
  thumbnail?: string;
}

export interface DayWorkout {
  dayOfWeek: DayOfWeek;
  title: string;
  focus: string;
  isRestDay: boolean;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  studentId: string;
  title: string;
  startDate: string;
  updatedAt: string;
  notes?: string;
  schedule: Record<DayOfWeek, DayWorkout>;
}

export type PaymentStatus = 'em_dia' | 'atrasado' | 'pendente';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  goal: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  weightKg: number;
  heightCm: number;
  notes?: string;
  instructorId: string;
  joinedDate: string;
  currentPlanId?: string;
  paymentStatus?: PaymentStatus;
  monthlyFee?: number;
  dueDay?: number;
  lastPaymentDate?: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  cref: string;
  avatar: string;
  specialty: string;
}

export interface SetProgress {
  exerciseId: string;
  setIndex: number;
  completed: boolean;
  actualWeight?: string;
  actualReps?: string;
}

export interface DayProgress {
  studentId: string;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  completed: boolean;
  completedAt?: string;
  completedSets: Record<string, boolean>; // `${exerciseId}_${setIndex}` -> true
  exerciseWeights: Record<string, string>; // exerciseId -> weight
}

export interface InstructorFeedback {
  rating: number; // 1 to 5
  statusVerdict: 'excelente' | 'bom_ajustar' | 'atencao';
  text: string;
  reviewedAt: string;
  instructorName: string;
}

export interface ExecutionSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  exerciseId: string;
  exerciseName: string;
  exerciseMuscleGroup?: string;
  dayOfWeek: DayOfWeek;
  videoUrl: string; // blob URL or sample video
  videoBlobName?: string;
  videoDurationSeconds?: number;
  studentNotes?: string;
  weightUsed?: string;
  repsDone?: string;
  submittedAt: string; // ISO string
  status: 'pending' | 'reviewed';
  feedback?: InstructorFeedback;
}

export type CardioEquipment = 'esteira' | 'bike' | 'eliptico' | 'escada' | 'remo' | 'corda' | 'outro';

export interface CardioLog {
  id: string;
  studentId: string;
  studentName?: string;
  date: string; // YYYY-MM-DD
  equipment: CardioEquipment;
  equipmentLabel: string;
  intensityLevel: 'leve' | 'moderada' | 'vigorosa' | 'hiit';
  intensityLabel: string;
  durationMinutes: number;
  weightKg: number;
  caloriesBurned: number;
  distanceKm?: number;
  inclinePercent?: number;
  avgSpeedKmh?: number;
  avgHeartRateBpm?: number;
  notes?: string;
  createdAt: string;
}


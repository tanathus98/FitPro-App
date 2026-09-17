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

// Exercício salvo na biblioteca pessoal do professor (além dos "padrões" do
// sistema em src/data/exerciseLibrary.ts) — pode ser reaproveitado em
// qualquer ficha, sem precisar recadastrar do zero toda vez.
export interface CustomExercise {
  id: string;
  // Dono do exercício: uid do professor OU do aluno autônomo (sem
  // professor), dependendo de onde o documento está salvo
  // (instructors/{id}/customExercises ou students/{id}/customExercises).
  instructorId: string;
  name: string;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
  videoUrl: string;
  thumbnail: string;
  instructions: string;
  tips: string;
  createdAt: string;
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

// Modelo de treino pronto que um aluno autônomo (sem professor) pode usar
// como ponto de partida ao montar a própria ficha.
export interface WorkoutTemplate {
  id: string;
  title: string;
  description: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  schedule: Record<DayOfWeek, DayWorkout>;
}

// Solicitação de um aluno autônomo para se vincular a um professor.
// Documento salvo em instructors/{instructorId}/joinRequests/{studentId}.
export interface JoinRequest {
  id: string; // = studentId
  studentId: string;
  studentName: string;
  studentEmail?: string;
  instructorId: string;
  instructorName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
}

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
  // Ausente/vazio = aluno autônomo, sem professor vinculado.
  instructorId?: string;
  joinedDate: string;
  currentPlanId?: string;
  paymentStatus?: PaymentStatus;
  monthlyFee?: number;
  dueDay?: number;
  lastPaymentDate?: string;
  // `true` quando a conta foi criada pelo professor com uma senha gerada
  // automaticamente — força o aluno a definir sua própria senha no
  // primeiro acesso (depois de confirmar o e-mail).
  mustChangePassword?: boolean;
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
  studentName?: string;
  instructorId?: string;
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

// Um registro por dia (id do documento = dateStr) com a composição
// corporal do aluno naquela data — substitui a antiga "calculadora de IMC"
// como forma de acompanhar a evolução física de verdade.
export interface BodyMeasurement {
  id: string; // = dateStr
  studentId: string;
  studentName?: string;
  instructorId?: string;
  dateStr: string; // YYYY-MM-DD
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  leanMassKg?: number;
  fatMassKg?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
  createdAt: string;
}


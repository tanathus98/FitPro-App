import React, { useState } from 'react';
import { 
  Users, UserPlus, Dumbbell, Plus, Trash2, Edit3, Save, 
  Check, Calendar, ArrowUp, ArrowDown, Video, Copy, 
  Sparkles, ExternalLink, ShieldCheck, ChevronRight, Eye,
  Search, X, AlertCircle, Play, Star, Clock, CheckCircle2, MessageSquare, Filter, ArrowLeft,
  DollarSign, CreditCard, AlertTriangle, Wallet, Scale, Flame, Camera
} from 'lucide-react';
import { DayOfWeek, Exercise, Instructor, Student, WorkoutPlan, ExecutionSubmission, InstructorFeedback, PaymentStatus, CardioLog } from '../types';
import { DAYS_CONFIG } from '../data/initialData';
import { AvatarUploadModal } from './AvatarUploadModal';
import { EXERCISE_LIBRARY, ExerciseLibraryItem, MUSCLE_GROUPS } from '../data/exerciseLibrary';
import { MiniVideoPlayer } from './MiniVideoPlayer';
import { ExerciseVideoModal } from './ExerciseVideoModal';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { BMICalculatorModal, getBMICategory } from './BMICalculatorModal';
import { CardioTrackerModal } from './CardioTrackerModal';
import { uploadExerciseVideo } from '../services/dataService';

interface InstructorViewProps {
  instructor: Instructor;
  instructors?: Instructor[];
  students: Student[];
  plans: Record<string, WorkoutPlan>;
  submissions?: ExecutionSubmission[];
  cardioLogs?: CardioLog[];
  onSavePlan: (plan: WorkoutPlan) => void;
  onCreateStudent: (student: Student, initialPlan: WorkoutPlan, password: string) => Promise<void>;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateSubmissionFeedback?: (submissionId: string, feedback: InstructorFeedback) => void;
  onSwitchInstructor?: (instructorId: string) => void;
  onCreateInstructor?: (instructor: Instructor) => void;
  onUpdateInstructor?: (instructor: Instructor) => void;
  onSaveCardioLog?: (log: CardioLog) => void;
  onDeleteCardioLog?: (logId: string) => void;
}

export const InstructorView: React.FC<InstructorViewProps> = ({
  instructor,
  instructors = [],
  students,
  plans,
  submissions = [],
  cardioLogs = [],
  onSavePlan,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onUpdateSubmissionFeedback,
  onSwitchInstructor,
  onCreateInstructor,
  onUpdateInstructor,
  onSaveCardioLog,
  onDeleteCardioLog,
}) => {
  const [activeTab, setActiveTab] = useState<'workouts' | 'evaluations'>('workouts');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('segunda');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileWorkoutSubView, setMobileWorkoutSubView] = useState<'students' | 'plan'>('students');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'em_dia' | 'atrasado'>('all');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Evaluation tab filters and state
  const [evaluationFilterStudentId, setEvaluationFilterStudentId] = useState<string>('all');
  const [evaluationFilterStatus, setEvaluationFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<ExecutionSubmission | null>(null);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [videoPreviewExercise, setVideoPreviewExercise] = useState<Exercise | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Financial & Subscription Metrics
  const totalStudentsCount = students.length;
  const upToDateStudents = students.filter((s) => (s.paymentStatus || 'em_dia') === 'em_dia');
  const overdueStudents = students.filter((s) => s.paymentStatus === 'atrasado');
  const totalMonthlyRevenue = students.reduce((acc, s) => acc + (s.monthlyFee || 150), 0);
  const upToDateRevenue = upToDateStudents.reduce((acc, s) => acc + (s.monthlyFee || 150), 0);
  const overdueRevenue = overdueStudents.reduce((acc, s) => acc + (s.monthlyFee || 150), 0);
  const upToDatePercent = totalStudentsCount > 0 ? Math.round((upToDateStudents.length / totalStudentsCount) * 100) : 0;

  // Filter students by query and payment filter
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.level.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const status = s.paymentStatus || 'em_dia';
    if (paymentFilter === 'em_dia') return status === 'em_dia';
    if (paymentFilter === 'atrasado') return status === 'atrasado';
    return true;
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentPlan = selectedStudent?.currentPlanId ? plans[selectedStudent.currentPlanId] : null;

  const handleTogglePaymentStatus = (student: Student) => {
    const isCurrentlyUpToDate = (student.paymentStatus || 'em_dia') === 'em_dia';
    const newStatus: PaymentStatus = isCurrentlyUpToDate ? 'atrasado' : 'em_dia';
    const updated: Student = {
      ...student,
      paymentStatus: newStatus,
      lastPaymentDate: newStatus === 'em_dia' ? new Date().toISOString().split('T')[0] : student.lastPaymentDate,
    };
    onUpdateStudent(updated);
    showToast(
      newStatus === 'em_dia'
        ? `Pagamento registrado: Mensalidade de ${student.name} está EM DIA!`
        : `Mensalidade de ${student.name} marcada como ATRASADA.`
    );
  };

  // Working copy of the active plan for instant editing
  const [workingPlan, setWorkingPlan] = useState<WorkoutPlan | null>(currentPlan);

  // Sync working plan when student changes
  React.useEffect(() => {
    if (selectedStudent?.currentPlanId && plans[selectedStudent.currentPlanId]) {
      setWorkingPlan(JSON.parse(JSON.stringify(plans[selectedStudent.currentPlanId])));
    } else if (selectedStudent) {
      const emptyPlan: WorkoutPlan = {
        id: `plan_${selectedStudent.id}`,
        studentId: selectedStudent.id,
        title: `Ficha de Treino - ${selectedStudent.name}`,
        startDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        schedule: {
          segunda: { dayOfWeek: 'segunda', title: 'Treino A', focus: 'Membros Superiores', isRestDay: false, exercises: [] },
          terca: { dayOfWeek: 'terca', title: 'Treino B', focus: 'Membros Inferiores', isRestDay: false, exercises: [] },
          quarta: { dayOfWeek: 'quarta', title: 'Descanso', focus: 'Recuperação', isRestDay: true, exercises: [] },
          quinta: { dayOfWeek: 'quinta', title: 'Treino C', focus: 'Superiores Complementares', isRestDay: false, exercises: [] },
          sexta: { dayOfWeek: 'sexta', title: 'Treino D', focus: 'Inferiores e Glúteo', isRestDay: false, exercises: [] },
          sabado: { dayOfWeek: 'sabado', title: 'Descanso Ativo', focus: 'Recuperação', isRestDay: true, exercises: [] },
          domingo: { dayOfWeek: 'domingo', title: 'Descanso', focus: 'Regeneração', isRestDay: true, exercises: [] },
        }
      };
      setWorkingPlan(emptyPlan);
    } else {
      setWorkingPlan(null);
    }
  }, [selectedStudentId, plans, selectedStudent]);

  // Ensure selectedStudentId belongs to current instructor's students
  React.useEffect(() => {
    if (students.length > 0 && !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCurrentPlan = () => {
    if (!workingPlan) return;
    const updated = {
      ...workingPlan,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onSavePlan(updated);
    showToast(`Ficha de ${selectedStudent.name} salva com sucesso!`);
  };

  // Day actions
  const currentDayData = workingPlan?.schedule[selectedDay];

  const handleUpdateDayMeta = (field: 'title' | 'focus' | 'isRestDay', value: any) => {
    if (!workingPlan) return;
    setWorkingPlan({
      ...workingPlan,
      schedule: {
        ...workingPlan.schedule,
        [selectedDay]: {
          ...workingPlan.schedule[selectedDay],
          [field]: value
        }
      }
    });
  };

  const handleAddOrUpdateExercise = (exerciseData: Exercise) => {
    if (!workingPlan) return;
    const currentExercises = workingPlan.schedule[selectedDay]?.exercises || [];
    
    let updatedExercises: Exercise[];
    const exists = currentExercises.some((e) => e.id === exerciseData.id);
    
    if (exists) {
      updatedExercises = currentExercises.map((e) => (e.id === exerciseData.id ? exerciseData : e));
    } else {
      updatedExercises = [...currentExercises, exerciseData];
    }

    setWorkingPlan({
      ...workingPlan,
      schedule: {
        ...workingPlan.schedule,
        [selectedDay]: {
          ...workingPlan.schedule[selectedDay],
          isRestDay: false,
          exercises: updatedExercises
        }
      }
    });

    setShowAddExerciseModal(false);
    setEditingExercise(null);
    showToast(exists ? 'Exercício atualizado!' : 'Exercício adicionado à ficha!');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!workingPlan) return;
    if (window.confirm('Tem certeza que deseja remover este exercício?')) {
      const filtered = (workingPlan.schedule[selectedDay]?.exercises || []).filter(
        (e) => e.id !== exerciseId
      );
      setWorkingPlan({
        ...workingPlan,
        schedule: {
          ...workingPlan.schedule,
          [selectedDay]: {
            ...workingPlan.schedule[selectedDay],
            exercises: filtered
          }
        }
      });
      showToast('Exercício removido.');
    }
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (!workingPlan) return;
    const exercises = [...(workingPlan.schedule[selectedDay]?.exercises || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const temp = exercises[index];
    exercises[index] = exercises[targetIndex];
    exercises[targetIndex] = temp;

    setWorkingPlan({
      ...workingPlan,
      schedule: {
        ...workingPlan.schedule,
        [selectedDay]: {
          ...workingPlan.schedule[selectedDay],
          exercises
        }
      }
    });
  };

  const handleCopyDayRoutine = (targetDay: DayOfWeek) => {
    if (!workingPlan) return;
    const sourceRoutine = workingPlan.schedule[selectedDay];
    if (!sourceRoutine) return;

    if (window.confirm(`Deseja copiar a rotina de ${DAYS_CONFIG.find(d => d.key === selectedDay)?.shortLabel} para ${DAYS_CONFIG.find(d => d.key === targetDay)?.shortLabel}?`)) {
      const copiedExercises = (sourceRoutine.exercises || []).map((e) => ({
        ...e,
        id: `ex_${Math.random().toString(36).substring(2, 9)}`
      }));

      setWorkingPlan({
        ...workingPlan,
        schedule: {
          ...workingPlan.schedule,
          [targetDay]: {
            ...workingPlan.schedule[targetDay],
            title: sourceRoutine.title,
            focus: sourceRoutine.focus,
            isRestDay: sourceRoutine.isRestDay,
            exercises: copiedExercises
          }
        }
      });
      showToast(`Rotina copiada com sucesso para ${DAYS_CONFIG.find(d => d.key === targetDay)?.shortLabel}!`);
    }
  };

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;
  const reviewedSubmissionsCount = submissions.filter((s) => s.status === 'reviewed').length;

  const filteredSubmissions = submissions.filter((sub) => {
    if (evaluationFilterStudentId !== 'all' && sub.studentId !== evaluationFilterStudentId) {
      return false;
    }
    if (evaluationFilterStatus === 'pending' && sub.status !== 'pending') {
      return false;
    }
    if (evaluationFilterStatus === 'reviewed' && sub.status !== 'reviewed') {
      return false;
    }
    return true;
  });

  const selectedStudentSubmissions = submissions.filter((s) => s.studentId === selectedStudent?.id);
  const selectedStudentPendingCount = selectedStudentSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Instructor Header Card - Sleek White Surface */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 w-full flex-1">
          <button
            type="button"
            id="btn-edit-instructor-avatar"
            onClick={() => setShowAvatarModal(true)}
            className="relative group shrink-0 mt-0.5 sm:mt-0 cursor-pointer"
            title="Alterar foto de perfil"
          >
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">{instructor.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                Instrutor / Personal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 break-words">
              CREF: <strong className="text-slate-700">{instructor.cref}</strong> • {instructor.specialty}
            </p>

            {/* Quick Instructor Switcher Pills */}
            {instructors.length > 1 && onSwitchInstructor && (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Turmas por Professor:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {instructors.map((inst) => (
                    <button
                      key={inst.id}
                      id={`switch-to-instructor-${inst.id}`}
                      type="button"
                      onClick={() => onSwitchInstructor(inst.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        inst.id === instructor.id
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{inst.name.split(' ')[0]} {inst.name.split(' ')[1] || ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            id="open-bmi-calc-header-btn"
            type="button"
            onClick={() => setShowBMIModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            title="Abrir Calculadora de IMC"
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Calculadora de IMC</span>
          </button>

          <button
            id="add-student-btn"
            onClick={() => setShowAddStudentModal(true)}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Financial & Subscription Summary Cards - Alunos Cadastrados, Em Dia & Atrasados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total de Alunos Cadastrados */}
        <div
          id="metric-total-students-card"
          onClick={() => {
            setPaymentFilter('all');
            setActiveTab('workouts');
            setMobileWorkoutSubView('students');
          }}
          className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all shadow-xs cursor-pointer group flex flex-col justify-between ${
            paymentFilter === 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/10'
              : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm'
          }`}
          title="Clique para listar todos os alunos"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Alunos Cadastrados
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalStudentsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {totalStudentsCount === 1 ? 'aluno ativo' : 'alunos ativos'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-indigo-500" />
                Receita prevista:
              </span>
              <strong className="text-slate-800 font-bold">
                R$ {totalMonthlyRevenue.toLocaleString('pt-BR')} / mês
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Mensalidades em Dia */}
        <div
          id="metric-up-to-date-card"
          onClick={() => {
            setPaymentFilter('em_dia');
            setActiveTab('workouts');
            setMobileWorkoutSubView('students');
          }}
          className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all shadow-xs cursor-pointer group flex flex-col justify-between ${
            paymentFilter === 'em_dia'
              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/15'
              : 'border-slate-200 hover:border-emerald-200 hover:shadow-sm'
          }`}
          title="Clique para filtrar apenas alunos com mensalidade em dia"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Mensalidades Em Dia
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
                {upToDateStudents.length}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {upToDatePercent}% adimplentes
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Valor recebido:</span>
              <strong className="text-emerald-700 font-bold">
                R$ {upToDateRevenue.toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Mensalidades Atrasadas */}
        <div
          id="metric-overdue-card"
          onClick={() => {
            setPaymentFilter('atrasado');
            setActiveTab('workouts');
            setMobileWorkoutSubView('students');
          }}
          className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all shadow-xs cursor-pointer group flex flex-col justify-between ${
            paymentFilter === 'atrasado'
              ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/15'
              : 'border-slate-200 hover:border-rose-200 hover:shadow-sm'
          }`}
          title="Clique para filtrar alunos com mensalidade atrasada"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              {overdueStudents.length > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              )}
              Mensalidades Atrasadas
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition ${
              overdueStudents.length > 0
                ? 'bg-rose-50 border border-rose-100 text-rose-600'
                : 'bg-slate-50 border border-slate-100 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                overdueStudents.length > 0 ? 'text-rose-700' : 'text-slate-800'
              }`}>
                {overdueStudents.length}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                overdueStudents.length > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {overdueStudents.length > 0 ? 'Atenção necessária' : 'Tudo regularizado'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Valor pendente:</span>
              <strong className={overdueStudents.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                R$ {overdueRevenue.toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-workouts-btn"
            onClick={() => setActiveTab('workouts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'workouts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Fichas e Prescrição de Treinos</span>
          </button>

          <button
            id="tab-evaluations-btn"
            onClick={() => setActiveTab('evaluations')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'evaluations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Avaliações de Execução</span>
            {pendingSubmissionsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                {pendingSubmissionsCount} pendente{pendingSubmissionsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                {submissions.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'evaluations' && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Clock className="w-3.5 h-3.5" />
              {pendingSubmissionsCount} para avaliar
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {reviewedSubmissionsCount} avaliadas
            </span>
          </div>
        )}
      </div>

      {activeTab === 'workouts' ? (
        <>
          {/* Mobile Switcher between Students List & Active Student Sheet */}
          <div className="lg:hidden flex bg-slate-200/80 p-1 rounded-2xl mb-4">
            <button
              onClick={() => setMobileWorkoutSubView('students')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileWorkoutSubView === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lista de Alunos ({students.length})</span>
            </button>
            <button
              onClick={() => setMobileWorkoutSubView('plan')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileWorkoutSubView === 'plan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Ficha ({selectedStudent?.name.split(' ')[0]})</span>
            </button>
          </div>

          {/* Main Instructor Workspace: Two Columns (Students List & Active Student Sheet Editor) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Students List (4 cols) */}
            <div className={`lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 ${
              mobileWorkoutSubView === 'students' ? 'block' : 'hidden lg:block'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Meus Alunos ({students.length})
                  </h2>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="search-students-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar aluno por nome ou objetivo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Payment Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  id="filter-pill-all"
                  onClick={() => setPaymentFilter('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    paymentFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  type="button"
                  id="filter-pill-em-dia"
                  onClick={() => setPaymentFilter('em_dia')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    paymentFilter === 'em_dia'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Em Dia ({upToDateStudents.length})
                </button>
                <button
                  type="button"
                  id="filter-pill-atrasado"
                  onClick={() => setPaymentFilter('atrasado')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    paymentFilter === 'atrasado'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Atrasados ({overdueStudents.length})
                </button>
              </div>

              {/* Students Roster */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudent?.id;
                  const studentPlan = s.currentPlanId ? plans[s.currentPlanId] : null;
                  const isUpToDate = (s.paymentStatus || 'em_dia') === 'em_dia';

                  return (
                    <div
                      key={s.id}
                      id={`student-item-${s.id}`}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setMobileWorkoutSubView('plan');
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{s.name}</h4>
                          </div>
                          <p className="text-[11px] text-indigo-600 font-medium truncate">{s.goal}</p>
                          
                          {/* Financial & Plan Badge */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {isUpToDate ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/80">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Em dia (Dia {s.dueDay || 10})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                Atrasado (Dia {s.dueDay || 10})
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-semibold">
                              R$ {s.monthlyFee || 150}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Nenhum aluno encontrado para os filtros selecionados.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Student Sheet Editor (8 cols) */}
            <div className={`lg:col-span-8 space-y-5 ${
              mobileWorkoutSubView === 'plan' ? 'block' : 'hidden lg:block'
            }`}>
              {/* Mobile Back to Students Button */}
              <button
                onClick={() => setMobileWorkoutSubView('students')}
                className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition cursor-pointer min-h-[38px] w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Lista de Alunos</span>
              </button>
          {selectedStudent && workingPlan ? (
            <>
              {/* Student Header & Plan Title Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {selectedStudent.level}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>{selectedStudent.weightKg}kg • {selectedStudent.heightCm}cm • {selectedStudent.goal}</span>
                        <span>•</span>
                        {(() => {
                          const hM = (selectedStudent.heightCm || 170) / 100;
                          const bmi = hM > 0 ? Math.round(((selectedStudent.weightKg || 70) / (hM * hM)) * 10) / 10 : 0;
                          const cat = getBMICategory(bmi);
                          return (
                            <button
                              id="instructor-open-student-bmi-btn"
                              type="button"
                              onClick={() => setShowBMIModal(true)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-bold transition cursor-pointer group shadow-2xs text-[11px]"
                              title="Calcular ou atualizar IMC do aluno"
                            >
                              <Scale className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                              <span>IMC: {bmi}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${cat.bgColor} ${cat.textColor} border ${cat.borderColor}`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="remove-student-btn"
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Tem certeza que deseja remover ${selectedStudent.name}? Isso apaga o perfil, a ficha de treino e o histórico dele(a). Essa ação não pode ser desfeita.`
                          )
                        ) {
                          onDeleteStudent(selectedStudent.id);
                          const remaining = students.filter((s) => s.id !== selectedStudent.id);
                          setSelectedStudentId(remaining[0]?.id || '');
                          setMobileWorkoutSubView('students');
                          showToast(`Aluno ${selectedStudent.name} removido.`);
                        }
                      }}
                      className="px-3 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Remover este aluno definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remover Aluno</span>
                    </button>
                    <button
                      id="save-plan-btn"
                      onClick={handleSaveCurrentPlan}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Ficha do Aluno</span>
                    </button>
                  </div>
                </div>

                {/* Financial & Subscription Management Bar for Selected Student */}
                <div 
                  id="student-financial-bar"
                  className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 sm:p-3.5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                      <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                      Status da Mensalidade:
                    </span>
                    {(selectedStudent.paymentStatus || 'em_dia') === 'em_dia' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Em Dia
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Atrasada
                      </span>
                    )}
                    <span className="text-xs text-slate-600 font-medium">
                      <strong>R$ {selectedStudent.monthlyFee || 150}</strong>/mês • Vencimento: <strong>Todo dia {selectedStudent.dueDay || 10}</strong>
                    </span>
                    {selectedStudent.lastPaymentDate && (
                      <span className="text-[11px] text-slate-500">
                        (Último pgto: {new Date(selectedStudent.lastPaymentDate + 'T00:00:00').toLocaleDateString('pt-BR')})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 justify-end">
                    <button
                      type="button"
                      id="toggle-student-payment-btn"
                      onClick={() => handleTogglePaymentStatus(selectedStudent)}
                      className={`flex-1 xl:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                        (selectedStudent.paymentStatus || 'em_dia') === 'em_dia'
                          ? 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {(selectedStudent.paymentStatus || 'em_dia') === 'em_dia'
                          ? 'Marcar como Atrasado'
                          : 'Registrar Pagamento'}
                      </span>
                    </button>
                    <button
                      type="button"
                      id="edit-student-payment-btn"
                      onClick={() => setShowEditPaymentModal(true)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 shrink-0 whitespace-nowrap shadow-2xs"
                      title="Editar valor ou dia de vencimento da mensalidade"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                {/* Plan Title & Notes Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Título da Ficha de Treino
                    </label>
                    <input
                      type="text"
                      id="plan-title-input"
                      value={workingPlan.title}
                      onChange={(e) => setWorkingPlan({ ...workingPlan, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="Ex: Treino ABC - Hipertrofia Fase 2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Orientações / Observações Clínicas
                    </label>
                    <input
                      type="text"
                      id="plan-notes-input"
                      value={workingPlan.notes || ''}
                      onChange={(e) => setWorkingPlan({ ...workingPlan, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="Ex: Cuidado com o ombro direito, cadência 3-0-1..."
                    />
                  </div>
                </div>
              </div>

              {/* Day of the Week Tabs - Sleek Interface Pills */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-7 sm:gap-1">
                  {DAYS_CONFIG.map((day) => {
                    const isSelected = selectedDay === day.key;
                    const dayRoutine = workingPlan.schedule[day.key];
                    const count = dayRoutine?.exercises?.length || 0;
                    const isRest = dayRoutine?.isRestDay;

                    return (
                      <button
                        key={day.key}
                        id={`coach-day-tab-${day.key}`}
                        onClick={() => setSelectedDay(day.key)}
                        className={`py-2 px-2.5 sm:px-1 rounded-xl text-center transition cursor-pointer shrink-0 min-w-[72px] sm:min-w-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold block">{day.shortLabel}</span>
                        <span className={`text-[10px] block mt-0.5 whitespace-nowrap ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}>
                          {isRest ? 'Descanso' : `${count} ex.`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Workout Config */}
              {currentDayData && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                  {/* Day Header Config */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Configurando {DAYS_CONFIG.find(d => d.key === selectedDay)?.fullLabel}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {currentDayData.isRestDay ? 'Dia marcado como Descanso' : (currentDayData.title || 'Treino do Dia')}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Toggle Rest Day */}
                      <button
                        id="toggle-rest-day-btn"
                        onClick={() => handleUpdateDayMeta('isRestDay', !currentDayData.isRestDay)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          currentDayData.isRestDay
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {currentDayData.isRestDay ? 'Descanso (Ativo)' : 'Marcar como Descanso'}
                      </button>

                      {/* Copy routine to another day */}
                      <div className="relative group">
                        <button
                          id="copy-routine-btn"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Copiar dia para...</span>
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 min-w-[140px]">
                          {DAYS_CONFIG.filter(d => d.key !== selectedDay).map(target => (
                            <button
                              key={target.key}
                              onClick={() => handleCopyDayRoutine(target.key)}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition"
                            >
                              Copiar para {target.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Add Exercise Button */}
                      {!currentDayData.isRestDay && (
                        <button
                          id="open-add-exercise-btn"
                          onClick={() => {
                            setEditingExercise(null);
                            setShowAddExerciseModal(true);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Exercício</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Day Metadata inputs if workout day */}
                  {!currentDayData.isRestDay && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nome do Treino do Dia
                        </label>
                        <input
                          type="text"
                          id="day-title-input"
                          value={currentDayData.title}
                          onChange={(e) => handleUpdateDayMeta('title', e.target.value)}
                          placeholder="Ex: Treino A - Peito & Tríceps"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Grupamentos e Foco Muscular
                        </label>
                        <input
                          type="text"
                          id="day-focus-input"
                          value={currentDayData.focus}
                          onChange={(e) => handleUpdateDayMeta('focus', e.target.value)}
                          placeholder="Ex: Peitoral maior, deltoide anterior e tríceps"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Exercises List for this Day */}
                  {currentDayData.isRestDay ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      Este dia está configurado como descanso. Clique em "Marcar como Descanso" acima para cadastrar exercícios.
                    </div>
                  ) : currentDayData.exercises.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                      <Dumbbell className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Nenhum exercício cadastrado para {DAYS_CONFIG.find(d => d.key === selectedDay)?.shortLabel}. Adicione exercícios com mini vídeos demonstrativos para orientar a execução do aluno.
                      </p>
                      <button
                        id="empty-add-exercise-btn"
                        onClick={() => {
                          setEditingExercise(null);
                          setShowAddExerciseModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-200"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Primeiro Exercício</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentDayData.exercises.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          id={`coach-exercise-item-${exercise.id}`}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Reorder arrows */}
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                id={`move-up-${exercise.id}`}
                                disabled={index === 0}
                                onClick={() => handleMoveExercise(index, 'up')}
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30 transition cursor-pointer"
                                title="Subir ordem"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`move-down-${exercise.id}`}
                                disabled={index === currentDayData.exercises.length - 1}
                                onClick={() => handleMoveExercise(index, 'down')}
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30 transition cursor-pointer"
                                title="Descer ordem"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Mini Video Preview Thumbnail */}
                            <div 
                              className="relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 cursor-pointer group shadow-2xs"
                              onClick={() => setVideoPreviewExercise(exercise)}
                              title="Clique para ver o mini vídeo"
                            >
                              {exercise.thumbnail ? (
                                <img src={exercise.thumbnail} alt={exercise.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                  <Video className="w-4 h-4" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition">
                                <Play className="w-4 h-4 text-white fill-current opacity-90 group-hover:scale-110 transition" />
                              </div>
                            </div>

                            {/* Exercise Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate min-w-0">{exercise.name}</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                  {exercise.muscleGroup}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 break-words">
                                <strong className="text-slate-800">{exercise.sets} séries × {exercise.reps}</strong> • Carga: <span className="text-indigo-600 font-semibold">{exercise.suggestedWeight || 'Livre'}</span> • Descanso: {exercise.restSeconds}s
                              </p>
                              {exercise.tips && (
                                <p className="text-[10px] text-amber-700/90 break-words mt-0.5">
                                  Dica: {exercise.tips}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <button
                              id={`preview-video-btn-${exercise.id}`}
                              onClick={() => setVideoPreviewExercise(exercise)}
                              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 transition cursor-pointer"
                              title="Ver mini vídeo demonstrativo"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`edit-ex-btn-${exercise.id}`}
                              onClick={() => {
                                setEditingExercise(exercise);
                                setShowAddExerciseModal(true);
                              }}
                              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                              title="Editar exercício"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-ex-btn-${exercise.id}`}
                              onClick={() => handleDeleteExercise(exercise.id)}
                              className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 transition cursor-pointer"
                              title="Remover exercício"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
              Selecione um aluno na coluna à esquerda para gerenciar sua ficha de treinos.
            </div>
          )}
        </div>
      </div>
      </>
      ) : (
        /* Evaluations & Video Review Section */
        <div className="space-y-6">
          {/* Header and Filter Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Video className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Avaliações de Execução dos Alunos
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Vídeos gravados pelos alunos durante o treino para correção postural, técnica e cadência.
                </p>
              </div>

              {/* Student Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Aluno:</span>
                <select
                  id="filter-eval-student-select"
                  value={evaluationFilterStudentId}
                  onChange={(e) => setEvaluationFilterStudentId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Todos os Alunos ({submissions.length})</option>
                  {students.map((st) => {
                    const count = submissions.filter((s) => s.studentId === st.id).length;
                    return (
                      <option key={st.id} value={st.id}>
                        {st.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick Metrics & Status Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  id="filter-eval-status-all"
                  onClick={() => setEvaluationFilterStatus('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    evaluationFilterStatus === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Todos ({evaluationFilterStudentId === 'all' ? submissions.length : submissions.filter(s => s.studentId === evaluationFilterStudentId).length})
                </button>
                <button
                  id="filter-eval-status-pending"
                  onClick={() => setEvaluationFilterStatus('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    evaluationFilterStatus === 'pending'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Aguardando Correção ({evaluationFilterStudentId === 'all' ? pendingSubmissionsCount : submissions.filter(s => s.studentId === evaluationFilterStudentId && s.status === 'pending').length})
                  </span>
                </button>
                <button
                  id="filter-eval-status-reviewed"
                  onClick={() => setEvaluationFilterStatus('reviewed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    evaluationFilterStatus === 'reviewed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Já Avaliados ({evaluationFilterStudentId === 'all' ? reviewedSubmissionsCount : submissions.filter(s => s.studentId === evaluationFilterStudentId && s.status === 'reviewed').length})
                  </span>
                </button>
              </div>

              {evaluationFilterStudentId !== 'all' && (
                <button
                  onClick={() => setEvaluationFilterStudentId('all')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Limpar filtro de aluno ✕
                </button>
              )}
            </div>
          </div>

          {/* Submissions Grid */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nenhum envio encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {submissions.length === 0
                  ? 'Nenhum aluno gravou vídeo de execução ainda. Quando gravarem pelo app, os envios aparecerão aqui para sua avaliação!'
                  : 'Nenhum vídeo corresponde aos filtros selecionados. Tente selecionar "Todos os Alunos" ou outro status.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSubmissions.map((sub) => {
                const subStudent = students.find((s) => s.id === sub.studentId);
                const isPending = sub.status === 'pending';

                return (
                  <div
                    key={sub.id}
                    id={`instructor-sub-card-${sub.id}`}
                    className={`bg-white rounded-3xl p-5 border shadow-xs transition-all space-y-4 ${
                      isPending
                        ? 'border-amber-200 ring-2 ring-amber-500/10'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Card Top: Student Profile & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={subStudent?.avatar || sub.studentAvatar}
                          alt={sub.studentName}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900">{sub.studentName}</h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              {subStudent?.level || 'Aluno'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Enviado em {new Date(sub.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {isPending ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendente</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{sub.feedback?.rating}★ Avaliado</span>
                        </div>
                      )}
                    </div>

                    {/* Exercise & Load Info */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-slate-900">{sub.exerciseName}</h5>
                        <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                          {DAYS_CONFIG.find((d) => d.key === sub.dayOfWeek)?.fullLabel || sub.dayOfWeek}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>Carga usada: <strong className="text-slate-900">{sub.weightUsed || 'Não inf.'}</strong></span>
                        {sub.repsDone && (
                          <>
                            <span>•</span>
                            <span>Repetições: <strong className="text-slate-900">{sub.repsDone}</strong></span>
                          </>
                        )}
                      </div>

                      {sub.studentNotes && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-xs text-slate-600 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="italic min-w-0 break-words">"{sub.studentNotes}"</span>
                        </div>
                      )}
                    </div>

                    {/* Feedback Summary (if already reviewed) */}
                    {sub.feedback && (
                      <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-900 text-[11px] shrink-0">Seu Diagnóstico:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 text-right">
                            {sub.feedback.statusVerdict === 'excelente'
                              ? 'Excelente'
                              : sub.feedback.statusVerdict === 'bom_ajustar'
                              ? 'Bom, com ajustes'
                              : 'Atenção'}
                          </span>
                        </div>
                        <p className="text-slate-700 italic text-[11px] line-clamp-2 break-words">
                          "{sub.feedback.text}"
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div>
                      {isPending ? (
                        <button
                          id={`evaluate-sub-btn-${sub.id}`}
                          onClick={() => setEvaluatingSubmission(sub)}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-200"
                        >
                          <Video className="w-4 h-4" />
                          <span>Assistir e Avaliar Execução</span>
                        </button>
                      ) : (
                        <button
                          id={`review-sub-btn-${sub.id}`}
                          onClick={() => setEvaluatingSubmission(sub)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                        >
                          <Edit3 className="w-4 h-4 text-slate-600" />
                          <span>Revisar / Atualizar Avaliação</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add or Edit Exercise */}
      {showAddExerciseModal && (
        <ExerciseEditorModal
          initialExercise={editingExercise}
          instructorId={instructor.id}
          onClose={() => {
            setShowAddExerciseModal(false);
            setEditingExercise(null);
          }}
          onSave={handleAddOrUpdateExercise}
        />
      )}

      {/* Modal: Edit Instructor Avatar */}
      {showAvatarModal && (
        <AvatarUploadModal
          currentAvatar={instructor.avatar}
          name={instructor.name}
          onClose={() => setShowAvatarModal(false)}
          onSave={(dataUrl) => {
            if (onUpdateInstructor) {
              onUpdateInstructor({ ...instructor, avatar: dataUrl });
            }
          }}
        />
      )}

      {/* Modal: Add New Student */}
      {showAddStudentModal && (
        <NewStudentModal
          instructorId={instructor.id}
          onClose={() => setShowAddStudentModal(false)}
          onCreate={async (student, plan, password) => {
            await onCreateStudent(student, plan, password);
            setSelectedStudentId(student.id);
            setShowAddStudentModal(false);
            showToast(`Aluno ${student.name} cadastrado com sucesso!`);
          }}
        />
      )}

      {/* Modal: Edit Student Payment Status and Fee */}
      {showEditPaymentModal && selectedStudent && (
        <EditStudentPaymentModal
          student={selectedStudent}
          onClose={() => setShowEditPaymentModal(false)}
          onSave={(updated) => {
            onUpdateStudent(updated);
            setShowEditPaymentModal(false);
            showToast(`Dados de pagamento de ${updated.name} salvos com sucesso!`);
          }}
        />
      )}

      {/* Modal: Calculadora de IMC */}
      {showBMIModal && (
        <BMICalculatorModal
          initialWeight={selectedStudent?.weightKg || 70}
          initialHeight={selectedStudent?.heightCm || 170}
          studentName={selectedStudent?.name}
          onClose={() => setShowBMIModal(false)}
          onSaveToStudent={(weightKg, heightCm) => {
            if (selectedStudent) {
              const updated = {
                ...selectedStudent,
                weightKg,
                heightCm,
              };
              onUpdateStudent(updated);
              showToast(`Peso e altura de ${selectedStudent.name} atualizados com sucesso!`);
            }
          }}
        />
      )}

      {/* Video Modal Preview */}
      {videoPreviewExercise && (
        <ExerciseVideoModal
          exercise={videoPreviewExercise}
          onClose={() => setVideoPreviewExercise(null)}
        />
      )}

      {/* Video Submission Detail & Instructor Evaluation Modal */}
      {evaluatingSubmission && (
        <SubmissionDetailModal
          submission={evaluatingSubmission}
          userRole="instrutor"
          instructorName={instructor.name}
          onClose={() => setEvaluatingSubmission(null)}
          onUpdateFeedback={(feedback) => {
            if (onUpdateSubmissionFeedback) {
              onUpdateSubmissionFeedback(evaluatingSubmission.id, feedback);
            }
            showToast('Avaliação gravada e enviada para o aluno com sucesso!');
            setEvaluatingSubmission(null);
          }}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   MODAL: Add / Edit Exercise with Video Demonstrator Selector
-------------------------------------------------------------- */
interface ExerciseEditorModalProps {
  initialExercise: Exercise | null;
  instructorId: string;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}

const ExerciseEditorModal: React.FC<ExerciseEditorModalProps> = ({
  initialExercise,
  instructorId,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'library' | 'custom'>(initialExercise ? 'custom' : 'library');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [libSearch, setLibSearch] = useState<string>('');

  // Form fields
  const [name, setName] = useState(initialExercise?.name || '');
  const [muscleGroup, setMuscleGroup] = useState(initialExercise?.muscleGroup || 'Peitoral');
  const [sets, setSets] = useState(initialExercise?.sets || 4);
  const [reps, setReps] = useState(initialExercise?.reps || '10 a 12');
  const [suggestedWeight, setSuggestedWeight] = useState(initialExercise?.suggestedWeight || 'Carga progressiva');
  const [restSeconds, setRestSeconds] = useState(initialExercise?.restSeconds || 60);
  const [videoUrl, setVideoUrl] = useState(initialExercise?.videoUrl || '');
  const [thumbnail, setThumbnail] = useState(initialExercise?.thumbnail || '');
  const [instructions, setInstructions] = useState(initialExercise?.instructions || '');
  const [tips, setTips] = useState(initialExercise?.tips || '');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  // Guarda o arquivo local escolhido até que o upload para o Storage termine
  // e `videoUrl` seja substituído pela URL pública e permanente.
  const pendingVideoFileRef = React.useRef<File | null>(null);

  // Filter Library
  const filteredLibrary = EXERCISE_LIBRARY.filter((item) => {
    const matchesGroup = selectedMuscle === 'Todos' || item.muscleGroup.toLowerCase().includes(selectedMuscle.toLowerCase());
    const matchesSearch = item.name.toLowerCase().includes(libSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleSelectFromLibrary = (item: ExerciseLibraryItem) => {
    pendingVideoFileRef.current = null;
    setVideoUploadError(null);
    setName(item.name);
    setMuscleGroup(item.muscleGroup);
    setSets(item.defaultSets);
    setReps(item.defaultReps);
    setRestSeconds(item.defaultRestSeconds);
    setVideoUrl(item.videoUrl);
    setThumbnail(item.thumbnail);
    setInstructions(item.instructions);
    setTips(item.tips);
    setTab('custom');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // O blob: aqui serve apenas para o preview imediato dentro deste
      // formulário. O arquivo real é enviado ao Storage no submit, e a
      // URL final (pública e permanente) substitui esta antes de salvar.
      pendingVideoFileRef.current = file;
      setVideoUploadError(null);
      const blobUrl = URL.createObjectURL(file);
      setVideoUrl(blobUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const exerciseId = initialExercise?.id || `ex_${Math.random().toString(36).substring(2, 9)}`;
    let finalVideoUrl = videoUrl.trim();

    try {
      if (pendingVideoFileRef.current) {
        setIsUploadingVideo(true);
        setVideoUploadError(null);
        finalVideoUrl = await uploadExerciseVideo(
          instructorId,
          exerciseId,
          pendingVideoFileRef.current,
          () => {} // progresso não exibido aqui para manter o formulário simples
        );
      }
    } catch (err) {
      console.error('Erro ao enviar vídeo do exercício:', err);
      setIsUploadingVideo(false);
      setVideoUploadError(
        'Não foi possível enviar o vídeo. Verifique sua conexão e tente novamente.'
      );
      return;
    }
    setIsUploadingVideo(false);

    const newExercise: Exercise = {
      id: exerciseId,
      name: name.trim(),
      muscleGroup,
      sets: Number(sets),
      reps: reps.trim(),
      suggestedWeight: suggestedWeight.trim(),
      restSeconds: Number(restSeconds),
      videoUrl: finalVideoUrl,
      thumbnail: thumbnail.trim(),
      instructions: instructions.trim(),
      tips: tips.trim(),
    };

    onSave(newExercise);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="exercise-editor-modal"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialExercise ? 'Editar Exercício da Ficha' : 'Adicionar Exercício com Mini Vídeo'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Selecione da biblioteca ou personalize movimento e vídeo
              </p>
            </div>
          </div>
          <button
            id="close-exercise-editor-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Library vs Custom */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-slate-50">
          <button
            id="modal-tab-library-btn"
            onClick={() => setTab('library')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              tab === 'library'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biblioteca de Exercícios Prontos</span>
          </button>
          <button
            id="modal-tab-custom-btn"
            onClick={() => setTab('custom')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              tab === 'custom'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Configurar Detalhes & Vídeo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {tab === 'library' ? (
            /* Exercise Library Browser */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    placeholder="Buscar por nome do exercício..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <select
                  value={selectedMuscle}
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredLibrary.map((item) => (
                  <div
                    key={item.id}
                    id={`lib-item-${item.id}`}
                    onClick={() => handleSelectFromLibrary(item)}
                    className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-2xl cursor-pointer transition flex items-start gap-3 group"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-300 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Dumbbell className="w-6 h-6 text-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-indigo-600/30 flex items-center justify-center transition">
                        <Play className="w-4 h-4 text-white fill-current opacity-90" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-indigo-600 block">{item.muscleGroup}</span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.defaultSets} séries × {item.defaultReps} • {item.defaultRestSeconds}s
                      </p>
                      <button className="mt-2 text-[10px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5 cursor-pointer">
                        <span>Selecionar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Form with Mini Video config */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Nome do Exercício *
                  </label>
                  <input
                    type="text"
                    id="custom-ex-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Supino Reto com Barra"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Grupamento Muscular
                  </label>
                  <input
                    type="text"
                    id="custom-ex-muscle"
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value)}
                    placeholder="Ex: Peitoral, Tríceps..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Prescription Numbers: Sets, Reps, Weight, Rest */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Séries</label>
                  <input
                    type="number"
                    id="custom-ex-sets"
                    min={1}
                    max={15}
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Repetições</label>
                  <input
                    type="text"
                    id="custom-ex-reps"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="10 a 12"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Carga Sugerida</label>
                  <input
                    type="text"
                    id="custom-ex-weight"
                    value={suggestedWeight}
                    onChange={(e) => setSuggestedWeight(e.target.value)}
                    placeholder="25kg cada lado"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Descanso (s)</label>
                  <input
                    type="number"
                    id="custom-ex-rest"
                    min={10}
                    max={300}
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* MINI VIDEO CONFIGURATION SECTION */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Mini Vídeo Demonstrativo da Execução
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  Insira o link direto de um vídeo (.mp4, .webm), URL do YouTube, ou selecione um arquivo de vídeo do seu dispositivo.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    URL do Vídeo (MP4 ou YouTube)
                  </label>
                  <input
                    type="url"
                    id="custom-video-url"
                    value={videoUrl}
                    onChange={(e) => {
                      pendingVideoFileRef.current = null;
                      setVideoUploadError(null);
                      setVideoUrl(e.target.value);
                    }}
                    placeholder="https://exemplo.com/video.mp4 ou https://youtube.com/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                {/* Upload Local Video File option */}
                <div className="flex items-center gap-3">
                  <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs cursor-pointer border border-slate-200 transition shadow-2xs">
                    Carregar Arquivo de Vídeo
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Formatos aceitos: MP4, WebM, MOV
                  </span>
                </div>

                {/* Upload error */}
                {videoUploadError && (
                  <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {videoUploadError}
                  </p>
                )}

                {/* Mini video live preview */}
                {videoUrl && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-600 block mb-1 font-semibold">Pré-visualização do Mini Vídeo:</span>
                    <div className="w-48 aspect-video rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                      <MiniVideoPlayer
                        videoUrl={videoUrl}
                        thumbnail={thumbnail}
                        exerciseName={name || 'Exercício'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions & Form Tips */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Passo a Passo da Execução Correta
                  </label>
                  <textarea
                    rows={2}
                    id="custom-instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Explique a postura correta, alinhamento dos pés, pegada e movimento..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                    Dica do Instrutor / Atenção Especial
                  </label>
                  <input
                    type="text"
                    id="custom-tips"
                    value={tips}
                    onChange={(e) => setTips(e.target.value)}
                    placeholder="Ex: Não deixe os joelhos fecharem na subida; controle a descida em 3 segundos."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  id="cancel-ex-btn"
                  onClick={onClose}
                  disabled={isUploadingVideo}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="save-ex-btn"
                  disabled={isUploadingVideo}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingVideo ? 'Enviando vídeo...' : 'Salvar na Ficha'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   MODAL: New Student Registration
-------------------------------------------------------------- */
interface NewStudentModalProps {
  instructorId: string;
  onClose: () => void;
  onCreate: (student: Student, plan: WorkoutPlan, password: string) => void;
}

const NewStudentModal: React.FC<NewStudentModalProps> = ({ instructorId, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('Hipertrofia & Ganho de Massa');
  const [level, setLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(175);
  const [notes, setNotes] = useState('');
  const [monthlyFee, setMonthlyFee] = useState(150);
  const [dueDay, setDueDay] = useState(10);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('em_dia');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return;
    if (!email.trim()) {
      setFormError('Informe um e-mail válido: ele será usado para o aluno entrar no app.');
      return;
    }
    if (password.length < 6) {
      setFormError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    const studentId = `stud_${Math.random().toString(36).substring(2, 9)}`;
    const planId = `plan_${studentId}`;

    const newStudent: Student = {
      id: studentId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '(11) 99999-0000',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=200&auto=format&fit=crop&q=80`,
      goal,
      level,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      notes: notes.trim(),
      instructorId,
      joinedDate: new Date().toISOString().split('T')[0],
      currentPlanId: planId,
      monthlyFee: Number(monthlyFee) || 150,
      dueDay: Number(dueDay) || 10,
      paymentStatus,
      lastPaymentDate: paymentStatus === 'em_dia' ? new Date().toISOString().split('T')[0] : undefined,
    };

    const initialPlan: WorkoutPlan = {
      id: planId,
      studentId: newStudent.id,
      title: `Ficha Inicial - ${newStudent.name}`,
      startDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      schedule: {
        segunda: { dayOfWeek: 'segunda', title: 'Treino A - Superiores', focus: 'Peito e Costas', isRestDay: false, exercises: [] },
        terca: { dayOfWeek: 'terca', title: 'Treino B - Membros Inferiores', focus: 'Quadríceps e Glúteos', isRestDay: false, exercises: [] },
        quarta: { dayOfWeek: 'quarta', title: 'Descanso', focus: 'Recuperação', isRestDay: true, exercises: [] },
        quinta: { dayOfWeek: 'quinta', title: 'Treino C - Ombros & Braços', focus: 'Deltoides, Bíceps e Tríceps', isRestDay: false, exercises: [] },
        sexta: { dayOfWeek: 'sexta', title: 'Treino D - Full Body / Core', focus: 'Estabilidade e Abdômen', isRestDay: false, exercises: [] },
        sabado: { dayOfWeek: 'sabado', title: 'Descanso Ativo', focus: 'Caminhada ou Mobilidade', isRestDay: true, exercises: [] },
        domingo: { dayOfWeek: 'domingo', title: 'Descanso Total', focus: 'Regeneração', isRestDay: true, exercises: [] },
      }
    };

    setIsSubmitting(true);
    try {
      await onCreate(newStudent, initialPlan, password);
    } catch (err: any) {
      setFormError(
        err?.code === 'auth/email-already-in-use'
          ? 'Já existe uma conta com esse e-mail. Use outro e-mail para este aluno.'
          : (err?.message || 'Não foi possível criar a conta do aluno. Tente novamente.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="new-student-modal-container"
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Aluno</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crie o perfil do aluno para cadastrar a ficha de treinos personalizada.
            </p>
          </div>
          <button
            id="close-student-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Nome Completo do Aluno *
            </label>
            <input
              type="text"
              required
              id="new-student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mariana Souza"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                id="new-student-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aluno@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Senha de Acesso do Aluno *
              </label>
              <input
                type="text"
                required
                minLength={6}
                id="new-student-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                id="new-student-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98888-7777"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Objetivo Principal
              </label>
              <select
                id="new-student-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Hipertrofia & Ganho de Massa">Hipertrofia & Ganho de Massa</option>
                <option value="Definição & Queima de Gordura">Definição & Queima de Gordura</option>
                <option value="Condicionamento Físico & Saúde">Condicionamento Físico & Saúde</option>
                <option value="Ganho de Força & Performance">Ganho de Força & Performance</option>
                <option value="Reabilitação & Postura">Reabilitação & Postura</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Nível de Treinamento
              </label>
              <select
                id="new-student-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.5"
                id="new-student-weight"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                id="new-student-height"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dados Financeiros / Mensalidade */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Mensalidade & Pagamento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Valor Mensal (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    id="new-student-fee"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Dia do Vencimento
                </label>
                <select
                  id="new-student-due-day"
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Status Inicial
                </label>
                <select
                  id="new-student-status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="em_dia">Em Dia (Regular)</option>
                  <option value="atrasado">Atrasado (Pendente)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Observações Médicas / Restrições
            </label>
            <textarea
              rows={2}
              id="new-student-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Dores na coluna lombar, limitações articulares..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium">
              {formError}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              id="cancel-new-student-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="submit-new-student-btn"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-md shadow-indigo-200 cursor-pointer"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar Aluno e Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   MODAL: Edit Student Payment Info & Status
-------------------------------------------------------------- */
interface EditStudentPaymentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
}

const EditStudentPaymentModal: React.FC<EditStudentPaymentModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(student.paymentStatus || 'em_dia');
  const [monthlyFee, setMonthlyFee] = useState<number>(student.monthlyFee || 150);
  const [dueDay, setDueDay] = useState<number>(student.dueDay || 10);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>(
    student.lastPaymentDate || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Student = {
      ...student,
      paymentStatus,
      monthlyFee: Number(monthlyFee) || 150,
      dueDay: Number(dueDay) || 10,
      lastPaymentDate: paymentStatus === 'em_dia' ? lastPaymentDate : student.lastPaymentDate,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="edit-payment-modal-container"
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gerenciar Mensalidade</h3>
              <p className="text-xs text-slate-500">{student.name}</p>
            </div>
          </div>
          <button
            id="close-edit-payment-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Status Selector with Visual Radio Cards */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Status Atual da Mensalidade
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="status-em-dia-btn"
                onClick={() => setPaymentStatus('em_dia')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  paymentStatus === 'em_dia'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100 text-emerald-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  paymentStatus === 'em_dia' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Em Dia</div>
                  <div className="text-[10px] text-slate-500">Regular</div>
                </div>
              </button>

              <button
                type="button"
                id="status-atrasado-btn"
                onClick={() => setPaymentStatus('atrasado')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  paymentStatus === 'atrasado'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-100 text-rose-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  paymentStatus === 'atrasado' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Atrasado</div>
                  <div className="text-[10px] text-slate-500">Pendente</div>
                </div>
              </button>
            </div>
          </div>

          {/* Valor da Mensalidade & Dia de Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Valor da Mensalidade (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  id="edit-monthly-fee-input"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Dia de Vencimento
              </label>
              <select
                id="edit-due-day-select"
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Todo dia {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data do Último Pagamento */}
          {paymentStatus === 'em_dia' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Data do Último Pagamento Registrado
              </label>
              <input
                type="date"
                id="edit-last-payment-date"
                value={lastPaymentDate}
                onChange={(e) => setLastPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              id="cancel-edit-payment-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-edit-payment-btn"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

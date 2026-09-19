import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  UserRole,
  Student,
  WorkoutPlan,
  ExecutionSubmission,
  InstructorFeedback,
  Instructor,
  CardioLog,
  DayProgress,
  BodyMeasurement,
  CustomExercise,
  JoinRequest,
} from './types';
import { AppHeader } from './components/AppHeader';
import { StudentView } from './components/StudentView';
import { InstructorView } from './components/InstructorView';
import { LoginScreen } from './components/LoginScreen';
import { VerifyEmailScreen } from './components/VerifyEmailScreen';
import { SetOwnPasswordScreen } from './components/SetOwnPasswordScreen';
import { User as UserIcon, Dumbbell, LogOut, ShieldCheck, Lock, AlertCircle, Video } from 'lucide-react';

import { watchAuthState, resolveUserRole, signOutUser, createStudentAuthAccount, sendVerificationEmail, reloadAuthUser, updateOwnPassword } from './services/authService';
import {
  subscribeInstructors,
  subscribeStudentsByInstructor,
  subscribeStudentById,
  subscribePlansForStudent,
  subscribePlansForStudents,
  subscribeSubmissionsForStudent,
  subscribeSubmissionsForInstructor,
  subscribeCardioLogsForStudent,
  subscribeCardioLogsForInstructor,
  subscribeDayProgressForStudent,
  subscribeDayProgressForInstructor,
  subscribeMeasurementsForStudent,
  subscribeMeasurementsForInstructor,
  subscribeCustomExercisesForInstructor,
  subscribeCustomExercisesForStudent,
  subscribeJoinRequestsForInstructor,
  subscribeJoinRequestsForStudent,
  saveStudent,
  linkStudentToInstructor,
  saveInstructor,
  deleteStudent as deleteStudentDoc,
  savePlan,
  addSubmission,
  updateSubmissionFeedback as updateSubmissionFeedbackDoc,
  addCardioLog,
  deleteCardioLog as deleteCardioLogDoc,
  saveDayProgress,
  saveMeasurement,
  deleteMeasurement as deleteMeasurementDoc,
  saveCustomExercise,
  deleteCustomExercise as deleteCustomExerciseDoc,
  saveCustomExerciseForStudent,
  deleteCustomExerciseForStudent as deleteCustomExerciseForStudentDoc,
  sendJoinRequest,
  respondToJoinRequest,
  deleteJoinRequest,
} from './services/dataService';

export default function App() {
  // --- Auth state ---
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [resolvingRole, setResolvingRole] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  // --- Data mirrored in real time from Firestore ---
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Record<string, WorkoutPlan>>({});
  const [submissions, setSubmissions] = useState<ExecutionSubmission[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [dayProgressList, setDayProgressList] = useState<DayProgress[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [studentCustomExercises, setStudentCustomExercises] = useState<CustomExercise[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  const [instructorSubView, setInstructorSubView] = useState<'manage' | 'preview'>('manage');
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Diretório público de instrutores: sempre disponível, logado ou não
  // (necessário para o aluno escolher o professor no cadastro).
  useEffect(() => {
    const unsub = subscribeInstructors(setInstructors);
    return () => unsub();
  }, []);

  // Observa o estado de autenticação do Firebase e descobre o papel do usuário.
  useEffect(() => {
    const unsub = watchAuthState(async (user) => {
      setAuthUser(user);
      setProfileMissing(false);

      if (!user) {
        setRole(null);
        setStudents([]);
        setPlans({});
        setSubmissions([]);
        setCardioLogs([]);
        setDayProgressList([]);
        setMeasurements([]);
        setCustomExercises([]);
        setStudentCustomExercises([]);
        setJoinRequests([]);
        setAuthChecked(true);
        return;
      }

      setResolvingRole(true);
      try {
        const resolvedRole = await resolveUserRole(user.uid);
        if (!resolvedRole) {
          setProfileMissing(true);
          setRole(null);
        } else {
          setRole(resolvedRole);
        }
      } finally {
        setResolvingRole(false);
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, []);

  // --- Assinaturas em tempo real: papel INSTRUTOR ---
  useEffect(() => {
    if (role !== 'instrutor' || !authUser) return;
    const uid = authUser.uid;
    const unsubStudents = subscribeStudentsByInstructor(uid, setStudents);
    const unsubSubmissions = subscribeSubmissionsForInstructor(uid, setSubmissions);
    const unsubCardio = subscribeCardioLogsForInstructor(uid, setCardioLogs);
    const unsubDayProgress = subscribeDayProgressForInstructor(uid, setDayProgressList);
    const unsubMeasurements = subscribeMeasurementsForInstructor(uid, setMeasurements);
    const unsubCustomExercises = subscribeCustomExercisesForInstructor(uid, setCustomExercises);
    const unsubJoinRequests = subscribeJoinRequestsForInstructor(uid, setJoinRequests);
    return () => {
      unsubStudents();
      unsubSubmissions();
      unsubCardio();
      unsubDayProgress();
      unsubMeasurements();
      unsubCustomExercises();
      unsubJoinRequests();
    };
  }, [role, authUser]);

  // Planos dos alunos do instrutor: depende da lista de alunos carregada acima.
  const instructorStudentIdsKey = useMemo(
    () => (role === 'instrutor' ? students.map((s) => s.id).sort().join(',') : ''),
    [role, students]
  );
  useEffect(() => {
    if (role !== 'instrutor') return;
    const ids = instructorStudentIdsKey ? instructorStudentIdsKey.split(',') : [];
    if (ids.length === 0) {
      setPlans({});
      return;
    }
    const unsub = subscribePlansForStudents(ids, setPlans);
    return () => unsub();
  }, [role, instructorStudentIdsKey]);

  // --- Assinaturas em tempo real: papel ALUNO ---
  useEffect(() => {
    if (role !== 'aluno' || !authUser) return;
    const uid = authUser.uid;
    const unsubStudent = subscribeStudentById(uid, (s) => setStudents(s ? [s] : []));
    const unsubPlans = subscribePlansForStudent(uid, setPlans);
    const unsubSubmissions = subscribeSubmissionsForStudent(uid, setSubmissions);
    const unsubCardio = subscribeCardioLogsForStudent(uid, setCardioLogs);
    const unsubDayProgress = subscribeDayProgressForStudent(uid, setDayProgressList);
    const unsubMeasurements = subscribeMeasurementsForStudent(uid, setMeasurements);
    const unsubCustomExercises = subscribeCustomExercisesForStudent(uid, setStudentCustomExercises);
    const unsubJoinRequests = subscribeJoinRequestsForStudent(uid, setJoinRequests);
    return () => {
      unsubStudent();
      unsubPlans();
      unsubSubmissions();
      unsubCardio();
      unsubDayProgress();
      unsubMeasurements();
      unsubCustomExercises();
      unsubJoinRequests();
    };
  }, [role, authUser]);

  const handleLogout = async () => {
    setAccessDeniedMessage(null);
    await signOutUser();
  };

  // --- Tela de carregamento inicial (checando sessão) ---
  if (!authChecked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Carregando...
      </div>
    );
  }

  // --- Não logado: tela de login/cadastro ---
  if (!authUser) {
    return <LoginScreen instructors={instructors} />;
  }

  // --- Logado, mas ainda não confirmou o e-mail: bloqueia o acesso até ---
  // --- clicar no link de confirmação enviado no cadastro ---
  if (!authUser.emailVerified) {
    return (
      <VerifyEmailScreen
        email={authUser.email}
        onResend={() => sendVerificationEmail(authUser)}
        onCheckAgain={async () => {
          const refreshed = await reloadAuthUser(authUser);
          if (refreshed.emailVerified) {
            // Clona o objeto para garantir que o React perceba a mudança
            // de `emailVerified` e refaça a renderização.
            setAuthUser({ ...refreshed } as typeof refreshed);
            return true;
          }
          return false;
        }}
        onLogout={handleLogout}
      />
    );
  }

  // --- Logado, mas ainda resolvendo se é aluno ou instrutor ---
  if (resolvingRole) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Carregando seu perfil...
      </div>
    );
  }

  // --- Autenticado, mas sem nenhum perfil correspondente no Firestore ---
  if (profileMissing || !role) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-700 max-w-sm">
          Sua conta foi autenticada, mas não encontramos um perfil de aluno ou instrutor associado a ela.
          Isso pode acontecer se o cadastro foi interrompido no meio do processo.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
        >
          Sair e tentar novamente
        </button>
      </div>
    );
  }

  // Multi-instructor resolution
  const currentInstructor =
    instructors.find((i) => i.id === authUser.uid) || instructors[0];

  if (role === 'instrutor' && !currentInstructor) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Carregando seu perfil de instrutor...
      </div>
    );
  }

  const instructorStudents = role === 'instrutor' ? students : [];

  const activeStudentId = role === 'aluno' ? authUser.uid : (instructorStudents[0]?.id || '');
  const activeStudent = students.find((s) => s.id === activeStudentId);

  if (role === 'aluno' && !activeStudent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Carregando seu perfil...
      </div>
    );
  }

  // --- Aluno cadastrado pelo professor com senha temporária: precisa ---
  // --- definir a própria senha antes de acessar o app ---
  if (role === 'aluno' && activeStudent?.mustChangePassword) {
    return (
      <SetOwnPasswordScreen
        studentName={activeStudent.name}
        onSubmit={async (newPassword) => {
          await updateOwnPassword(authUser, newPassword);
          await saveStudent({ ...activeStudent, mustChangePassword: false });
        }}
        onLogout={handleLogout}
      />
    );
  }

  const activePlan = activeStudent?.currentPlanId ? plans[activeStudent.currentPlanId] : undefined;

  const studentInstructor = activeStudent?.instructorId
    ? instructors.find((i) => i.id === activeStudent.instructorId)
    : undefined;

  const resolveInstructorIdForStudent = (studentId: string): string => {
    const s = students.find((st) => st.id === studentId);
    if (s?.instructorId) return s.instructorId;
    // Aluno autônomo (sem professor): NÃO herdar o id de outro professor —
    // `currentInstructor` cai em instructors[0] para alunos, e isso deixaria
    // os registros dele legíveis por um professor qualquer.
    return role === 'instrutor' ? currentInstructor?.id || '' : '';
  };

  const handleSavePlan = async (updatedPlan: WorkoutPlan) => {
    await savePlan(updatedPlan.studentId, updatedPlan);
  };

  // Instrutor cria a conta de acesso (Firebase Auth) + perfil (Firestore) de um novo aluno
  const handleCreateStudent = async (
    draftStudent: Student,
    draftPlan: WorkoutPlan,
    password: string
  ) => {
    const uid = await createStudentAuthAccount(draftStudent.email, password);
    const studentWithRealId: Student = {
      ...draftStudent,
      id: uid,
      instructorId: currentInstructor.id,
    };
    const planWithRealStudent: WorkoutPlan = {
      ...draftPlan,
      studentId: uid,
    };
    await saveStudent(studentWithRealId);
    await savePlan(uid, planWithRealStudent);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    await saveStudent(updatedStudent);
  };

  const handleUpdateInstructor = async (updatedInstructor: Instructor) => {
    await saveInstructor(updatedInstructor);
  };

  const handleDeleteStudent = async (studentId: string) => {
    // Observação: isto remove o perfil do aluno no Firestore. A conta de login
    // (Firebase Authentication) do aluno não é excluída automaticamente pelo
    // cliente por motivos de segurança — isso exigiria uma Cloud Function com
    // privilégios de administrador.
    await deleteStudentDoc(studentId);
  };

  const handleSubmitExecution = async (newSubmission: ExecutionSubmission) => {
    const instructorId = resolveInstructorIdForStudent(newSubmission.studentId);
    await addSubmission(newSubmission.studentId, instructorId, newSubmission);
  };

  const handleUpdateSubmissionFeedback = async (submissionId: string, feedback: InstructorFeedback) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    await updateSubmissionFeedbackDoc(sub.studentId, submissionId, feedback);
  };

  const handleSaveCardioLog = async (newLog: CardioLog) => {
    const instructorId = resolveInstructorIdForStudent(newLog.studentId);
    await addCardioLog(newLog.studentId, instructorId, newLog);
  };

  const handleSaveDayProgress = async (progress: DayProgress) => {
    const instructorId = resolveInstructorIdForStudent(progress.studentId);
    await saveDayProgress(progress.studentId, instructorId, progress);
  };

  const handleSaveMeasurement = async (measurement: BodyMeasurement) => {
    const instructorId = resolveInstructorIdForStudent(measurement.studentId);
    await saveMeasurement(measurement.studentId, instructorId, measurement);
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    const m = measurements.find((x) => x.id === measurementId);
    if (!m) return;
    await deleteMeasurementDoc(m.studentId, measurementId);
  };

  const handleSaveCustomExercise = async (exercise: CustomExercise) => {
    await saveCustomExercise(exercise.instructorId, exercise);
  };

  const handleDeleteCustomExercise = async (exerciseId: string) => {
    if (!currentInstructor) return;
    await deleteCustomExerciseDoc(currentInstructor.id, exerciseId);
  };

  // Biblioteca pessoal de exercícios do ALUNO autônomo (sem professor)
  const handleSaveStudentCustomExercise = async (exercise: CustomExercise) => {
    await saveCustomExerciseForStudent(exercise.instructorId, exercise);
  };

  const handleDeleteStudentCustomExercise = async (exerciseId: string) => {
    if (!activeStudent) return;
    await deleteCustomExerciseForStudentDoc(activeStudent.id, exerciseId);
  };

  // --- Vínculo aluno autônomo <-> professor ---
  const handleSendJoinRequest = async (instructorId: string) => {
    if (!activeStudent) return;
    const targetInstructor = instructors.find((i) => i.id === instructorId);
    await sendJoinRequest({
      id: activeStudent.id,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentEmail: activeStudent.email,
      instructorId,
      instructorName: targetInstructor?.name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });
  };

  const handleCancelJoinRequest = async (instructorId: string) => {
    if (!activeStudent) return;
    await deleteJoinRequest(instructorId, activeStudent.id);
  };

  const handleAcceptJoinRequest = async (request: JoinRequest) => {
    await linkStudentToInstructor(request.studentId, request.instructorId);
    await deleteJoinRequest(request.instructorId, request.studentId);
  };

  const handleRejectJoinRequest = async (request: JoinRequest) => {
    await respondToJoinRequest(request.instructorId, request.studentId, 'rejected');
  };

  const handleDeleteCardioLog = async (logId: string) => {
    const log = cardioLogs.find((l) => l.id === logId);
    if (!log) return;
    await deleteCardioLogDoc(log.studentId, logId);
  };

  const handleAttemptInstructorAccess = () => {
    if (role === 'aluno') {
      setAccessDeniedMessage('Acesso Restrito: Você está logado como Aluno e possui acesso exclusivo apenas ao seu perfil e ficha. O painel de gestão é de uso exclusivo do professor.');
      setTimeout(() => setAccessDeniedMessage(null), 5000);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Left Sleek Navigation Rail - Hidden on mobile, visible on sm and up */}
      <aside className="hidden sm:flex sm:w-20 bg-slate-900 flex-col items-center py-6 sm:py-8 gap-8 sm:gap-10 shadow-2xl shrink-0 z-40">
        {/* Brand F Icon */}
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 select-none"
          title="FitPro App"
        >
          F
        </div>

        {/* Action icons */}
        <nav className="flex flex-col gap-5 items-center">
          {role === 'aluno' ? (
            /* Student Rail Navigation */
            <>
              <button
                id="nav-rail-student-workout-btn"
                className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 transition cursor-pointer"
                title="Meu Treino"
              >
                <Dumbbell className="w-6 h-6" />
              </button>
              <button
                id="nav-rail-student-instructor-lock-btn"
                onClick={handleAttemptInstructorAccess}
                className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition cursor-pointer"
                title="Área do Instrutor (Restrito)"
              >
                <Lock className="w-6 h-6" />
              </button>
            </>
          ) : (
            /* Instructor Rail Navigation */
            <>
              <button
                id="nav-rail-instructor-manage-btn"
                onClick={() => setInstructorSubView('manage')}
                className={`p-3 rounded-xl transition cursor-pointer ${
                  instructorSubView === 'manage'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Gestão de Alunos & Fichas"
              >
                <ShieldCheck className="w-6 h-6" />
              </button>

              <button
                id="nav-rail-instructor-preview-btn"
                onClick={() => setInstructorSubView('preview')}
                className={`p-3 rounded-xl transition cursor-pointer ${
                  instructorSubView === 'preview'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Visualizar como Aluno (Prévia)"
              >
                <UserIcon className="w-6 h-6" />
              </button>
            </>
          )}
        </nav>

        {/* Bottom Exit / Logout Icon */}
        <div
          id="nav-rail-logout-btn"
          onClick={handleLogout}
          className="mt-auto p-3 text-slate-500 hover:text-red-400 rounded-xl cursor-pointer transition"
          title="Sair da Conta (Logout)"
        >
          <LogOut className="w-6 h-6" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AppHeader
          currentRole={role}
          currentStudent={activeStudent}
          instructor={role === 'aluno' ? studentInstructor : currentInstructor}
          allInstructors={instructors}
          onLogout={handleLogout}
        />

        {/* Access Denied Toast Notification */}
        {accessDeniedMessage && (
          <div className="mx-3 sm:mx-8 mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs animate-slideDown shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{accessDeniedMessage}</span>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Main View Area */}
        <section className="flex-1 px-3 sm:px-8 py-3.5 sm:py-6 pb-28 sm:pb-12 max-w-7xl w-full mx-auto">
          {role === 'aluno' ? (
            /* Student View: strictly isolated to the logged-in student */
            activeStudent ? (
              <StudentView
                student={activeStudent}
                plan={activePlan}
                instructor={studentInstructor}
                instructors={instructors}
                submissions={submissions}
                cardioLogs={cardioLogs}
                dayProgressList={dayProgressList}
                onSubmitExecution={handleSubmitExecution}
                onUpdateStudent={handleUpdateStudent}
                onSaveCardioLog={handleSaveCardioLog}
                onDeleteCardioLog={handleDeleteCardioLog}
                onSaveDayProgress={handleSaveDayProgress}
                measurements={measurements}
                onSaveMeasurement={handleSaveMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                onSavePlan={handleSavePlan}
                customExercises={studentCustomExercises}
                onSaveCustomExercise={handleSaveStudentCustomExercise}
                onDeleteCustomExercise={handleDeleteStudentCustomExercise}
                joinRequests={joinRequests}
                onSendJoinRequest={handleSendJoinRequest}
                onCancelJoinRequest={handleCancelJoinRequest}
              />
            ) : (
              <div className="text-center py-20 text-slate-500">
                Carregando seu perfil...
              </div>
            )
          ) : (
            /* Instructor Workspace */
            instructorSubView === 'manage' ? (
              <InstructorView
                instructor={currentInstructor}
                instructors={instructors}
                students={instructorStudents}
                plans={plans}
                submissions={submissions}
                cardioLogs={cardioLogs}
                dayProgressList={dayProgressList}
                onSavePlan={handleSavePlan}
                onCreateStudent={handleCreateStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onUpdateInstructor={handleUpdateInstructor}
                onUpdateSubmissionFeedback={handleUpdateSubmissionFeedback}
                onSaveCardioLog={handleSaveCardioLog}
                onDeleteCardioLog={handleDeleteCardioLog}
                measurements={measurements}
                onSaveMeasurement={handleSaveMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                customExercises={customExercises}
                onSaveCustomExercise={handleSaveCustomExercise}
                onDeleteCustomExercise={handleDeleteCustomExercise}
                joinRequests={joinRequests}
                onAcceptJoinRequest={handleAcceptJoinRequest}
                onRejectJoinRequest={handleRejectJoinRequest}
              />
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-xs text-indigo-900 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Modo de Prévia do Instrutor ({currentInstructor?.name}): Visualizando como o aluno enxerga a ficha</span>
                  </div>
                  <button
                    onClick={() => setInstructorSubView('manage')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Voltar para Gestão
                  </button>
                </div>
                {activeStudent && (
                  <StudentView
                    student={activeStudent}
                    plan={activePlan}
                    instructor={currentInstructor}
                    instructors={instructors}
                    submissions={submissions}
                    cardioLogs={cardioLogs}
                    dayProgressList={dayProgressList}
                    onSubmitExecution={handleSubmitExecution}
                    onUpdateStudent={handleUpdateStudent}
                    onSaveCardioLog={handleSaveCardioLog}
                    onDeleteCardioLog={handleDeleteCardioLog}
                    onSaveDayProgress={handleSaveDayProgress}
                    measurements={measurements}
                    onSaveMeasurement={handleSaveMeasurement}
                    onDeleteMeasurement={handleDeleteMeasurement}
                    onSavePlan={handleSavePlan}
                    customExercises={studentCustomExercises}
                    onSaveCustomExercise={handleSaveStudentCustomExercise}
                    onDeleteCustomExercise={handleDeleteStudentCustomExercise}
                    joinRequests={joinRequests}
                    onSendJoinRequest={handleSendJoinRequest}
                    onCancelJoinRequest={handleCancelJoinRequest}
                  />
                )}
              </div>
            )
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible exclusively on mobile screens) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg shadow-slate-900/10">
        {role === 'aluno' ? (
          <>
            <div className="flex flex-col items-center gap-0.5 text-indigo-600 font-bold text-[10px]">
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span>Meu Treino</span>
            </div>

            <button
              onClick={handleAttemptInstructorAccess}
              className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
            >
              <div className="p-1.5 rounded-xl text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <span>Instrutor</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-red-500 text-[10px] cursor-pointer"
            >
              <div className="p-1.5 rounded-xl text-slate-400">
                <LogOut className="w-5 h-5" />
              </div>
              <span>Sair</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setInstructorSubView('manage')}
              className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer ${
                instructorSubView === 'manage' ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${instructorSubView === 'manage' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span>Gestão</span>
            </button>

            <button
              onClick={() => setInstructorSubView('preview')}
              className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer ${
                instructorSubView === 'preview' ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${instructorSubView === 'preview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>
                <UserIcon className="w-5 h-5" />
              </div>
              <span>Prévia Aluno</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-red-500 text-[10px] cursor-pointer"
            >
              <div className="p-1.5 rounded-xl text-slate-400">
                <LogOut className="w-5 h-5" />
              </div>
              <span>Sair</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

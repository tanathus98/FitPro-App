import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Dumbbell,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  X,
  Phone,
  Target,
  Award,
  Sparkles,
  FileText
} from 'lucide-react';
import { Instructor, UserRole } from '../types';
import { registerInstructor, registerStudent, signIn, resetPassword } from '../services/authService';
import { validatePassword, PASSWORD_HINT } from '../utils/passwordValidation';

interface LoginScreenProps {
  instructors: Instructor[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ instructors }) => {
  // Main view mode: 'login' or 'cadastro'
  const [mode, setMode] = useState<'login' | 'cadastro'>('login');

  // Role selection: 'aluno' | 'instrutor'
  const [activeRole, setActiveRole] = useState<UserRole>('aluno');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [forgotError, setForgotError] = useState('');

  // Student Registration Form states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentInstructorId, setStudentInstructorId] = useState<string>(instructors[0]?.id || '');
  const [studentGoal, setStudentGoal] = useState('Hipertrofia & Ganho de Massa');
  const [studentLevel, setStudentLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [studentWeight, setStudentWeight] = useState(72);
  const [studentHeight, setStudentHeight] = useState(175);
  const [studentNotes, setStudentNotes] = useState('');
  const [studentConsent, setStudentConsent] = useState(false);

  // Instructor Registration Form states
  const [instructorName, setInstructorName] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('');
  const [instructorPassword, setInstructorPassword] = useState('');
  const [instructorCref, setInstructorCref] = useState('');
  const [instructorSpecialty, setInstructorSpecialty] = useState('Personal Trainer & Musculação');
  const [instructorConsent, setInstructorConsent] = useState(false);

  // Success Feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // --- Handlers: Login (mesmo fluxo para aluno e instrutor — o Firebase Auth
  // valida a senha; o App descobre o papel do usuário depois de autenticado) ---
  const friendlyAuthError = (err: any): string => {
    switch (err?.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um momento e tente novamente.';
      case 'auth/email-already-in-use':
        return 'Já existe uma conta com esse e-mail.';
      case 'auth/weak-password':
        return 'A senha precisa ter pelo menos 6 caracteres.';
      default:
        return err?.message || 'Ocorreu um erro. Tente novamente.';
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Informe e-mail e senha para entrar.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await signIn(loginEmail, loginPassword);
      // Ao autenticar com sucesso, o listener de auth no App.tsx assume
      // automaticamente e leva o usuário para a tela correta.
    } catch (err: any) {
      setLoginError(friendlyAuthError(err));
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Informe o e-mail da sua conta.');
      return;
    }
    setForgotStatus('sending');
    try {
      await resetPassword(forgotEmail);
      setForgotStatus('sent');
    } catch (err: any) {
      setForgotStatus('idle');
      setForgotError(friendlyAuthError(err));
    }
  };

  // --- Handlers: Registration (cria a conta REAL no Firebase Auth + o perfil no Firestore) ---
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!studentName.trim()) {
      setLoginError('Por favor, informe o seu nome.');
      return;
    }
    if (!studentEmail.trim()) {
      setLoginError('Informe um e-mail válido para acessar sua conta.');
      return;
    }
    const studentPasswordError = validatePassword(studentPassword);
    if (studentPasswordError) {
      setLoginError(studentPasswordError);
      return;
    }
    if (!studentConsent) {
      setLoginError('É necessário concordar com o armazenamento dos seus dados para continuar.');
      return;
    }
    const targetInstructorId = studentInstructorId || instructors[0]?.id || '';
    if (!targetInstructorId) {
      setLoginError('Ainda não há nenhum professor cadastrado para você escolher. Peça para um professor se cadastrar primeiro.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await registerStudent(studentEmail, studentPassword, {
        name: studentName.trim(),
        phone: studentPhone.trim() || '(11) 99999-0000',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 800)}?w=200&auto=format&fit=crop&q=80`,
        goal: studentGoal,
        level: studentLevel,
        weightKg: Number(studentWeight) || 70,
        heightCm: Number(studentHeight) || 170,
        notes: studentNotes.trim(),
        instructorId: targetInstructorId,
        joinedDate: new Date().toISOString().split('T')[0],
        monthlyFee: 160,
        dueDay: 10,
        paymentStatus: 'em_dia',
        lastPaymentDate: new Date().toISOString().split('T')[0],
      });
      showNotification(`Conta criada com sucesso! Enviamos um link de confirmação para ${studentEmail.trim()} — confirme para liberar o acesso.`);
      // O listener de auth no App.tsx detecta a nova sessão automaticamente.
    } catch (err: any) {
      setLoginError(friendlyAuthError(err));
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegisterInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!instructorName.trim()) {
      setLoginError('Por favor, informe o seu nome de instrutor.');
      return;
    }
    if (!instructorEmail.trim()) {
      setLoginError('Informe um e-mail válido para acessar sua conta.');
      return;
    }
    const instructorPasswordError = validatePassword(instructorPassword);
    if (instructorPasswordError) {
      setLoginError(instructorPasswordError);
      return;
    }
    if (!instructorConsent) {
      setLoginError('É necessário concordar com os termos de tratamento de dados dos alunos para continuar.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await registerInstructor(instructorEmail, instructorPassword, {
        name: instructorName.trim(),
        cref: instructorCref.trim() || `${Math.floor(10000 + Math.random() * 90000)}-G/SP`,
        specialty: instructorSpecialty.trim() || 'Personal Trainer & Musculação',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 600)}?w=200&auto=format&fit=crop&q=80`,
      });
      showNotification(`Professor ${instructorName.trim()} cadastrado com sucesso! Enviamos um link de confirmação para ${instructorEmail.trim()} — confirme para liberar o acesso.`);
      // O listener de auth no App.tsx detecta a nova sessão automaticamente.
    } catch (err: any) {
      setLoginError(friendlyAuthError(err));
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      {/* Toast alert */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-200 mb-3">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            FitPro Treinos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Plataforma para professores e alunos com fichas de treinos personalizadas e isolamento de turmas
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Top Level Mode Tabs: [Entrar / Login] vs [Criar Conta / Cadastro] */}
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-100/70 p-1.5 gap-1.5">
            <button
              id="mode-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Já tenho conta (Entrar)</span>
            </button>

            <button
              id="mode-tab-cadastro"
              type="button"
              onClick={() => {
                setMode('cadastro');
                setLoginError('');
              }}
              className={`py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'cadastro'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta (Cadastro)</span>
            </button>
          </div>

          {/* Sub Role Tabs: [Aluno] vs [Instrutor / Personal] */}
          <div className="px-5 pt-4 pb-2 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {mode === 'login' ? 'Escolha seu tipo de acesso:' : 'Escolha seu perfil de cadastro:'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl">
              <button
                id="role-tab-aluno"
                type="button"
                onClick={() => {
                  setActiveRole('aluno');
                  setLoginError('');
                }}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeRole === 'aluno'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Aluno</span>
              </button>

              <button
                id="role-tab-instrutor"
                type="button"
                onClick={() => {
                  setActiveRole('instrutor');
                  setLoginError('');
                }}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeRole === 'instrutor'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Instrutor / Personal</span>
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {loginError && (
              <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{loginError}</p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 1: LOGIN (ALUNO OU INSTRUTOR)                                        */}
            {/* ========================================================================= */}
            {mode === 'login' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {activeRole === 'aluno' ? 'Acesso Individual & Ficha Exclusiva' : 'Acesso do Professor / Personal'}
                    </span>
                    <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
                      {activeRole === 'aluno'
                        ? 'Cada aluno visualiza apenas a sua própria ficha, com senha protegida pelo Firebase Authentication.'
                        : 'Gerencie sua turma com segurança: sua conta é protegida por e-mail e senha reais.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {activeRole === 'aluno' ? 'E-mail do Aluno' : 'E-mail do Professor'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Senha de Acesso
                      </label>
                      <button
                        type="button"
                        id="btn-open-forgot-password"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setForgotError('');
                          setForgotStatus('idle');
                          setShowForgotPassword(true);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="login-password-input"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isSubmittingAuth ? 'Entrando...' : 'Entrar'}</span>
                    {!isSubmittingAuth && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: CADASTRO (CRIAR CONTA DE ALUNO OU INSTRUTOR)                      */}
            {/* ========================================================================= */}
            {mode === 'cadastro' && (
              <>
                {activeRole === 'aluno' ? (
                  /* REGISTRO DE ALUNO */
                  <form onSubmit={handleRegisterStudent} className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Cadastre-se e Inicie seu Treino</span>
                        <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
                          Ao criar sua conta, uma ficha personalizada é gerada imediatamente com acompanhamento do seu professor escolhido.
                        </p>
                      </div>
                    </div>

                    {/* Nome Completo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        id="register-student-name"
                        type="text"
                        required
                        placeholder="Ex: Pedro Henrique Souza"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Email & Telefone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          E-mail de Acesso *
                        </label>
                        <input
                          id="register-student-email"
                          type="email"
                          required
                          placeholder="pedro.souza@gmail.com"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Senha de Acesso *
                        </label>
                        <input
                          id="register-student-password"
                          type="password"
                          required
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">{PASSWORD_HINT}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp / Telefone
                      </label>
                      <input
                        id="register-student-phone"
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Escolha do Professor Responsável */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Escolha seu Professor Responsável *
                      </label>
                      <select
                        id="register-student-instructor-select"
                        value={studentInstructorId}
                        onChange={(e) => setStudentInstructorId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {instructors.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({inst.specialty})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Sua ficha e evolução serão avaliadas diretamente por este professor.
                      </span>
                    </div>

                    {/* Objetivo e Nível */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Objetivo Principal
                        </label>
                        <select
                          id="register-student-goal"
                          value={studentGoal}
                          onChange={(e) => setStudentGoal(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        >
                          <option value="Hipertrofia & Ganho de Massa">Hipertrofia & Ganho de Massa</option>
                          <option value="Definição & Queima de Gordura">Definição & Queima de Gordura</option>
                          <option value="Condicionamento Físico & Saúde">Condicionamento Físico & Saúde</option>
                          <option value="Ganho de Força & Performance">Ganho de Força & Performance</option>
                          <option value="Reabilitação & Postura">Reabilitação & Postura</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nível de Treino
                        </label>
                        <select
                          id="register-student-level"
                          value={studentLevel}
                          onChange={(e) => setStudentLevel(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        >
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </div>
                    </div>

                    {/* Peso e Altura */}
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">Biometria do Aluno</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Peso Atual (kg)
                          </label>
                          <input
                            id="register-student-weight"
                            type="number"
                            step="0.5"
                            value={studentWeight}
                            onChange={(e) => setStudentWeight(Number(e.target.value))}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Altura (cm)
                          </label>
                          <input
                            id="register-student-height"
                            type="number"
                            value={studentHeight}
                            onChange={(e) => setStudentHeight(Number(e.target.value))}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observações / Restrições */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Histórico / Dores ou Restrições (Opcional)
                      </label>
                      <input
                        id="register-student-notes"
                        type="text"
                        placeholder="Ex: Dor eventual no ombro direito, sem lesões cirúrgicas"
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    {/* Consentimento LGPD */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        id="register-student-consent"
                        type="checkbox"
                        checked={studentConsent}
                        onChange={(e) => setStudentConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-600 leading-relaxed">
                        Autorizo o armazenamento dos meus dados (incluindo peso, altura e histórico de saúde) para
                        montagem da minha ficha de treino, visíveis apenas para mim e para o meu professor responsável.
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      id="btn-register-student-submit"
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmittingAuth ? 'Criando conta...' : 'Concluir Cadastro de Aluno & Entrar'}</span>
                    </button>
                  </form>
                ) : (
                  /* REGISTRO DE INSTRUTOR / PERSONAL */
                  <form onSubmit={handleRegisterInstructor} className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Cadastre-se como Professor / Personal</span>
                        <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
                          Gerencie seus próprios alunos com painel financeiro exclusivo, prescrição de treinos e avaliações de vídeo.
                        </p>
                      </div>
                    </div>

                    {/* Nome do Professor */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo do Professor *
                      </label>
                      <input
                        id="register-instructor-name"
                        type="text"
                        required
                        placeholder="Ex: Prof. Fernando Albuquerque"
                        value={instructorName}
                        onChange={(e) => setInstructorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {/* E-mail */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail Profissional *
                      </label>
                      <input
                        id="register-instructor-email"
                        type="email"
                        required
                        placeholder="Ex: fernando.personal@academia.com"
                        value={instructorEmail}
                        onChange={(e) => setInstructorEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Senha */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Senha de Acesso *
                      </label>
                      <input
                        id="register-instructor-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={instructorPassword}
                        onChange={(e) => setInstructorPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">{PASSWORD_HINT}</p>
                    </div>

                    {/* CREF */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registro CREF (Opcional)
                      </label>
                      <input
                        id="register-instructor-cref"
                        type="text"
                        placeholder="Ex: 062841-G/SP (deixe em branco se não tiver)"
                        value={instructorCref}
                        onChange={(e) => setInstructorCref(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Não é personal certificado? Sem problema, pode deixar em branco.
                      </span>
                    </div>

                    {/* Especialidade / Metodologia */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Especialidade / Foco de Atuação
                      </label>
                      <input
                        id="register-instructor-specialty"
                        type="text"
                        placeholder="Ex: Musculação, Condicionamento e Emagrecimento"
                        value={instructorSpecialty}
                        onChange={(e) => setInstructorSpecialty(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Consentimento LGPD */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        id="register-instructor-consent"
                        type="checkbox"
                        checked={instructorConsent}
                        onChange={(e) => setInstructorConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-600 leading-relaxed">
                        Estou ciente de que serei responsável pelo tratamento adequado dos dados de saúde e pessoais
                        dos meus alunos cadastrados na plataforma, em conformidade com a LGPD.
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      id="btn-register-instructor-submit"
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmittingAuth ? 'Criando conta...' : 'Cadastrar Professor & Acessar Meu Painel'}</span>
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>

        {/* Security Footer Note */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>FitPro • Separação completa de fichas e turmas por professor</span>
        </p>
      </div>

      {/* Modal: Esqueci minha senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recuperar Senha</h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {forgotStatus === 'sent' ? (
                <div className="text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm text-slate-700">
                    Enviamos um link de redefinição de senha para <strong>{forgotEmail}</strong>. Confira sua caixa de entrada (e o spam).
                  </p>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Informe o e-mail usado na sua conta. Enviaremos um link para você criar uma nova senha.
                  </p>
                  {forgotError && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p>{forgotError}</p>
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotStatus === 'sending'}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs transition cursor-pointer"
                  >
                    {forgotStatus === 'sending' ? 'Enviando...' : 'Enviar link de redefinição'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

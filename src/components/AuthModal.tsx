import React, { useState } from 'react';
import { User, ShieldCheck, Dumbbell, ArrowRight, X } from 'lucide-react';
import { Instructor, Student, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  students: Student[];
  instructor: Instructor;
  onSelectRoleAndUser: (role: UserRole, userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  students,
  instructor,
  onSelectRoleAndUser,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'instrutor') {
      onSelectRoleAndUser('instrutor', instructor.id);
    } else {
      const found = students.find((s) => s.email.toLowerCase() === email.toLowerCase()) || students[0];
      onSelectRoleAndUser('aluno', found.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Login & Seleção de Perfil</h3>
              <p className="text-[11px] text-slate-500">Acesse como Aluno ou Instrutor</p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Tab Switcher: Aluno vs Instrutor */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl">
            <button
              id="auth-tab-aluno"
              onClick={() => setActiveTab('aluno')}
              className={`py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'aluno'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Aba Aluno</span>
            </button>
            <button
              id="auth-tab-instrutor"
              onClick={() => setActiveTab('instrutor')}
              className={`py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'instrutor'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Aba Instrutor</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 text-xs">
          {activeTab === 'aluno' ? (
            /* Student Section */
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Acesso Rápido - Alunos Cadastrados:
                </span>
                <div className="space-y-2">
                  {students.map((stud) => (
                    <button
                      key={stud.id}
                      id={`login-as-student-${stud.id}`}
                      onClick={() => {
                        onSelectRoleAndUser('aluno', stud.id);
                        onClose();
                      }}
                      className="w-full bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 p-3 rounded-2xl transition flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={stud.avatar}
                          alt={stud.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {stud.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{stud.goal} • {stud.level}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-[10px] uppercase text-slate-400"><span className="bg-white px-2">Ou com e-mail do aluno</span></div>
              </div>

              <form onSubmit={handleCustomLogin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail de aluno"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  id="submit-student-login"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Entrar como Aluno
                </button>
              </form>
            </div>
          ) : (
            /* Instructor Section */
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Acesso do Professor / Personal:
                </span>
                <button
                  id={`login-as-instructor-${instructor.id}`}
                  onClick={() => {
                    onSelectRoleAndUser('instrutor', instructor.id);
                    onClose();
                  }}
                  className="w-full bg-slate-50 hover:bg-indigo-50/50 border border-indigo-200 p-4 rounded-2xl transition flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={instructor.avatar}
                      alt={instructor.name}
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {instructor.name}
                        </h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono border border-indigo-100">
                          CREF {instructor.cref}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{instructor.specialty}</p>
                      <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                        Cadastrar & Editar fichas de treino
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-600 transition transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                O perfil de instrutor possui autorização para criar novos alunos, montar as divisões semanais (A, B, C, D) e vincular mini vídeos explicativos para cada movimento.
              </div>

              <button
                type="button"
                id="enter-instructor-btn"
                onClick={() => {
                  onSelectRoleAndUser('instrutor', instructor.id);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar no Painel do Instrutor</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

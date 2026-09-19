import React from 'react';
import { User, ShieldCheck, LogOut, Lock } from 'lucide-react';
import { Instructor, Student, UserRole } from '../types';

interface AppHeaderProps {
  currentRole: UserRole;
  currentStudent?: Student;
  // Ausente para aluno autônomo (sem professor vinculado) ou enquanto a
  // lista de professores ainda está carregando.
  instructor?: Instructor;
  allInstructors?: Instructor[];
  onSwitchInstructor?: (instructorId: string) => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRole,
  currentStudent,
  instructor,
  allInstructors = [],
  onSwitchInstructor,
  onLogout,
}) => {
  return (
    <header className="h-16 sm:h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* User Greeting & Status */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="sm:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
          F
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[180px] xs:max-w-[220px] sm:max-w-none">
            {currentRole === 'aluno' && currentStudent
              ? `Olá, ${currentStudent.name}`
              : `Painel do ${instructor?.name ?? 'Professor'}`}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 flex-wrap truncate">
            {currentRole === 'aluno' ? (
              <>
                <span className="flex items-center gap-1 text-slate-600">
                  <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">Ficha Exclusiva</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-indigo-600 font-semibold hidden xs:inline">
                  {instructor?.name ? `Prof. ${instructor.name.split(' ')[0]}` : 'Treino autônomo'}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-slate-600">
                  <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                  Área do Professor
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-slate-500 hidden xs:inline">CREF: {instructor?.cref}</span>
              </>
            )}
          </p>
        </div>
      </div>

        {/* Right Controls: Role Badge, Quick Switcher & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {currentRole === 'aluno' ? (
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50/80 px-3.5 py-1.5 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-700">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Área do Aluno</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {allInstructors.length > 1 && onSwitchInstructor && (
                <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Trocar Prof:</span>
                  <select
                    id="header-instructor-switcher"
                    value={instructor?.id ?? ''}
                    onChange={(e) => onSwitchInstructor(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {allInstructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 bg-indigo-50/80 px-3.5 py-1.5 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Modo Instrutor</span>
              </div>
            </div>
          )}

        {/* Logout / Switch Account Button */}
        <button
          id="logout-btn"
          onClick={onLogout}
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Sair da conta atual"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-red-600" />
          <span className="hidden sm:inline">Sair da Conta</span>
          <span className="sm:hidden text-[11px]">Sair</span>
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { KeyRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { validatePassword, PASSWORD_HINT } from '../utils/passwordValidation';

interface SetOwnPasswordScreenProps {
  studentName?: string;
  onSubmit: (newPassword: string) => Promise<void>;
  onLogout: () => void;
}

export const SetOwnPasswordScreen: React.FC<SetOwnPasswordScreenProps> = ({
  studentName,
  onSubmit,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(newPassword);
    } catch (err: any) {
      setError(
        err?.code === 'auth/requires-recent-login'
          ? 'Por segurança, saia e entre novamente antes de definir sua senha.'
          : 'Não foi possível salvar a nova senha agora. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {studentName ? `Bem-vindo(a), ${studentName.split(' ')[0]}!` : 'Defina sua senha'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sua conta foi criada pelo seu professor com uma senha temporária. Antes de continuar,
            defina uma senha só sua.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="set-own-password-input"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{PASSWORD_HINT}</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Confirmar Nova Senha
            </label>
            <input
              id="set-own-password-confirm-input"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            id="set-own-password-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar e Continuar'}
          </button>

          <button
            id="set-own-password-logout-btn"
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-2 text-slate-400 hover:text-slate-600 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </form>
      </div>
    </div>
  );
};

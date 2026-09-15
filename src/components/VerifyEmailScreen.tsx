import React, { useState } from 'react';
import { MailCheck, RefreshCw, LogOut, Send } from 'lucide-react';

interface VerifyEmailScreenProps {
  email: string | null;
  onResend: () => Promise<void>;
  /** Deve retornar `true` se, após recarregar, a conta já estiver verificada. */
  onCheckAgain: () => Promise<boolean>;
  onLogout: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  email,
  onResend,
  onCheckAgain,
  onLogout,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async () => {
    if (isSending) return;
    setIsSending(true);
    setMessage(null);
    try {
      await onResend();
      setMessage({
        type: 'success',
        text: 'E-mail de confirmação reenviado! Confira sua caixa de entrada (e o spam).',
      });
    } catch (err: any) {
      const isRateLimited = err?.code === 'auth/too-many-requests';
      setMessage({
        type: 'error',
        text: isRateLimited
          ? 'Você já pediu o reenvio há pouco tempo. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível reenviar o e-mail agora. Tente novamente em instantes.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckAgain = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setMessage(null);
    try {
      const verified = await onCheckAgain();
      if (!verified) {
        setMessage({
          type: 'error',
          text: 'Ainda não identificamos a confirmação. Clique no link do e-mail e tente novamente.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível verificar agora. Tente novamente.' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
          <MailCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Confirme seu e-mail</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Enviamos um link de confirmação para{' '}
            <strong className="text-slate-700">{email || 'o seu e-mail'}</strong>. Abra a mensagem e
            clique no link para ativar sua conta antes de continuar.
          </p>
        </div>

        {message && (
          <p
            className={`text-[11px] font-semibold px-3 py-2 rounded-xl border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="space-y-2">
          <button
            id="verify-email-check-again-btn"
            type="button"
            onClick={handleCheckAgain}
            disabled={isChecking}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Já confirmei, verificar novamente'}
          </button>
          <button
            id="verify-email-resend-btn"
            type="button"
            onClick={handleResend}
            disabled={isSending}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
          </button>
          <button
            id="verify-email-logout-btn"
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-2 text-slate-400 hover:text-slate-600 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3 h-3" /> Sair e usar outra conta
          </button>
        </div>
      </div>
    </div>
  );
};

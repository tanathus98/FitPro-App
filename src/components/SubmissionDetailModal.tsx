import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Send, 
  AlertTriangle,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { ExecutionSubmission, InstructorFeedback, UserRole } from '../types';

interface SubmissionDetailModalProps {
  submission: ExecutionSubmission;
  userRole: UserRole;
  instructorName?: string;
  onClose: () => void;
  onUpdateFeedback?: (submissionId: string, feedback: InstructorFeedback) => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  userRole,
  instructorName = 'Prof. Carlos Silva',
  onClose,
  onUpdateFeedback,
}) => {
  const [rating, setRating] = useState<number>(submission.feedback?.rating || 5);
  const [verdict, setVerdict] = useState<'excelente' | 'bom_ajustar' | 'atencao'>(
    submission.feedback?.statusVerdict || 'excelente'
  );
  const [feedbackText, setFeedbackText] = useState(submission.feedback?.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !onUpdateFeedback) return;

    setIsSaving(true);
    const feedback: InstructorFeedback = {
      rating,
      statusVerdict: verdict,
      text: feedbackText.trim(),
      reviewedAt: new Date().toISOString(),
      instructorName,
    };

    setTimeout(() => {
      onUpdateFeedback(submission.id, feedback);
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="submission-detail-modal-container"
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {submission.exerciseMuscleGroup || 'Exercício'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  submission.status === 'reviewed' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {submission.status === 'reviewed' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Avaliado pelo Professor</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Aguardando Avaliação</span>
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{submission.exerciseName}</h2>
            </div>
          </div>
          <button
            id="close-submission-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Video Player Area */}
          <div className="space-y-2">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center">
              <video
                ref={videoRef}
                src={submission.videoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Video utility controls */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleRestart}
                className="text-xs text-slate-500 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar vídeo</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Velocidade:</span>
                </span>
                {[0.5, 0.75, 1.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === 0.5 ? '0.5x (Câmera Lenta)' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Info Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Aluno</span>
              <span className="font-bold text-slate-900">{submission.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Carga Utilizada</span>
              <span className="font-bold text-indigo-600">{submission.weightUsed || 'Não informada'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Reps Executadas</span>
              <span className="font-bold text-slate-900">{submission.repsDone || 'Série completa'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Data de Envio</span>
              <span className="font-bold text-slate-900">
                {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Student's Note */}
          {submission.studentNotes && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Dúvida / Observação do Aluno:
              </span>
              <p className="text-indigo-950 leading-relaxed font-medium">
                "{submission.studentNotes}"
              </p>
            </div>
          )}

          {/* Instructor Evaluation / Feedback Section */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Avaliação Técnica do Instrutor</span>
            </h3>

            {userRole === 'instrutor' ? (
              /* Instructor Form to Submit Feedback */
              <form onSubmit={handleSaveFeedback} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Rating Stars */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nota da Execução Técnica:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer text-amber-400"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {rating === 5 ? 'Execução Impecável' : rating >= 4 ? 'Muito Boa' : rating >= 3 ? 'Regular / Ajustes' : 'Necessita Correção'}
                    </span>
                  </div>
                </div>

                {/* Verdict badges */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Diagnóstico Rápido:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { key: 'excelente', label: 'Execução Excelente', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                      { key: 'bom_ajustar', label: 'Boa com Pequenos Ajustes', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                      { key: 'atencao', label: 'Atenção na Postura / Carga', color: 'bg-amber-100 text-amber-800 border-amber-300' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setVerdict(item.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          verdict === item.key ? `${item.color} font-bold shadow-xs` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Written Feedback Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Feedback Detalhado & Orientações para o Aluno:
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ex: Excelente cadência na descida! Apenas certifique-se de não hiperestender os joelhos no final do movimento e mantenha o abdômen travado..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 transition resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    id="save-instructor-feedback-btn"
                    type="submit"
                    disabled={isSaving || !feedbackText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar e Enviar Feedback'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Student View of Instructor's Feedback */
              submission.feedback ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= submission.feedback!.rating ? 'fill-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-emerald-900">
                        {submission.feedback.statusVerdict === 'excelente'
                          ? 'Execução Excelente'
                          : submission.feedback.statusVerdict === 'bom_ajustar'
                          ? 'Boa com Pequenos Ajustes'
                          : 'Atenção na Postura'}
                      </span>
                    </div>

                    <span className="text-[11px] text-emerald-700">
                      Avaliado por {submission.feedback.instructorName} em{' '}
                      {new Date(submission.feedback.reviewedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <p className="font-medium">{submission.feedback.text}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Aguardando Avaliação do Instrutor</span>
                    <p className="text-amber-800 mt-0.5">
                      Seu vídeo já foi enviado para o professor. Assim que ele assistir e fizer as anotações, a avaliação detalhada e os ajustes posturais aparecerão aqui.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

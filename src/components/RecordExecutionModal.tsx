import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Video, 
  Camera, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Play, 
  Pause, 
  Sparkles, 
  ArrowRight,
  SwitchCamera,
  Film
} from 'lucide-react';
import { DayOfWeek, Exercise, ExecutionSubmission, Student } from '../types';
import { uploadExecutionVideo } from '../services/dataService';

interface RecordExecutionModalProps {
  exercise: Exercise;
  student: Student;
  dayOfWeek: DayOfWeek;
  onClose: () => void;
  onSubmit: (submission: ExecutionSubmission) => void;
}

export const RecordExecutionModal: React.FC<RecordExecutionModalProps> = ({
  exercise,
  student,
  dayOfWeek,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Submission details
  const [weightUsed, setWeightUsed] = useState(exercise.suggestedWeight || '');
  const [repsDone, setRepsDone] = useState(exercise.reps || '');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // References
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guarda o arquivo/blob REAL a ser enviado ao Storage. `recordedVideoUrl`
  // é usado só para o preview local (player de revisão) e não deve ser
  // salvo como valor final no banco de dados quando for um blob: local.
  const recordedFileRef = useRef<Blob | File | null>(null);
  const isDemoVideoRef = useRef(false);

  // Initialize camera stream when in camera mode and no recorded video
  useEffect(() => {
    if (mode === 'camera' && !recordedVideoUrl) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [mode, recordedVideoUrl, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta gravação direta de vídeo. Use o envio de arquivo.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera ou microfone negada. Você pode autorizar no navegador ou fazer upload de um vídeo gravado do seu celular.'
          : 'Não foi possível acessar a câmera. Utilize a opção de enviar arquivo de vídeo gravado.'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const startRecordingFlow = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    // 3 seconds countdown
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          beginActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginActualRecording = () => {
    if (!mediaStreamRef.current) return;

    try {
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        recordedFileRef.current = blob;
        isDemoVideoRef.current = false;
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setIsRecording(false);
        stopCamera();
      };

      recorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            // auto stop after 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      setCameraError('Erro ao iniciar gravador de vídeo. Tente fazer upload de um vídeo.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    recordedFileRef.current = file;
    isDemoVideoRef.current = false;
    const fileUrl = URL.createObjectURL(file);
    setRecordedVideoUrl(fileUrl);
    stopCamera();
  };

  const handleUseDemoVideo = () => {
    // Allows instant demo without webcam hardware. Já é uma URL pública e
    // permanente, então não precisa (nem deve) passar pelo upload.
    const sampleUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    recordedFileRef.current = null;
    isDemoVideoRef.current = true;
    setRecordedVideoUrl(sampleUrl);
    stopCamera();
  };

  const handleRetake = () => {
    if (recordedVideoUrl && recordedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    recordedFileRef.current = null;
    isDemoVideoRef.current = false;
    setSubmitError(null);
    setUploadProgress(null);
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordedVideoUrl) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const submissionId = `sub_${Date.now()}`;

    try {
      // Se o vídeo veio da câmera ou de upload de arquivo, ele ainda está
      // apenas em memória local (blob:...). Precisamos enviá-lo de fato
      // para o Firebase Storage antes de notificar o professor — só assim
      // a URL salva será acessível de qualquer dispositivo.
      let finalVideoUrl = recordedVideoUrl;
      if (recordedFileRef.current && !isDemoVideoRef.current) {
        setUploadProgress(0);
        finalVideoUrl = await uploadExecutionVideo(
          student.id,
          submissionId,
          recordedFileRef.current,
          (percent) => setUploadProgress(percent)
        );
      }

      const submission: ExecutionSubmission = {
        id: submissionId,
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatar,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseMuscleGroup: exercise.muscleGroup,
        dayOfWeek,
        videoUrl: finalVideoUrl,
        videoDurationSeconds: recordingSeconds > 0 ? recordingSeconds : 15,
        weightUsed: weightUsed.trim() || undefined,
        repsDone: repsDone.trim() || undefined,
        studentNotes: studentNotes.trim() || undefined,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      onSubmit(submission);
      setIsSubmitting(false);
      setUploadProgress(null);
      onClose();
    } catch (err) {
      console.error('Erro ao enviar vídeo de execução:', err);
      setIsSubmitting(false);
      setUploadProgress(null);
      setSubmitError(
        'Não foi possível enviar o vídeo. Verifique sua conexão com a internet e tente novamente.'
      );
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="record-execution-modal-container"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {exercise.muscleGroup}
                </span>
                <span className="text-xs text-slate-500">Enviar para Avaliação</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{exercise.name}</h2>
            </div>
          </div>
          <button
            id="close-record-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Target Parameters reference */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
            <div>
              <span className="text-slate-400 block text-[11px]">Séries & Reps Alvo</span>
              <span className="font-bold text-slate-900">{exercise.sets} séries × {exercise.reps}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Carga Sugerida</span>
              <span className="font-bold text-indigo-600">{exercise.suggestedWeight || 'Livre'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Descanso</span>
              <span className="font-bold text-slate-900">{exercise.restSeconds}s</span>
            </div>
          </div>

          {/* Video Recording / Upload Stage */}
          {!recordedVideoUrl ? (
            <div className="space-y-3">
              {/* Method Switcher Tabs */}
              <div className="flex items-center justify-between">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('camera');
                      setCameraError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mode === 'camera' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Gravar com Câmera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('upload');
                      stopCamera();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mode === 'upload' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar Arquivo</span>
                  </button>
                </div>

                {mode === 'camera' && !isRecording && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="px-2.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Alternar câmera frontal/traseira"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Trocar Câmera</span>
                  </button>
                )}
              </div>

              {/* Camera Viewport */}
              {mode === 'camera' && (
                <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-6 text-center text-white max-w-md space-y-3">
                      <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setMode('upload')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Carregar Vídeo do Aparelho
                        </button>
                        <button
                          type="button"
                          onClick={handleUseDemoVideo}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Usar Vídeo Demo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />

                      {/* Countdown Overlay */}
                      {countdown !== null && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-6xl font-black text-white animate-ping">
                            {countdown}
                          </span>
                        </div>
                      )}

                      {/* Recording status banner */}
                      {isRecording && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/40 text-white text-xs font-mono font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span>GRAVANDO: {formatSeconds(recordingSeconds)}</span>
                        </div>
                      )}

                      {/* Floating Control Bar */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                        {!isRecording ? (
                          <button
                            id="start-recording-btn"
                            type="button"
                            onClick={startRecordingFlow}
                            className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-white" />
                            <span>Iniciar Gravação (com 3s)</span>
                          </button>
                        ) : (
                          <button
                            id="stop-recording-btn"
                            type="button"
                            onClick={stopRecording}
                            className="px-6 py-3 rounded-full bg-slate-900/90 hover:bg-slate-950 text-white font-bold text-xs sm:text-sm shadow-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer active:scale-95"
                          >
                            <div className="w-3.5 h-3.5 bg-red-500 rounded-xs" />
                            <span>Parar e Revisar Vídeo</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Upload Viewport */}
              {mode === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    Selecione ou solte o vídeo do seu treino
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Formatos aceitos: MP4, MOV, WebM gravados pelo seu smartphone ou computador.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseDemoVideo();
                    }}
                    className="mt-4 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Usar vídeo de teste demonstrativo</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Video Review Stage */
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
                <video
                  ref={reviewVideoRef}
                  src={recordedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-900 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Vídeo pronto para avaliação do professor!</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gravar Outro</span>
                </button>
              </div>

              {/* Execution Details Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Carga Utilizada
                    </label>
                    <input
                      type="text"
                      value={weightUsed}
                      onChange={(e) => setWeightUsed(e.target.value)}
                      placeholder="ex: 20kg cada lado"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reps Realizadas
                    </label>
                    <input
                      type="text"
                      value={repsDone}
                      onChange={(e) => setRepsDone(e.target.value)}
                      placeholder="ex: 10 reps com cadência 3-1"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dúvida ou Observação para o Professor (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="Ex: Senti que na 8ª repetição o ombro direito deu uma leve pinçada. Minha postura na descida está correta?"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-2.5 text-indigo-900 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    O professor receberá este vídeo diretamente no painel de instrutor dele, onde avaliará sua postura, amplitude e cadência e enviará um feedback detalhado!
                  </p>
                </div>

                {/* Upload progress */}
                {isSubmitting && uploadProgress !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Enviando vídeo...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                        style={{ width: `${Math.max(4, uploadProgress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit error */}
                {submitError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    id="submit-execution-video-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting
                        ? uploadProgress !== null
                          ? `Enviando... ${Math.round(uploadProgress)}%`
                          : 'Enviando...'
                        : 'Enviar para o Instrutor'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

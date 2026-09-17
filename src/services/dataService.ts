import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  Instructor,
  Student,
  WorkoutPlan,
  ExecutionSubmission,
  InstructorFeedback,
  CardioLog,
  DayProgress,
  BodyMeasurement,
  CustomExercise,
  JoinRequest,
} from '../types';

/**
 * Remove campos com valor `undefined` de um objeto antes de gravar no
 * Firestore. O SDK do Firestore rejeita `setDoc`/`updateDoc` caso qualquer
 * campo do payload seja explicitamente `undefined` (lança "Function setDoc()
 * called with invalid data. Unsupported field value: undefined") — o que
 * acontece com frequência quando um campo opcional do formulário (ex:
 * cintura, observações, % de gordura) fica em branco. Aplicado aqui, de
 * forma centralizada, em toda escrita desta camada, para não depender de
 * cada tela lembrar de tratar isso individualmente.
 */
export function cleanForFirestore<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) cleaned[key] = value;
  });
  return cleaned as T;
}

/* ------------------------------------------------------------------ */
/* Instrutores — diretório público (leitura liberada, escrita própria) */
/* ------------------------------------------------------------------ */

export function subscribeInstructors(cb: (list: Instructor[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'instructors'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Instructor), id: d.id })));
  });
}

export async function saveInstructor(instructor: Instructor) {
  await setDoc(doc(db, 'instructors', instructor.id), cleanForFirestore(instructor), { merge: true });
}

/* ------------------------------------------------------------------ */
/* Alunos                                                              */
/* ------------------------------------------------------------------ */

export function subscribeStudentsByInstructor(
  instructorId: string,
  cb: (list: Student[]) => void
): Unsubscribe {
  const q = query(collection(db, 'students'), where('instructorId', '==', instructorId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Student), id: d.id })));
  });
}

export function subscribeStudentById(
  studentId: string,
  cb: (student: Student | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'students', studentId), (snap) => {
    cb(snap.exists() ? { ...(snap.data() as Student), id: snap.id } : null);
  });
}

export async function saveStudent(student: Student) {
  await setDoc(doc(db, 'students', student.id), cleanForFirestore(student), { merge: true });
}

// Vincula um aluno autônomo a um professor (aceite de solicitação de
// vínculo) — atualização parcial, sem exigir o objeto Student inteiro.
export async function linkStudentToInstructor(studentId: string, instructorId: string) {
  await setDoc(doc(db, 'students', studentId), { instructorId }, { merge: true });
}

export async function deleteStudent(studentId: string) {
  // Apaga também os dados das subcoleções do aluno (fichas, submissões e
  // cardio) antes de remover o perfil, para não deixar dados órfãos.
  const subcollections = ['plans', 'submissions', 'cardioLogs', 'dayProgress', 'measurements', 'customExercises'];
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, 'students', studentId, sub));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(db, 'students', studentId));
}

/* ------------------------------------------------------------------ */
/* Planos de treino — subcoleção de cada aluno                        */
/* ------------------------------------------------------------------ */

export function subscribePlansForStudent(
  studentId: string,
  cb: (plans: Record<string, WorkoutPlan>) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'plans'), (snap) => {
    const plans: Record<string, WorkoutPlan> = {};
    snap.docs.forEach((d) => {
      plans[d.id] = { ...(d.data() as WorkoutPlan), id: d.id };
    });
    cb(plans);
  });
}

/** Assina os planos de vários alunos ao mesmo tempo e mescla tudo num único mapa. */
export function subscribePlansForStudents(
  studentIds: string[],
  cb: (plans: Record<string, WorkoutPlan>) => void
): Unsubscribe {
  const perStudent: Record<string, Record<string, WorkoutPlan>> = {};

  const emitMerged = () => {
    const all: Record<string, WorkoutPlan> = {};
    Object.values(perStudent).forEach((m) => Object.assign(all, m));
    cb(all);
  };

  const unsubs = studentIds.map((sid) =>
    onSnapshot(collection(db, 'students', sid, 'plans'), (snap) => {
      const plans: Record<string, WorkoutPlan> = {};
      snap.docs.forEach((d) => {
        plans[d.id] = { ...(d.data() as WorkoutPlan), id: d.id };
      });
      perStudent[sid] = plans;
      emitMerged();
    })
  );

  return () => unsubs.forEach((u) => u());
}

export async function savePlan(studentId: string, plan: WorkoutPlan) {
  await setDoc(doc(db, 'students', studentId, 'plans', plan.id), cleanForFirestore(plan), { merge: true });
}

/* ------------------------------------------------------------------ */
/* Submissões de execução — subcoleção de cada aluno                  */
/* (guardamos instructorId também no documento para permitir consulta */
/*  "todas as submissões dos meus alunos" via collectionGroup)        */
/* ------------------------------------------------------------------ */

export function subscribeSubmissionsForStudent(
  studentId: string,
  cb: (list: ExecutionSubmission[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'submissions'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as ExecutionSubmission), id: d.id })));
  });
}

export function subscribeSubmissionsForInstructor(
  instructorId: string,
  cb: (list: ExecutionSubmission[]) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'submissions'), where('instructorId', '==', instructorId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as ExecutionSubmission), id: d.id })));
  });
}

function guessVideoExtension(file: Blob): string {
  if (file.type.includes('mp4')) return 'mp4';
  if (file.type.includes('quicktime')) return 'mov';
  if (file.type.includes('webm')) return 'webm';
  return 'mp4';
}

/**
 * Faz upload de um arquivo/blob de vídeo para um caminho específico do
 * Firebase Storage e retorna a URL pública de download.
 *
 * IMPORTANTE: antes desta função existir, o app salvava apenas uma URL
 * local (blob:...) gerada por URL.createObjectURL(), que só existe na
 * memória do navegador que gerou o vídeo. Isso fazia o vídeo "sumir" para
 * quem abria o app em outro dispositivo/sessão, pois o arquivo nunca era
 * de fato enviado a um servidor — só uma referência local era salva.
 */
function uploadVideoToStorage(
  path: string,
  file: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'video/mp4',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      (error) => {
        console.error('[Storage] Falha ao enviar vídeo:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/** Vídeo de execução gravado/enviado pelo ALUNO, para avaliação do professor. */
export function uploadExecutionVideo(
  studentId: string,
  submissionId: string,
  file: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const extension = guessVideoExtension(file);
  return uploadVideoToStorage(
    `submissions/${studentId}/${submissionId}.${extension}`,
    file,
    onProgress
  );
}

/** Vídeo demonstrativo de um exercício, cadastrado pelo PROFESSOR. */
export function uploadExerciseVideo(
  instructorId: string,
  exerciseFileId: string,
  file: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const extension = guessVideoExtension(file);
  return uploadVideoToStorage(
    `exercise-videos/${instructorId}/${exerciseFileId}.${extension}`,
    file,
    onProgress
  );
}

export async function addSubmission(
  studentId: string,
  instructorId: string,
  submission: ExecutionSubmission
) {
  await setDoc(
    doc(db, 'students', studentId, 'submissions', submission.id),
    cleanForFirestore({ ...submission, instructorId })
  );
}

export async function updateSubmissionFeedback(
  studentId: string,
  submissionId: string,
  feedback: InstructorFeedback
) {
  await updateDoc(doc(db, 'students', studentId, 'submissions', submissionId), cleanForFirestore({
    status: 'reviewed',
    feedback,
  }));
}

/* ------------------------------------------------------------------ */
/* Registros de cardio — subcoleção de cada aluno                     */
/* ------------------------------------------------------------------ */

export function subscribeCardioLogsForStudent(
  studentId: string,
  cb: (list: CardioLog[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'cardioLogs'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as CardioLog), id: d.id })));
  });
}

export function subscribeCardioLogsForInstructor(
  instructorId: string,
  cb: (list: CardioLog[]) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'cardioLogs'), where('instructorId', '==', instructorId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as CardioLog), id: d.id })));
  });
}

export async function addCardioLog(studentId: string, instructorId: string, log: CardioLog) {
  await setDoc(
    doc(db, 'students', studentId, 'cardioLogs', log.id),
    cleanForFirestore({ ...log, instructorId })
  );
}

export async function deleteCardioLog(studentId: string, logId: string) {
  await deleteDoc(doc(db, 'students', studentId, 'cardioLogs', logId));
}

/* ------------------------------------------------------------------ */
/* Progresso diário do treino (conclusão de séries e do dia)          */
/* ------------------------------------------------------------------ */

export function subscribeDayProgressForStudent(
  studentId: string,
  cb: (list: DayProgress[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'dayProgress'), (snap) => {
    cb(snap.docs.map((d) => d.data() as DayProgress));
  });
}

export function subscribeDayProgressForInstructor(
  instructorId: string,
  cb: (list: DayProgress[]) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'dayProgress'), where('instructorId', '==', instructorId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as DayProgress));
  });
}

// Documento id = dateStr (YYYY-MM-DD), então cada dia tem no máximo um
// registro por aluno — chamadas repetidas no mesmo dia apenas atualizam.
export async function saveDayProgress(
  studentId: string,
  instructorId: string,
  progress: DayProgress
) {
  await setDoc(
    doc(db, 'students', studentId, 'dayProgress', progress.dateStr),
    cleanForFirestore({ ...progress, instructorId }),
    { merge: true }
  );
}

/* ------------------------------------------------------------------ */
/* Medidas corporais (peso, % gordura, massa magra/gorda, circunf.)   */
/* ------------------------------------------------------------------ */

export function subscribeMeasurementsForStudent(
  studentId: string,
  cb: (list: BodyMeasurement[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'measurements'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as BodyMeasurement), id: d.id })));
  });
}

export function subscribeMeasurementsForInstructor(
  instructorId: string,
  cb: (list: BodyMeasurement[]) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'measurements'), where('instructorId', '==', instructorId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as BodyMeasurement), id: d.id })));
  });
}

// Documento id = dateStr, então um novo registro no mesmo dia atualiza
// o anterior em vez de duplicar.
export async function saveMeasurement(
  studentId: string,
  instructorId: string,
  measurement: BodyMeasurement
) {
  await setDoc(
    doc(db, 'students', studentId, 'measurements', measurement.dateStr),
    cleanForFirestore({ ...measurement, id: measurement.dateStr, instructorId }),
    { merge: true }
  );
}

export async function deleteMeasurement(studentId: string, measurementId: string) {
  await deleteDoc(doc(db, 'students', studentId, 'measurements', measurementId));
}

/* ------------------------------------------------------------------ */
/* Biblioteca pessoal de exercícios do professor                      */
/* ------------------------------------------------------------------ */

export function subscribeCustomExercisesForInstructor(
  instructorId: string,
  cb: (list: CustomExercise[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'instructors', instructorId, 'customExercises'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as CustomExercise), id: d.id })));
  });
}

// Documento id = id do exercício, então salvar de novo com o mesmo id
// atualiza a entrada existente em vez de duplicar.
export async function saveCustomExercise(instructorId: string, exercise: CustomExercise) {
  await setDoc(
    doc(db, 'instructors', instructorId, 'customExercises', exercise.id),
    cleanForFirestore({ ...exercise, id: exercise.id, instructorId }),
    { merge: true }
  );
}

export async function deleteCustomExercise(instructorId: string, exerciseId: string) {
  await deleteDoc(doc(db, 'instructors', instructorId, 'customExercises', exerciseId));
}

/* ------------------------------------------------------------------ */
/* Biblioteca pessoal de exercícios do ALUNO autônomo (sem professor)  */
/* ------------------------------------------------------------------ */

export function subscribeCustomExercisesForStudent(
  studentId: string,
  cb: (list: CustomExercise[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students', studentId, 'customExercises'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as CustomExercise), id: d.id })));
  });
}

export async function saveCustomExerciseForStudent(studentId: string, exercise: CustomExercise) {
  await setDoc(
    doc(db, 'students', studentId, 'customExercises', exercise.id),
    cleanForFirestore({ ...exercise, id: exercise.id }),
    { merge: true }
  );
}

export async function deleteCustomExerciseForStudent(studentId: string, exerciseId: string) {
  await deleteDoc(doc(db, 'students', studentId, 'customExercises', exerciseId));
}

/* ------------------------------------------------------------------ */
/* Solicitações de vínculo: aluno autônomo pedindo pra entrar como     */
/* aluno de um professor                                              */
/* ------------------------------------------------------------------ */

export function subscribeJoinRequestsForInstructor(
  instructorId: string,
  cb: (list: JoinRequest[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'instructors', instructorId, 'joinRequests'), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as JoinRequest), id: d.id })));
  });
}

// Um aluno pode ter, no máximo, uma solicitação por professor. Isso usa
// collectionGroup pois o aluno não sabe de antemão em qual subcoleção de
// instrutor procurar — filtra por studentId, que já vem gravado no próprio
// documento.
export function subscribeJoinRequestsForStudent(
  studentId: string,
  cb: (list: JoinRequest[]) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'joinRequests'), where('studentId', '==', studentId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as JoinRequest), id: d.id })));
  });
}

// Documento id = studentId, então só existe uma solicitação pendente por
// aluno em cada professor (pedir de novo atualiza a mesma).
export async function sendJoinRequest(request: JoinRequest) {
  await setDoc(
    doc(db, 'instructors', request.instructorId, 'joinRequests', request.studentId),
    cleanForFirestore(request),
    { merge: true }
  );
}

export async function respondToJoinRequest(
  instructorId: string,
  studentId: string,
  status: 'accepted' | 'rejected'
) {
  await setDoc(
    doc(db, 'instructors', instructorId, 'joinRequests', studentId),
    { status },
    { merge: true }
  );
}

export async function deleteJoinRequest(instructorId: string, studentId: string) {
  await deleteDoc(doc(db, 'instructors', instructorId, 'joinRequests', studentId));
}

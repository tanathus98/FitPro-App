import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from '../lib/firebase';
import { Instructor, Student, UserRole } from '../types';
import { cleanForFirestore } from './dataService';

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

/** Envia um e-mail de redefinição de senha (fluxo "Esqueci minha senha"). */
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Envia (ou reenvia) o e-mail de confirmação de conta. */
export async function sendVerificationEmail(user: User) {
  await sendEmailVerification(user);
}

/**
 * Recarrega os dados do usuário direto do Firebase (usado para checar se o
 * link de confirmação já foi clicado). O SDK atualiza o próprio objeto
 * `user` em memória, então o mesmo objeto é devolvido já com
 * `emailVerified` em dia.
 */
export async function reloadAuthUser(user: User): Promise<User> {
  await reload(user);
  return user;
}

/**
 * Troca a senha do próprio usuário logado (ex: fluxo de "defina sua própria
 * senha" no primeiro acesso, quando a conta foi criada pelo professor com
 * uma senha gerada automaticamente).
 */
export async function updateOwnPassword(user: User, newPassword: string) {
  await updatePassword(user, newPassword);
}

/** Descobre se o usuário logado é 'instrutor' ou 'aluno' olhando em qual coleção existe. */
export async function resolveUserRole(uid: string): Promise<UserRole | null> {
  const instructorSnap = await getDoc(doc(db, 'instructors', uid));
  if (instructorSnap.exists()) return 'instrutor';

  const studentSnap = await getDoc(doc(db, 'students', uid));
  if (studentSnap.exists()) return 'aluno';

  return null;
}

/** Autocadastro: um professor cria a própria conta. */
export async function registerInstructor(
  email: string,
  password: string,
  profile: Omit<Instructor, 'id' | 'email'>
): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;
  const instructorDoc: Instructor = { ...profile, id: uid, email: email.trim() };
  await setDoc(doc(db, 'instructors', uid), cleanForFirestore(instructorDoc));
  await sendEmailVerification(cred.user);
  return uid;
}

/** Autocadastro: um aluno cria a própria conta (escolhendo seu instrutor). */
export async function registerStudent(
  email: string,
  password: string,
  profile: Omit<Student, 'id' | 'email'>
): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;
  const studentDoc: Student = { ...profile, id: uid, email: email.trim() };
  await setDoc(doc(db, 'students', uid), cleanForFirestore(studentDoc));
  await sendEmailVerification(cred.user);
  return uid;
}

/**
 * Instrutor (já logado) cria a conta de acesso de um aluno.
 * Usa uma instância secundária de Auth para não derrubar a sessão do instrutor.
 * Retorna o UID gerado; o chamador deve gravar o documento em `students/{uid}`.
 */
export async function createStudentAuthAccount(
  email: string,
  password: string
): Promise<string> {
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
  const uid = cred.user.uid;
  // Precisa ser enviado antes do signOut, enquanto ainda temos o `user`
  // autenticado na instância secundária.
  await sendEmailVerification(cred.user);
  await signOut(secondaryAuth);
  return uid;
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from '../lib/firebase';
import { Instructor, Student, UserRole } from '../types';

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
  await setDoc(doc(db, 'instructors', uid), instructorDoc);
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
  await setDoc(doc(db, 'students', uid), studentDoc);
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
  await signOut(secondaryAuth);
  return uid;
}

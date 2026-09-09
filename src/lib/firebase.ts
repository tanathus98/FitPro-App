import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Todas as chaves vêm de variáveis de ambiente (.env.local), nunca hardcoded.
// No Vite, variáveis expostas ao navegador precisam começar com VITE_.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // eslint-disable-next-line no-console
  console.error(
    '[Firebase] Configuração ausente. Verifique se você criou o arquivo .env.local ' +
    'com as chaves VITE_FIREBASE_* (veja .env.example).'
  );
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Retorna uma instância SECUNDÁRIA do Firebase App, com sua própria sessão de Auth
 * isolada da principal.
 *
 * Por que isso existe: se o instrutor (já logado) usa createUserWithEmailAndPassword
 * para criar a conta de um novo aluno na MESMA instância de auth, o Firebase troca
 * automaticamente a sessão ativa para o aluno recém-criado — derrubando o instrutor.
 * Criando o usuário nesta instância secundária, a sessão do instrutor nunca é afetada.
 */
export function getSecondaryAuth() {
  const SECONDARY_APP_NAME = 'Secondary';
  const secondaryApp =
    getApps().find((a) => a.name === SECONDARY_APP_NAME) ||
    initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

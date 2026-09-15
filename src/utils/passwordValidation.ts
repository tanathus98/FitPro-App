// Regra de senha do FitPro: mínimo de 6 caracteres, com pelo menos 1 letra
// maiúscula, 1 número e 1 símbolo. Usado tanto no cadastro de aluno/professor
// (LoginScreen) quanto na criação de aluno pelo professor (InstructorView).
export const PASSWORD_HINT =
  'Mínimo de 6 caracteres, com 1 letra maiúscula, 1 número e 1 símbolo.';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
// "Símbolo" = qualquer caractere que não seja letra ou número (inclui
// pontuação, espaço, acentos não contam como símbolo).
const HAS_SYMBOL = /[^A-Za-z0-9]/;

/**
 * Valida a senha conforme a regra do FitPro.
 * Retorna `null` se a senha for válida, ou uma mensagem de erro em
 * português pronta para ser exibida ao usuário.
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'A senha precisa ter no mínimo 6 caracteres.';
  }
  if (!HAS_UPPERCASE.test(password)) {
    return 'A senha precisa ter pelo menos 1 letra maiúscula.';
  }
  if (!HAS_NUMBER.test(password)) {
    return 'A senha precisa ter pelo menos 1 número.';
  }
  if (!HAS_SYMBOL.test(password)) {
    return 'A senha precisa ter pelo menos 1 símbolo (ex: !@#$%*).';
  }
  return null;
}

// Caracteres usados na geração automática. Evita ambíguos como 0/O, 1/l/I
// para reduzir erro de digitação ao copiar a senha manualmente.
const UPPER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghijkmnpqrstuvwxyz';
const NUMBER_CHARS = '23456789';
const SYMBOL_CHARS = '!@#$%*?';
const ALL_CHARS = UPPER_CHARS + LOWER_CHARS + NUMBER_CHARS + SYMBOL_CHARS;

const randomChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];

/**
 * Gera uma senha aleatória que já cumpre a regra do FitPro (garante pelo
 * menos 1 maiúscula, 1 número e 1 símbolo), pronta para o professor copiar
 * e encaminhar ao aluno.
 */
export function generateRandomPassword(length = 8): string {
  const required = [randomChar(UPPER_CHARS), randomChar(NUMBER_CHARS), randomChar(SYMBOL_CHARS)];
  const remainingLength = Math.max(length - required.length, 0);
  const remaining = Array.from({ length: remainingLength }, () => randomChar(ALL_CHARS));

  // Embaralha para não deixar sempre maiúscula-número-símbolo nas 3
  // primeiras posições.
  const chars = [...required, ...remaining];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

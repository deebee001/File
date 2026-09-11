// Password utilities for Locked File Generator

const ADJECTIVES = [
  'swift', 'silent', 'golden', 'cosmic', 'crimson', 'frozen', 'lunar', 'solar',
  'bright', 'mystic', 'hidden', 'silver', 'wild', 'ancient', 'velvet', 'iron',
  'amber', 'azure', 'emerald', 'shadow', 'stellar', 'radiant', 'brave', 'quiet'
];

const NOUNS = [
  'falcon', 'harbor', 'summit', 'glacier', 'canyon', 'forest', 'nebula', 'voyage',
  'aurora', 'castle', 'island', 'shield', 'cipher', 'breeze', 'matrix', 'crystal',
  'stream', 'beacon', 'valley', 'horizon', 'zenith', 'vector', 'quarry', 'timber'
];

export function generateMemorablePassphrase(): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${pick(ADJECTIVES)}-${num}`;
}

export function generateStrongPassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(-_=+)';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  return result;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  color: string;
  barWidthPercent: number;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Very Weak', color: 'bg-slate-300 text-slate-500', barWidthPercent: 5 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: 'Weak', color: 'bg-rose-500 text-rose-600', barWidthPercent: 25 };
  }
  if (score === 2) {
    return { score: 2, label: 'Moderate', color: 'bg-amber-500 text-amber-600', barWidthPercent: 50 };
  }
  if (score === 3 || score === 4) {
    return { score: 3, label: 'Strong', color: 'bg-emerald-500 text-emerald-600', barWidthPercent: 75 };
  }
  return { score: 4, label: 'Very Strong', color: 'bg-indigo-600 text-indigo-600', barWidthPercent: 100 };
}

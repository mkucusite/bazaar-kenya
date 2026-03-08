const attempts = new Map<string, { count: number; firstAttempt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export const useRateLimit = () => {
  const checkRateLimit = (key: string): { allowed: boolean; remainingAttempts: number; resetIn: number } => {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1, resetIn: 0 };
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const resetIn = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000);
      return { allowed: false, remainingAttempts: 0, resetIn };
    }

    entry.count++;
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count, resetIn: 0 };
  };

  const resetLimit = (key: string) => {
    attempts.delete(key);
  };

  return { checkRateLimit, resetLimit };
};

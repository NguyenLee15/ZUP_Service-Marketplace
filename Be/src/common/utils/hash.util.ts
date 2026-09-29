import * as bcrypt from 'bcrypt';

export const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function needsPasswordRehash(hashed: string): boolean {
  try {
    return bcrypt.getRounds(hashed) < BCRYPT_SALT_ROUNDS;
  } catch {
    return true;
  }
}

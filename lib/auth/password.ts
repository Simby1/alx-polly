import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string, rounds: number = DEFAULT_ROUNDS): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plainTextPassword, salt);
}

export async function verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}



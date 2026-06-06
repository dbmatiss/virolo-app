import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return kv.get<User>(`user:${email.toLowerCase()}`);
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Cet email est déjà utilisé");

  const user: User = {
    id: Date.now().toString(),
    email: email.toLowerCase(),
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };

  await kv.set(`user:${user.email}`, user);
  return user;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash);
}

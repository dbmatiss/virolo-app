import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  return data ?? null;
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Cet email est déjà utilisé");

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      name,
      password_hash: bcrypt.hashSync(password, 10),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

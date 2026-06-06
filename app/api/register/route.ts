import { NextRequest } from "next/server";
import { createUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();
    if (!email || !name || !password) {
      return Response.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });
    }
    createUser(email, name, password);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 400 });
  }
}

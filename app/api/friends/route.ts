import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getFriendships, sendFriendRequest } from "@/lib/friends";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const data = await getFriendships(session.user.id);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email manquant" }, { status: 400 });

  const result = await sendFriendRequest(session.user.id, email);
  if (result.error) return Response.json({ error: result.error }, { status: 400 });

  return Response.json({ ok: true });
}

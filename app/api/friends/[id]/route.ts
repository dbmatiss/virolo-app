import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { acceptFriendRequest, removeFriendship } from "@/lib/friends";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const result = await acceptFriendRequest(session.user.id, id);
  if (result.error) return Response.json({ error: result.error }, { status: 400 });

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const result = await removeFriendship(session.user.id, id);
  if (result.error) return Response.json({ error: result.error }, { status: 400 });

  return Response.json({ ok: true });
}

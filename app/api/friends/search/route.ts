import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { searchUsers } from "@/lib/friends";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json({ users: [] });

  const users = await searchUsers(q, session.user.id);
  return Response.json({ users });
}

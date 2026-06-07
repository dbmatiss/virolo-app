import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { areFriends } from "@/lib/friends";

// Partage une boucle déjà sauvegardée avec un ami (privé, pas le lien public)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { routeId, friendId } = await request.json();
  if (!routeId || !friendId) return Response.json({ error: "Paramètres manquants" }, { status: 400 });

  const friends = await areFriends(session.user.id, friendId);
  if (!friends) return Response.json({ error: "Vous n'êtes pas amis" }, { status: 403 });

  // Vérifie que la boucle appartient bien à l'utilisateur
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("id", routeId)
    .eq("user_id", session.user.id)
    .single();

  if (!route) return Response.json({ error: "Boucle introuvable" }, { status: 404 });

  const { error } = await supabase
    .from("shared_routes")
    .insert({ route_id: routeId, sender_id: session.user.id, recipient_id: friendId });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

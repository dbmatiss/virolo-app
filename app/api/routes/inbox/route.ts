import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

// Liste les boucles que des amis ont partagées avec l'utilisateur connecté
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { data, error } = await supabase
    .from("shared_routes")
    .select(
      "id, created_at, route:routes(id, share_token, duration, center_lat, center_lng, created_at), sender:users!shared_routes_sender_id_fkey(id, name)"
    )
    .eq("recipient_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ shared: data });
}

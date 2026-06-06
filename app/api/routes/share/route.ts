import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return Response.json({ error: "Token manquant" }, { status: 400 });

  const { data, error } = await supabase
    .from("routes")
    .select("id, share_token, duration, center_lat, center_lng, waypoints, route, gpx, created_at")
    .eq("share_token", token)
    .single();

  if (error || !data) return Response.json({ error: "Boucle introuvable" }, { status: 404 });
  return Response.json({ route: data });
}

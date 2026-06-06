import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { data, error } = await supabase
    .from("routes")
    .select("id, share_token, duration, center_lat, center_lng, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ routes: data });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Non connecté" }, { status: 401 });

  const { duration, center_lat, center_lng, waypoints, route, gpx } = await request.json();

  const { data, error } = await supabase
    .from("routes")
    .insert({ user_id: session.user.id, duration, center_lat, center_lng, waypoints, route, gpx })
    .select("id, share_token")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id, share_token: data.share_token });
}

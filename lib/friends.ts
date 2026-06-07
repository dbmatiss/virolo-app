import { supabase } from "./supabase";

export interface FriendUser {
  id: string;
  name: string;
  email: string;
}

export interface FriendRequest {
  id: string;
  status: "pending" | "accepted";
  created_at: string;
  user: FriendUser; // l'autre personne dans la relation
  direction: "incoming" | "outgoing";
}

// Recherche des utilisateurs par nom ou email (hors soi-même)
export async function searchUsers(query: string, excludeUserId: string): Promise<FriendUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq("id", excludeUserId)
    .limit(10);

  if (error) return [];
  return data ?? [];
}

// Renvoie la liste des amis (status = accepted) + demandes en attente (entrantes/sortantes)
export async function getFriendships(userId: string): Promise<{
  friends: FriendUser[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const { data, error } = await supabase
    .from("friendships")
    .select("id, status, created_at, user_id, friend_id, requester:users!friendships_user_id_fkey(id,name,email), recipient:users!friendships_friend_id_fkey(id,name,email)")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error || !data) return { friends: [], incoming: [], outgoing: [] };

  const friends: FriendUser[] = [];
  const incoming: FriendRequest[] = [];
  const outgoing: FriendRequest[] = [];

  for (const row of data as unknown as Array<{
    id: string;
    status: "pending" | "accepted";
    created_at: string;
    user_id: string;
    friend_id: string;
    requester: FriendUser;
    recipient: FriendUser;
  }>) {
    const isRequester = row.user_id === userId;
    const other = isRequester ? row.recipient : row.requester;
    if (!other) continue;

    if (row.status === "accepted") {
      friends.push(other);
    } else if (row.status === "pending") {
      const entry: FriendRequest = {
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        user: other,
        direction: isRequester ? "outgoing" : "incoming",
      };
      if (isRequester) outgoing.push(entry);
      else incoming.push(entry);
    }
  }

  return { friends, incoming, outgoing };
}

// Envoie une demande d'ami
export async function sendFriendRequest(userId: string, targetEmail: string): Promise<{ error?: string }> {
  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("email", targetEmail.toLowerCase())
    .single();

  if (!target) return { error: "Aucun utilisateur trouvé avec cet email" };
  if (target.id === userId) return { error: "Tu ne peux pas t'ajouter toi-même" };

  // Vérifie qu'il n'existe pas déjà une relation dans un sens ou l'autre
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(`and(user_id.eq.${userId},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${userId})`)
    .maybeSingle();

  if (existing) return { error: "Une relation existe déjà avec cet utilisateur" };

  const { error } = await supabase
    .from("friendships")
    .insert({ user_id: userId, friend_id: target.id, status: "pending" });

  if (error) return { error: error.message };
  return {};
}

// Accepte une demande d'ami (seul le destinataire peut accepter)
export async function acceptFriendRequest(userId: string, requestId: string): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("friend_id", userId)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !data) return { error: "Demande introuvable" };
  return {};
}

// Refuse une demande / supprime une amitié
export async function removeFriendship(userId: string, requestId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", requestId)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error) return { error: error.message };
  return {};
}

// Vérifie que deux utilisateurs sont bien amis (status accepted)
export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  const { data } = await supabase
    .from("friendships")
    .select("id")
    .or(`and(user_id.eq.${userIdA},friend_id.eq.${userIdB}),and(user_id.eq.${userIdB},friend_id.eq.${userIdA})`)
    .eq("status", "accepted")
    .maybeSingle();

  return !!data;
}

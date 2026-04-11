"use server";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sanitizeInput } from "@/lib/validation";

type ActionResult = { error?: string; success?: boolean };

export async function submitReview(formData: FormData): Promise<ActionResult> {
  const coachId = formData.get("coachId");
  const sessionId = formData.get("sessionId");
  const ratingRaw = formData.get("rating");
  const commentRaw = formData.get("comment");

  if (!coachId || typeof coachId !== "string") {
    return { error: "L'identifiant du coach est requis." };
  }

  if (!sessionId || typeof sessionId !== "string") {
    return { error: "L'identifiant de la seance est requis." };
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "La note doit etre comprise entre 1 et 5." };
  }

  const comment = sanitizeInput(
    typeof commentRaw === "string" ? commentRaw.trim() : "",
  );

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { error: "Vous devez etre connecte pour laisser un avis." };
  }

  const { error } = await supabase.from("reviews").insert({
    coach_id: coachId,
    session_id: sessionId,
    player_id: user.id,
    rating,
    comment: comment || null,
  });

  if (error) {
    return { error: error.message ?? "Impossible de soumettre l'avis." };
  }

  return { success: true };
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const conversationId = formData.get("conversationId");
  const bodyRaw = formData.get("body");

  if (!conversationId || typeof conversationId !== "string") {
    return { error: "L'identifiant de la conversation est requis." };
  }

  if (!bodyRaw || typeof bodyRaw !== "string" || !bodyRaw.trim()) {
    return { error: "Le message ne peut pas etre vide." };
  }

  const body = sanitizeInput(bodyRaw.trim());

  if (!body) {
    return { error: "Le message ne peut pas etre vide." };
  }

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { error: "Vous devez etre connecte pour envoyer un message." };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) {
    return { error: error.message ?? "Impossible d'envoyer le message." };
  }

  return { success: true };
}

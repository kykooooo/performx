import { mockCoaches } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { getDashboardPathForRole, normalizeUserRole } from "@/lib/roles";
import { demoResult, liveResult } from "./core";
import { getMockConversationRecords, getMockMessageRecords } from "./mappers";
import type { ConversationRecord, DataResult, MessageRecord } from "./types";

type ConversationLinkRow = {
  conversation_id: string;
  conversations?: { id?: string; created_at?: string } | { id?: string; created_at?: string }[] | null;
};

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string | null;
};

type CoachUserRow = {
  id: string;
  user_id: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type MessagesInboxData = {
  userId: string;
  conversations: ConversationRecord[];
  activeConversationId: string | null;
  messages: MessageRecord[];
  unreadCounts: Record<string, number>;
};

const buildOtherName = (profile: ProfileRow | undefined) => {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return fullName || "Conversation";
};

const buildConversationProfileHref = (
  role: string | null | undefined,
  userId: string | null,
  coachId: string | null,
) => {
  const normalizedRole = normalizeUserRole(role ?? null);
  if (normalizedRole === "coach" && coachId) return `/coach/${coachId}`;
  if (normalizedRole === "player" && userId) return `/players/${userId}`;
  return getDashboardPathForRole(normalizedRole);
};

function buildDemoInboxData(): MessagesInboxData {
  const conversations = getMockConversationRecords();
  const activeConversationId = conversations[0]?.id ?? null;
  const unreadCounts = conversations.reduce<Record<string, number>>((accumulator, conversation) => {
    accumulator[conversation.id] = conversation.unread;
    return accumulator;
  }, {});

  if (activeConversationId) {
    unreadCounts[activeConversationId] = 0;
  }

  return {
    userId: "user_1",
    conversations,
    activeConversationId,
    messages: activeConversationId ? getMockMessageRecords(activeConversationId) : [],
    unreadCounts,
  };
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data as MessageRow[] | null) ?? []).map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    body: message.body,
    createdAt: message.created_at,
  }));
}

export async function getMessagesInboxData(
  preferredCoachId?: string | null,
): Promise<DataResult<MessagesInboxData>> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user ?? null;

  if (!user) {
    return demoResult(buildDemoInboxData(), "unauthenticated");
  }

  try {
    const { data: convoLinks, error: convoError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations(id, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (convoError) throw convoError;

    const conversationIds =
      ((convoLinks as ConversationLinkRow[] | null) ?? [])
        .map((link) => link.conversation_id)
        .filter(Boolean) ?? [];

    const { data: participants, error: participantsError } = conversationIds.length
      ? await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds)
      : { data: [], error: null };

    if (participantsError) throw participantsError;

    const otherUserIds = Array.from(
      new Set(
        ((participants as ParticipantRow[] | null) ?? [])
          .filter((row) => row.user_id !== user.id)
          .map((row) => row.user_id),
      ),
    );

    const [profilesRes, coachesRes] = await Promise.all([
      otherUserIds.length
        ? supabase
            .from("profiles")
            .select("user_id, first_name, last_name, role")
            .in("user_id", otherUserIds)
        : Promise.resolve({ data: [], error: null }),
      otherUserIds.length
        ? supabase
            .from("coaches")
            .select("id, user_id")
            .in("user_id", otherUserIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (coachesRes.error) throw coachesRes.error;

    const profileMap = new Map<string, ProfileRow>();
    ((profilesRes.data as ProfileRow[] | null) ?? []).forEach((profile) => {
      profileMap.set(profile.user_id, profile);
    });

    const coachIdMap = ((coachesRes.data as CoachUserRow[] | null) ?? []).reduce<Record<string, string>>(
      (accumulator, coach) => {
        accumulator[coach.user_id] = coach.id;
        return accumulator;
      },
      {},
    );

    let conversations: ConversationRecord[] = ((convoLinks as ConversationLinkRow[] | null) ?? []).map((link) => {
      const conversationMeta = Array.isArray(link.conversations)
        ? link.conversations[0]
        : link.conversations;
      const otherParticipant = ((participants as ParticipantRow[] | null) ?? []).find(
        (participant) =>
          participant.conversation_id === link.conversation_id && participant.user_id !== user.id,
      );
      const profile = otherParticipant ? profileMap.get(otherParticipant.user_id) : undefined;
      const otherName = buildOtherName(profile);
      const normalizedRole = normalizeUserRole(profile?.role ?? null);

      return {
        id: link.conversation_id,
        createdAt: conversationMeta?.created_at ?? "",
        otherUserId: otherParticipant?.user_id ?? null,
        otherName,
        role: normalizedRole,
        profileHref: buildConversationProfileHref(
          normalizedRole,
          otherParticipant?.user_id ?? null,
          otherParticipant ? coachIdMap[otherParticipant.user_id] ?? null : null,
        ),
        avatarSeed: otherName,
        unread: 0,
        online: false,
        lastSeen: null,
      } satisfies ConversationRecord;
    });

    let activeConversationId = conversations[0]?.id ?? null;

    if (preferredCoachId) {
      const { data: coachData, error: coachError } = await supabase
        .from("coaches")
        .select("id, user_id, name")
        .eq("id", preferredCoachId)
        .maybeSingle();

      if (coachError) throw coachError;

      const coachUserId = coachData?.user_id ?? null;
      if (coachUserId) {
        const existing = conversations.find((conversation) => conversation.otherUserId === coachUserId);
        if (existing) {
          activeConversationId = existing.id;
        } else {
          const { data: newConversation, error: newConversationError } = await supabase
            .from("conversations")
            .insert({ created_by: user.id })
            .select("id, created_at")
            .single();

          if (newConversationError) throw newConversationError;

          const { error: participantInsertError } = await supabase
            .from("conversation_participants")
            .insert([
              { conversation_id: newConversation.id, user_id: user.id },
              { conversation_id: newConversation.id, user_id: coachUserId },
            ]);

          if (participantInsertError) throw participantInsertError;

          const coachName = coachData?.name ?? mockCoaches.find((coach) => coach.id === preferredCoachId)?.name ?? "Coach";
          const createdConversation: ConversationRecord = {
            id: newConversation.id,
            createdAt: newConversation.created_at,
            otherUserId: coachUserId,
            otherName: coachName,
            role: "coach",
            profileHref: `/coach/${preferredCoachId}`,
            avatarSeed: coachName,
            unread: 0,
            online: false,
            lastSeen: null,
          };

          conversations = [createdConversation, ...conversations];
          activeConversationId = createdConversation.id;
        }
      }
    }

    const unreadCounts = conversations.reduce<Record<string, number>>((accumulator, conversation) => {
      accumulator[conversation.id] = 0;
      return accumulator;
    }, {});

    return liveResult({
      userId: user.id,
      conversations,
      activeConversationId,
      messages: activeConversationId ? await getConversationMessages(activeConversationId) : [],
      unreadCounts,
    });
  } catch {
    return demoResult(buildDemoInboxData(), "error");
  }
}

export async function sendConversationMessage(options: {
  conversationId: string;
  body: string;
  userId: string;
  mode: "live" | "demo";
}) {
  if (options.mode === "demo") {
    return {
      id: `demo-${Date.now()}`,
      senderId: options.userId,
      body: options.body,
      createdAt: new Date().toISOString(),
    } satisfies MessageRecord;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: options.conversationId,
      sender_id: options.userId,
      body: options.body,
    })
    .select("id, sender_id, body, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible d'envoyer le message.");
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    body: data.body,
    createdAt: data.created_at,
  } satisfies MessageRecord;
}

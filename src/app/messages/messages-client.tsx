"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import { AlertIcon, ChatIcon, InboxIcon } from "@/components/icons";
import { mockConversations, mockMessages } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

type Conversation = {
  id: string;
  created_at: string;
  otherUserId: string | null;
  otherName: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isToday) return time;
  if (isYesterday) return `Hier · ${time}`;
  return `${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date)} · ${time}`;
};

export default function MessagesClient() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coach");

  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(coachId));
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const loadConversations = async (currentUserId: string, preferredCoachId?: string | null) => {
    setLoading(true);
    setError(null);

    const { data: convoLinks } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations(id, created_at)")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    const conversationIds = (convoLinks ?? [])
      .map((link) => link.conversation_id)
      .filter(Boolean) as string[];

    const { data: participants } = conversationIds.length
      ? await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds)
      : { data: [] };

    const otherUserIds = Array.from(
      new Set(
        (participants ?? [])
          .filter((row) => row.user_id !== currentUserId)
          .map((row) => row.user_id),
      ),
    );

    const { data: profiles } = otherUserIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", otherUserIds)
      : { data: [] };

    const profileMap = new Map<string, ProfileRow>();
    (profiles ?? []).forEach((profile) => profileMap.set(profile.user_id, profile));

    const conversationList: Conversation[] = (convoLinks ?? []).map((link) => {
      const conversationId = link.conversation_id as string;
      const conversationMeta = Array.isArray(link.conversations)
        ? link.conversations[0]
        : link.conversations;
      const createdAt =
        conversationMeta && typeof conversationMeta === "object" && "created_at" in conversationMeta
          ? ((conversationMeta as { created_at?: string }).created_at ?? "")
          : "";
      const participantsForConversation = (participants ?? []).filter(
        (row) => row.conversation_id === conversationId,
      );
      const other = participantsForConversation.find((row) => row.user_id !== currentUserId);
      const profile = other ? profileMap.get(other.user_id) : null;
      const otherName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur"
        : "Conversation";
      return {
        id: conversationId,
        created_at: createdAt,
        otherUserId: other?.user_id ?? null,
        otherName,
      };
    });

    setConversations(conversationList);
    setUnreadCounts((prev) => {
      const next: Record<string, number> = {};
      conversationList.forEach((conversation) => {
        next[conversation.id] = prev[conversation.id] ?? 0;
      });
      return next;
    });

    let activeId = conversationList[0]?.id ?? null;

    if (preferredCoachId) {
      const { data: coachData } = await supabase
        .from("coaches")
        .select("user_id")
        .eq("id", preferredCoachId)
        .single();

      const coachUserId = coachData?.user_id ?? null;
      if (coachUserId) {
        const existing = conversationList.find((conversation) => conversation.otherUserId === coachUserId);
        if (existing) {
          activeId = existing.id;
        } else {
          const { data: newConversation } = await supabase
            .from("conversations")
            .insert({ created_by: currentUserId })
            .select("id, created_at")
            .single();

          if (newConversation) {
            await supabase.from("conversation_participants").insert([
              { conversation_id: newConversation.id, user_id: currentUserId },
              { conversation_id: newConversation.id, user_id: coachUserId },
            ]);

            activeId = newConversation.id;
            const coachProfile = profileMap.get(coachUserId);
            setConversations((prev) => [
              {
                id: newConversation.id,
                created_at: newConversation.created_at,
                otherUserId: coachUserId,
                otherName:
                  coachProfile
                    ? [coachProfile.first_name, coachProfile.last_name].filter(Boolean).join(" ") || "Coach"
                    : "Coach",
              },
              ...prev,
            ]);
          }
        }
      }
    }

    setActiveConversationId(activeId ?? null);
    if (preferredCoachId && activeId) {
      setMobileChatOpen(true);
    }
    if (!activeId) {
      setMessages([]);
    }
    setLoading(false);
  };

  const loadDemoMode = () => {
    isDemoMode.current = true;
    const demoUserId = "user_1";
    setUserId(demoUserId);
    const demoConversations: Conversation[] = mockConversations.map((c) => ({
      id: c.id,
      created_at: c.created_at,
      otherUserId: c.otherUserId,
      otherName: c.otherName,
    }));
    setConversations(demoConversations);
    const firstId = demoConversations[0]?.id ?? null;
    setActiveConversationId(firstId);
    if (firstId) {
      setMessages(
        mockMessages
          .filter((m) => m.conversationId === firstId)
          .map((m) => ({ id: m.id, sender_id: m.senderId, body: m.body, created_at: m.created_at })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        loadDemoMode();
        return;
      }
      setUserId(data.user.id);
      loadConversations(data.user.id, coachId).catch(() => {
        loadDemoMode();
      });
    });
  }, [coachId]);

  const isDemoMode = useRef(false);

  useEffect(() => {
    if (!activeConversationId) return;

    if (isDemoMode.current) {
      setMessages(
        mockMessages
          .filter((m) => m.conversationId === activeConversationId)
          .map((m) => ({ id: m.id, sender_id: m.senderId, body: m.body, created_at: m.created_at })),
      );
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as MessageRow[]);
    };

    fetchMessages();
  }, [activeConversationId]);

  useEffect(() => {
    if (!userId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("messages-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const message = payload.new as MessageRow & { conversation_id: string };
            if (!message) return;

            const knownConversation = conversationsRef.current.some(
              (conversation) => conversation.id === message.conversation_id,
            );
            if (!knownConversation && userId) {
              loadConversations(userId).catch(() => null);
            }

            if (message.conversation_id === activeConversationId) {
              setMessages((prev) => {
                if (prev.some((item) => item.id === message.id)) return prev;
                return [...prev, message];
              });
              if (message.sender_id !== userId) {
                setNotice("Nouveau message reçu.");
              }
            } else {
              setUnreadCounts((prev) => ({
                ...prev,
                [message.conversation_id]: (prev[message.conversation_id] ?? 0) + 1,
              }));
            }
          },
        )
        .subscribe();
    } catch {
      // WebSocket may fail on localhost (HTTP), works fine on HTTPS in production
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, activeConversationId]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId],
  );

  const handleSend = async () => {
    if (!userId || !activeConversationId || !newMessage.trim()) return;

    if (isDemoMode.current) {
      const demoMsg: MessageRow = {
        id: `demo-${Date.now()}`,
        sender_id: userId,
        body: newMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, demoMsg]);
      setNewMessage("");

      // Simulate typing indicator then auto-reply
      setIsTyping(true);
      const delay = 1500 + Math.random() * 2000;
      setTimeout(() => {
        setIsTyping(false);
        const replies = [
          "Parfait, on se voit sur le terrain !",
          "Bien reçu, je prépare la séance.",
          "Super, n'oublie pas tes crampons !",
          "OK ! On travaillera la technique.",
          "C'est noté, à bientôt !",
        ];
        const replyMsg: MessageRow = {
          id: `demo-reply-${Date.now()}`,
          sender_id: "other",
          body: replies[Math.floor(Math.random() * replies.length)],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, delay);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeConversationId, sender_id: userId, body: newMessage })
      .select("id, sender_id, body, created_at")
      .single();

    if (error || !data) {
      setError(error?.message ?? "Impossible d'envoyer le message.");
      return;
    }

    setMessages((prev) => [...prev, data]);
    setNewMessage("");
  };

  return (
    <AppShell
      active="/messages"
      title="Messagerie"
      description="Discute avec les coachs et organise tes séances."
    >
      {error && (
        <FeedbackState
          tone="error"
          icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
          title="Messagerie indisponible"
          description={error}
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
        />
      )}
      {notice && (
        <div className="px-card p-4 transition duration-200">
          <p className="text-xs text-white/70">{notice}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className={`px-card p-4 ${mobileChatOpen ? "hidden lg:block" : ""}`}>
          <h3 className="text-lg text-white">Conversations</h3>
          <div className="mt-4 space-y-2">
            {loading && (
              <LoadingState title="Chargement des conversations" description="Synchronisation de la messagerie..." />
            )}
            {!loading && conversations.length === 0 && (
              <FeedbackState
                icon={<InboxIcon className="h-7 w-7 text-white/35" />}
                title="Aucune conversation"
                description="Commence par réserver une séance pour ouvrir une discussion."
                actionLabel="Réserver une séance"
                actionHref="/booking"
              />
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition duration-200 ${
                  conversation.id === activeConversationId
                    ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-[color:var(--px-accent)] hover:bg-white/10"
                }`}
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  setUnreadCounts((prev) => ({ ...prev, [conversation.id]: 0 }));
                  setMobileChatOpen(true);
                }}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{conversation.otherName}</p>
                  {unreadCounts[conversation.id] ? (
                    <span className="rounded-full bg-[color:var(--px-accent)] px-2 py-0.5 text-[10px] text-black">
                      {unreadCounts[conversation.id]}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-white/50">Conversation privée</p>
              </button>
            ))}
          </div>
        </aside>

        <section className={`px-card-strong h-[72vh] min-h-[420px] flex-col p-4 md:h-[560px] ${mobileChatOpen ? "flex" : "hidden lg:flex"}`}>
          <div className="border-b border-white/10 pb-3">
            <button
              type="button"
              className="px-button-ghost mb-3 px-3 py-2 text-xs lg:hidden"
              onClick={() => setMobileChatOpen(false)}
            >
              Retour aux conversations
            </button>
            <p className="text-sm text-white/60">Discussion avec</p>
            <h3 className="text-lg text-white">{activeConversation?.otherName ?? "Sélectionne une conversation"}</h3>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            {messages.length === 0 && (
              <FeedbackState
                icon={<ChatIcon className="h-7 w-7 text-white/35" />}
                title="Aucun message"
                description="Envoie le premier message pour lancer la discussion."
              />
            )}
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm transition duration-200 ${
                    message.sender_id === userId
                      ? "ml-auto bg-[color:var(--px-accent)]/20 text-white"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  <p>{message.body}</p>
                  <p className="mt-1 text-[10px] text-white/45">{formatMessageTime(message.created_at)}</p>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-2 w-fit">
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="px-input"
                placeholder="Écrire un message..."
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="px-button sm:w-auto" type="button" onClick={handleSend}>
                Envoyer
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

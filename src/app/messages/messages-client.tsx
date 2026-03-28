"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import { AlertIcon, ChatIcon, InboxIcon, ArrowRightIcon } from "@/components/icons";
import { mockConversations, mockMessages } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

/* ── Types ── */

type Conversation = {
  id: string;
  created_at: string;
  otherUserId: string | null;
  otherName: string;
  role?: string;
  profileHref?: string;
  avatarSeed?: string;
  unread: number;
  online?: boolean;
  lastSeen?: string;
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
  role?: string | null;
};

/* ── Helpers ── */

const getAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const getProfileHref = (role: string | null | undefined, userId: string | null, coachId?: string | null) => {
  if (role === "coach" && coachId) return `/coach/${coachId}`;
  if (role === "player" && userId) return `/players/${userId}`;
  return "/dashboard";
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

const formatListTime = (value: string) => {
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

  if (isToday)
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (isYesterday) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
};

/* ── Component ── */

export default function MessagesClient() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coach");
  const prefill = searchParams.get("prefill");

  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState(() => prefill ?? "");
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(coachId));
  const [isTyping, setIsTyping] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  /* ── Load Supabase conversations ── */

  const loadConversations = async (currentUserId: string, preferredCoachId?: string | null) => {
    setLoading(true);
    setError(null);
    setIsDemoMode(false);

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
          .select("user_id, first_name, last_name, role")
          .in("user_id", otherUserIds)
      : { data: [] };

    const { data: coaches } = otherUserIds.length
      ? await supabase
          .from("coaches")
          .select("id, user_id")
          .in("user_id", otherUserIds)
      : { data: [] };

    const profileMap = new Map<string, ProfileRow>();
    (profiles ?? []).forEach((profile) => profileMap.set(profile.user_id, profile));
    const coachMap = new Map<string, string>();
    (coaches ?? []).forEach((coach) => coachMap.set(coach.user_id, coach.id));

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
      const otherRole = profile?.role ?? null;
      const otherName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur"
        : "Conversation";
      return {
        id: conversationId,
        created_at: createdAt,
        otherUserId: other?.user_id ?? null,
        otherName,
        role: otherRole ?? undefined,
        profileHref: getProfileHref(otherRole, other?.user_id ?? null, coachMap.get(other?.user_id ?? "")),
        avatarSeed: otherName,
        unread: 0,
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
                role: "coach",
                profileHref: `/coach/${preferredCoachId}`,
                otherName:
                  coachProfile
                    ? [coachProfile.first_name, coachProfile.last_name].filter(Boolean).join(" ") || "Coach"
                    : "Coach",
                avatarSeed: "Coach",
                unread: 0,
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

  /* ── Demo mode ── */

  const loadDemoMode = () => {
    setIsDemoMode(true);
    const demoUserId = "user_1";
    setUserId(demoUserId);
    const demoConversations: Conversation[] = mockConversations.map((c) => ({
      id: c.id,
      created_at: c.created_at,
      otherUserId: c.otherUserId,
      otherName: c.otherName,
      role: c.role,
      profileHref:
        c.role === "coach"
          ? "/coach"
          : c.role === "player" && c.otherUserId
            ? `/players/${c.otherUserId}`
            : "/dashboard",
      avatarSeed: c.avatarSeed,
      unread: c.unread,
      online: c.online,
      lastSeen: c.lastSeen,
    }));
    setConversations(demoConversations);
    const initialUnread: Record<string, number> = {};
    demoConversations.forEach((c) => {
      initialUnread[c.id] = c.unread;
    });
    setUnreadCounts(initialUnread);
    const firstId = demoConversations[0]?.id ?? null;
    setActiveConversationId(firstId);
    if (firstId) {
      setMessages(
        mockMessages
          .filter((m) => m.conversationId === firstId)
          .map((m) => ({ id: m.id, sender_id: m.senderId, body: m.body, created_at: m.created_at })),
      );
      // Clear unread for first conversation
      initialUnread[firstId] = 0;
      setUnreadCounts({ ...initialUnread });
    }
    setLoading(false);
  };

  /* ── Init ── */

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

  /* ── Load messages when conversation changes ── */

  useEffect(() => {
    if (!activeConversationId) return;

    if (isDemoMode) {
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
  }, [activeConversationId, isDemoMode]);

  /* ── Realtime subscription ── */

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
              loadConversations(userId).catch((err) => console.warn("[PerformX]", err));
            }

            if (message.conversation_id === activeConversationId) {
              setMessages((prev) => {
                if (prev.some((item) => item.id === message.id)) return prev;
                return [...prev, message];
              });
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

  /* ── Auto-scroll ── */

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ── Computed ── */

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId],
  );

  useEffect(() => {
    if (!composerNotice) return;
    const timeout = setTimeout(() => setComposerNotice(null), 2200);
    return () => clearTimeout(timeout);
  }, [composerNotice]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + n, 0),
    [unreadCounts],
  );

  const quickTemplates = useMemo(() => {
    const templates = [
      "Bonjour, je confirme ma presence 10 min avant la seance.",
      "Peux-tu me confirmer le lieu exact et ce que je dois apporter ?",
      "Je veux axer la seance sur mon premier controle et ma prise d'information.",
      "Si besoin, on peut garder 5 min a la fin pour fixer le prochain focus.",
    ];

    if (prefill) {
      return [prefill, ...templates].slice(0, 5);
    }

    if (activeConversation?.role === "coach") {
      return templates;
    }

    return [
      "Bonjour, je te fais un point rapide avant la seance.",
      "Peux-tu me partager la consigne principale du prochain cycle ?",
      "Je confirme que tout est bon de mon cote.",
      "Dis-moi si tu veux que je t'envoie un rappel ou une note de suivi.",
    ];
  }, [activeConversation?.role, prefill]);

  // Last message per conversation (for sidebar preview)
  const lastMessageMap = useMemo(() => {
    const map: Record<string, { body: string; time: string; isMine: boolean }> = {};
    if (isDemoMode) {
      for (const conv of conversations) {
        const convMsgs = mockMessages.filter((m) => m.conversationId === conv.id);
        const last = convMsgs[convMsgs.length - 1];
        if (last) {
          map[conv.id] = { body: last.body, time: last.created_at, isMine: last.senderId === userId };
        }
      }
    }
    // Also include locally sent messages
    if (messages.length > 0 && activeConversationId) {
      const last = messages[messages.length - 1];
      map[activeConversationId] = {
        body: last.body,
        time: last.created_at,
        isMine: last.sender_id === userId,
      };
    }
    return map;
  }, [conversations, messages, activeConversationId, isDemoMode, userId]);

  /* ── Send message ── */

  const handleSend = async () => {
    if (!userId || !activeConversationId || !newMessage.trim()) return;

    if (isDemoMode) {
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
          "C'est noté, à bientôt ! 💪",
          "Top, j'ai hâte de voir tes progrès.",
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

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({ conversation_id: activeConversationId, sender_id: userId, body: newMessage })
      .select("id, sender_id, body, created_at")
      .single();

    if (sendError || !data) {
      setError(sendError?.message ?? "Impossible d'envoyer le message.");
      return;
    }

    setMessages((prev) => [...prev, data]);
    setNewMessage("");
  };

  /* ── Select conversation ── */

  const selectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
    if (isDemoMode) {
      setMessages(
        mockMessages
          .filter((message) => message.conversationId === convId)
          .map((message) => ({
            id: message.id,
            sender_id: message.senderId,
            body: message.body,
            created_at: message.created_at,
          })),
      );
    }
    setMobileChatOpen(true);
    // Focus input after switch
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ── Render ── */

  if (error) {
    return (
      <AppShell active="/messages" hideTitle>
        <div className="py-16">
          <FeedbackState
            tone="error"
            icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
            title="Messagerie indisponible"
            description={error}
            actionLabel="Réessayer"
            onAction={() => window.location.reload()}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="/messages" hideTitle>
      <div className="flex h-[calc(100vh-90px)] min-h-[500px] overflow-hidden rounded-2xl border border-[color:var(--px-border)] bg-[color:var(--px-card)]">
        {/* ═══════ LEFT — Conversation list ═══════ */}
        <aside
          className={`w-full flex-col border-r border-[color:var(--px-border)] lg:flex lg:w-[340px] ${
            mobileChatOpen ? "hidden" : "flex"
          }`}
        >
          {/* Header */}
          <div className="border-b border-[color:var(--px-border)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[color:var(--px-text)]">Messagerie</h2>
              {totalUnread > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--px-accent)] px-2 text-xs font-bold text-black">
                  {totalUnread}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[color:var(--px-text-secondary)]">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-6">
                <LoadingState title="Chargement" description="Synchronisation..." />
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="p-6">
                <FeedbackState
                  icon={<InboxIcon className="h-7 w-7 text-[color:var(--px-text-secondary)]" />}
                  title="Aucune conversation"
                  description="Réserve une séance pour ouvrir une discussion."
                  actionLabel="Réserver"
                  actionHref="/booking"
                />
              </div>
            )}
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId && !mobileChatOpen || (conv.id === activeConversationId);
              const unread = unreadCounts[conv.id] ?? 0;
              const lastMsg = lastMessageMap[conv.id];

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ${
                    isActive
                      ? "bg-[color:var(--px-accent)]/10 border-l-2 border-l-[color:var(--px-accent)]"
                      : "border-l-2 border-l-transparent hover:bg-[color:var(--px-surface)]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={getAvatar(conv.avatarSeed ?? conv.otherName)}
                      alt=""
                      className="h-12 w-12 rounded-full bg-[color:var(--px-surface)]"
                    />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[color:var(--px-card)] bg-emerald-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`truncate text-sm font-semibold ${isActive ? "text-[color:var(--px-accent)]" : "text-[color:var(--px-text)]"}`}>
                          {conv.otherName}
                        </span>
                        {conv.role && (
                          <span className="hidden shrink-0 rounded-full bg-[color:var(--px-accent)]/10 px-2 py-0.5 text-[9px] font-medium text-[color:var(--px-accent)] sm:inline-flex">
                            {conv.role}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-[color:var(--px-text-secondary)]">
                        {lastMsg ? formatListTime(lastMsg.time) : ""}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-[color:var(--px-text-secondary)]">
                        {lastMsg
                          ? (lastMsg.isMine ? "Toi : " : "") + lastMsg.body
                          : "Pas encore de messages"}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--px-accent)] px-1.5 text-[10px] font-bold text-black">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ═══════ RIGHT — Chat area ═══════ */}
        <section
          className={`flex flex-1 flex-col ${mobileChatOpen ? "flex" : "hidden lg:flex"}`}
        >
          {!activeConversation ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--px-accent)]/10">
                <ChatIcon className="h-8 w-8 text-[color:var(--px-accent)]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[color:var(--px-text)]">Sélectionne une conversation</p>
                <p className="mt-1 text-sm text-[color:var(--px-text-secondary)]">
                  Choisis un coach à gauche pour commencer
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Chat Header ── */}
              <div className="flex items-center gap-3 border-b border-[color:var(--px-border)] px-4 py-3">
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--px-text-secondary)] transition hover:bg-[color:var(--px-surface)] hover:text-[color:var(--px-text)] lg:hidden"
                  aria-label="Retour"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={getAvatar(activeConversation.avatarSeed ?? activeConversation.otherName)}
                    alt=""
                    className="h-10 w-10 rounded-full bg-[color:var(--px-surface)]"
                  />
                  {activeConversation.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--px-card)] bg-emerald-500" />
                  )}
                </div>

                {/* Name & status */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-[color:var(--px-text)]">
                      {activeConversation.otherName}
                    </h3>
                    {activeConversation.role && (
                      <span className="shrink-0 rounded-full bg-[color:var(--px-accent)]/10 px-2 py-0.5 text-[9px] font-medium text-[color:var(--px-accent)]">
                        {activeConversation.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs">
                    {activeConversation.online ? (
                      <span className="text-emerald-400">En ligne</span>
                    ) : (
                      <span className="text-[color:var(--px-text-secondary)]">
                        {activeConversation.lastSeen ? `Vu ${activeConversation.lastSeen}` : "Hors ligne"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Profile link */}
                <Link
                  href={activeConversation.profileHref ?? "/dashboard"}
                  className="hidden shrink-0 items-center gap-1 rounded-full border border-[color:var(--px-border)] px-3 py-1.5 text-xs text-[color:var(--px-text-secondary)] transition hover:border-[color:var(--px-accent)]/40 hover:text-[color:var(--px-accent)] sm:flex"
                >
                  Voir le profil
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {/* ── Messages body ── */}
              <div className="border-b border-[color:var(--px-border)] px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => {
                        setNewMessage(template);
                        inputRef.current?.focus();
                      }}
                      className="px-context-chip text-left"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[color:var(--px-text-secondary)]">
                  Raccourcis utiles avant seance: rappel, consigne, logistique et focus de cycle.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 && !loading && (
                  <div className="flex h-full items-center justify-center">
                    <FeedbackState
                      icon={<ChatIcon className="h-7 w-7 text-[color:var(--px-text-secondary)]" />}
                      title="Aucun message"
                      description="Envoie le premier message pour lancer la discussion."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {messages.map((message, idx) => {
                    const isMine = message.sender_id === userId;
                    const isNew = idx >= messages.length - 1 && message.id.startsWith("demo");
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNew ? "px-message-in" : ""}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%] ${
                            isMine
                              ? "rounded-2xl rounded-br-md bg-[color:var(--px-accent)]/15 text-[color:var(--px-text)]"
                              : "rounded-2xl rounded-bl-md bg-[color:var(--px-surface)] text-[color:var(--px-text)]"
                          }`}
                        >
                          <p>{message.body}</p>
                          <div className={`mt-1 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px] text-[color:var(--px-text-secondary)]">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isMine && (
                              <span className="text-[10px] text-[color:var(--px-accent)]">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start px-message-in">
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[color:var(--px-surface)] px-4 py-3">
                        <span className="h-2 w-2 rounded-full bg-[color:var(--px-text-secondary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-[color:var(--px-text-secondary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-[color:var(--px-text-secondary)] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── Input bar ── */}
              <div className="border-t border-[color:var(--px-border)] p-3 sm:p-4">
                {composerNotice && (
                  <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[color:var(--px-text-secondary)]">
                    {composerNotice}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setComposerNotice("Pieces jointes et partage de consignes arrivent bientot dans la messagerie.")
                    }
                    className="hidden rounded-2xl border border-[color:var(--px-border)] px-3 py-2 text-xs text-[color:var(--px-text-secondary)] transition hover:border-[color:var(--px-accent)]/40 hover:text-[color:var(--px-accent)] sm:inline-flex"
                  >
                    + Piece jointe
                  </button>
                  <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-2.5 transition-colors focus-within:border-[color:var(--px-accent)]/40">
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-sm text-[color:var(--px-text)] outline-none placeholder:text-[color:var(--px-text-secondary)]"
                      placeholder="Écris un message..."
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--px-accent)] text-white transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,106,0,0.3)] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none"
                    aria-label="Envoyer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

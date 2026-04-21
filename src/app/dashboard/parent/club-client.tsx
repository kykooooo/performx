"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { LoadingState } from "@/components/feedback-state";
import ScrollReveal from "@/components/scroll-reveal";
import { useRoleGuard } from "@/lib/use-role-guard";
import {
  ArrowRightIcon,
  BoltIcon,
  CalendarIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
  WhistleIcon,
} from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { buildParentMetricBars, parentOverviewFallback } from "@/lib/chart-data";
import {
  getParentChildInsights,
  getParentDashboardHomeData,
} from "@/lib/data/dashboards";
import type {
  CoachRecord,
  ParentChildRecord,
  ParentLegacyHint,
  SessionRecord,
} from "@/lib/data/types";
import { LOAD_RECOMMENDATION_LABELS } from "@/lib/football";
import { supabase } from "@/lib/supabase";
import type { ParentOverview } from "@/lib/types";

const getAge = (birthDate: string | null) => {
  if (!birthDate) return null;
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
};

export default function ParentDashboardPage() {
  const { status: guardStatus } = useRoleGuard("parent");
  const [coachCount, setCoachCount] = useState(0);
  const [children, setChildren] = useState<ParentChildRecord[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [parentName, setParentName] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ParentOverview>(parentOverviewFallback);
  const [linkCode, setLinkCode] = useState("");
  const [linkNotice, setLinkNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [legacyChildHint, setLegacyChildHint] = useState<ParentLegacyHint | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeChild = useMemo(
    () => children.find((child) => child.userId === activeChildId) ?? null,
    [activeChildId, children],
  );

  const metricBars = useMemo(() => buildParentMetricBars(overview), [overview]);
  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status === "upcoming").slice(0, 4),
    [sessions],
  );
  const nextUpcomingSession = upcomingSessions[0] ?? null;

  useEffect(() => {
    let mounted = true;

    const fetchParentHome = async () => {
      setLoading(true);
      const result = await getParentDashboardHomeData();

      if (!mounted) return;

      setIsDemo(result.mode === "demo");
      setError(result.data.error);
      setParentName(result.data.parentName);
      setLegacyChildHint(result.data.legacyChildHint);
      setChildren(result.data.children);
      setActiveChildId((current) =>
        current && result.data.children.some((child) => child.userId === current)
          ? current
          : result.data.children[0]?.userId ?? null,
      );
      setCoachCount(result.data.coachCount);
      setCoaches(result.data.coaches);
      setTotalSpent(result.data.totalSpent);
      setCompletedCount(result.data.completedCount);
      setSessions([]);
      setOverview(parentOverviewFallback);
      setLoading(false);
    };

    fetchParentHome();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchChildData = async () => {
      if (!activeChildId) return;

      const result = await getParentChildInsights(activeChildId, isDemo ? "demo" : "live");
      if (!mounted) return;

      setSessions(result.sessions);
      setOverview(result.overview);
    };

    fetchChildData();

    return () => {
      mounted = false;
    };
  }, [activeChildId, isDemo]);

  const handleLinkChild = async () => {
    const trimmedCode = linkCode.trim().toUpperCase();
    if (!trimmedCode) {
      setLinkNotice({ type: "error", text: "Entre un code de liaison valide." });
      return;
    }

    const { error: linkError } = await supabase.rpc("link_parent_to_child", {
      p_code: trimmedCode,
    });

    if (linkError) {
      setLinkNotice({ type: "error", text: linkError.message });
      return;
    }

    setLinkCode("");
    setLinkNotice({ type: "success", text: "Compte joueur lié avec succès." });
    window.location.reload();
  };

  const handleGenerateInvite = async () => {
    setInviteNotice(null);
    setGeneratingInvite(true);
    const { data, error: rpcError } = await supabase.rpc("generate_parent_invite_code", {
      p_label: null,
    });
    setGeneratingInvite(false);

    if (rpcError) {
      const raw = rpcError.message.toUpperCase();
      const human = raw.includes("AUTH_REQUIRED")
        ? "Connecte-toi pour générer un lien."
        : raw.includes("PARENT_ROLE_REQUIRED")
          ? "Ton compte doit être de type parent pour générer un lien d'invitation."
          : rpcError.message;
      setInviteNotice({ type: "error", text: human });
      return;
    }

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload || typeof payload.code !== "string") {
      setInviteNotice({ type: "error", text: "Impossible de générer le lien pour le moment." });
      return;
    }

    setInviteCode(payload.code);
    setInviteExpiresAt(payload.expires_at ?? null);
    setInviteCopied(false);
    setInviteNotice({
      type: "success",
      text: "Lien d'invitation prêt. Envoie-le à ton enfant.",
    });
  };

  const inviteUrl = useMemo(() => {
    if (!inviteCode) return null;
    if (typeof window === "undefined") return `/auth/invite/${inviteCode}`;
    return `${window.location.origin}/auth/invite/${inviteCode}`;
  }, [inviteCode]);

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2400);
      }
    } catch {
      setInviteNotice({ type: "error", text: "Copie impossible. Sélectionne le lien manuellement." });
    }
  };

  if (guardStatus !== "ok") {
    return (
      <AppShell active="/dashboard" hideTitle>
        <LoadingState title="Chargement" description="Vérification de ton espace parent..." />
      </AppShell>
    );
  }

  return (
    <AppShell active="/dashboard" hideTitle>
      <div className="px-role-shell" data-role="parent">
        <section className="py-8 lg:py-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-fade-up">
                <span className="px-badge px-pulse">Parent</span>
                {isDemo && <span className="px-pill">Mode demo</span>}
              </div>
              <h1
                className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl"
                style={{ animationDelay: "80ms" }}
              >
                Suivi <span className="px-gradient-text">parent.</span>
              </h1>
              <p
                className="px-fade-up max-w-xl text-base text-white/70"
                style={{ animationDelay: "160ms" }}
              >
                Visualise la progression de tes enfants lies, les recommandations de charge et les
                prochaines séances.
              </p>
            </div>
            <div className="px-fade-up flex gap-3" style={{ animationDelay: "200ms" }}>
              <Link href="/coach" className="px-button-ghost text-sm">
                <WhistleIcon className="h-4 w-4" />
                Trouver un coach
              </Link>
              <Link href="/booking" className="px-button text-sm">
                <BoltIcon className="h-4 w-4" />
                Reserver
              </Link>
            </div>
          </div>
        </section>

        {!loading && children.length > 0 && activeChild && (
          <ScrollReveal>
            <section className="px-role-band mb-6 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="px-role-kicker text-[color:var(--px-success)]">Suivi parent</p>
                  <h2 className="mt-2 text-xl text-white">
                    Vue claire pour {activeChild.firstName} {activeChild.lastName}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/70">
                    Tu vois la charge du moment, le prochain axe de travail et le prochain rendez-vous
                    sans devoir dechiffrer des metriques abstraites.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="px-role-stat min-w-[180px]">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Charge</p>
                    <p className="mt-2 text-sm text-white">
                      {LOAD_RECOMMENDATION_LABELS[overview.lastLoadRecommendation]}
                    </p>
                  </div>
                  <div className="px-role-stat min-w-[180px]">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Axe d&apos;amélioration</p>
                    <p className="mt-2 text-sm text-white">{overview.nextFocus}</p>
                  </div>
                  <div className="px-role-stat min-w-[180px]">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Prochaine séance</p>
                    <p className="mt-2 text-sm text-white">
                      {nextUpcomingSession
                        ? formatLongDate(new Date(`${nextUpcomingSession.date}T12:00`))
                        : "À programmer"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {error && (
          <div className="px-card p-6">
            <p className="text-sm text-[color:var(--px-danger)]">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-skeleton h-28 rounded-2xl" />
            ))}
            <div className="md:col-span-2 px-skeleton h-64 rounded-2xl" />
            <div className="px-skeleton h-64 rounded-2xl" />
          </div>
        ) : children.length === 0 ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="px-card-strong p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  <ShieldIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg text-white">Inviter ton enfant</h3>
                  <p className="text-xs text-white/70">
                    Génère un lien unique à envoyer à ton enfant. Il sera lié automatiquement à ton compte.
                  </p>
                </div>
              </div>

              {!inviteCode ? (
                <button
                  type="button"
                  className="px-button mt-5 text-sm"
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                >
                  <BoltIcon className="h-4 w-4" />
                  {generatingInvite ? "Génération..." : "Générer un lien d'invitation"}
                </button>
              ) : (
                <div className="mt-5 space-y-3 rounded-2xl border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 p-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Lien d&apos;invitation
                    </p>
                    <p className="mt-1 break-all text-xs text-white/80">{inviteUrl}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="px-button-ghost text-xs"
                    >
                      {inviteCopied ? "Lien copié" : "Copier le lien"}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateInvite}
                      disabled={generatingInvite}
                      className="px-button-ghost text-xs"
                    >
                      Régénérer
                    </button>
                    <span className="text-[11px] text-white/60">
                      Code : <span className="font-semibold text-white">{inviteCode}</span>
                    </span>
                  </div>
                  {inviteExpiresAt && (
                    <p className="text-[11px] text-white/50">
                      Expire le {formatLongDate(new Date(inviteExpiresAt))}.
                    </p>
                  )}
                </div>
              )}

              {inviteNotice && (
                <div
                  className={`mt-4 rounded-xl border px-4 py-2 text-xs ${
                    inviteNotice.type === "success"
                      ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                      : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                  }`}
                >
                  {inviteNotice.text}
                </div>
              )}

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                  J&apos;ai déjà un code généré par mon enfant
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="px-input"
                    placeholder="Code de liaison"
                    value={linkCode}
                    onChange={(event) => setLinkCode(event.target.value.toUpperCase())}
                  />
                  <button className="px-button-ghost" type="button" onClick={handleLinkChild}>
                    Lier le joueur
                  </button>
                </div>
                {linkNotice && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-2 text-xs ${
                      linkNotice.type === "success"
                        ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                        : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                    }`}
                  >
                    {linkNotice.text}
                  </div>
                )}
              </div>
            </div>

            <div className="px-card p-6">
              <h3 className="text-lg text-white">Transition legacy</h3>
              {legacyChildHint ? (
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Ancienne fiche detectee pour {legacyChildHint.firstName} {legacyChildHint.lastName}.
                  Elle n&apos;est plus utilisee comme source principale: créé ou connecte maintenant un
                  vrai compte joueur avec un code de liaison.
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Aucun enfant lié pour le moment. Une fois un compte joueur connecte, tu retrouveras
                  ici les séances, la progression et les recommandations coach.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <ScrollReveal>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/50">Enfants liés</span>
                {children.map((child) => (
                  <button
                    key={child.userId}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      activeChildId === child.userId
                        ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                    onClick={() => setActiveChildId(child.userId)}
                  >
                    {child.firstName} {child.lastName}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10 px-3 py-1 text-xs text-[color:var(--px-accent)] transition hover:border-[color:var(--px-accent)] hover:bg-[color:var(--px-accent)]/15 disabled:opacity-50"
                >
                  {generatingInvite ? "Génération..." : "+ Inviter un enfant"}
                </button>
              </div>
            </ScrollReveal>

            {(inviteCode || inviteNotice) && (
              <ScrollReveal>
                <div className="mb-6 rounded-2xl border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 p-4">
                  {inviteCode && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                          Lien d&apos;invitation
                        </p>
                        <p className="mt-1 break-all text-xs text-white/80">{inviteUrl}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyInvite}
                          className="px-button-ghost text-xs"
                        >
                          {inviteCopied ? "Lien copié" : "Copier le lien"}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateInvite}
                          disabled={generatingInvite}
                          className="px-button-ghost text-xs"
                        >
                          Régénérer
                        </button>
                        <span className="text-[11px] text-white/60">
                          Code :{" "}
                          <span className="font-semibold text-white">{inviteCode}</span>
                        </span>
                      </div>
                      {inviteExpiresAt && (
                        <p className="text-[11px] text-white/50">
                          Expire le {formatLongDate(new Date(inviteExpiresAt))}.
                        </p>
                      )}
                    </div>
                  )}
                  {inviteNotice && (
                    <div
                      className={`${inviteCode ? "mt-3 " : ""}rounded-xl border px-4 py-2 text-xs ${
                        inviteNotice.type === "success"
                          ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
                          : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
                      }`}
                    >
                      {inviteNotice.text}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}

            {activeChild && (
              <ScrollReveal>
                <div className="mb-6 px-card-strong p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                      <ShieldIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white">
                        {activeChild.firstName} {activeChild.lastName}
                      </h3>
                      <p className="text-xs text-white/70">
                        {activeChild.currentClub || "Compte joueur lié"}
                        {parentName ? ` · suivi par ${parentName.split(" ")[0]}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAge(activeChild.birthDate) !== null && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {getAge(activeChild.birthDate)} ans
                      </span>
                    )}
                    {activeChild.ageCategory && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {activeChild.ageCategory}
                      </span>
                    )}
                    {activeChild.level && (
                      <span className="rounded-full border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/10 px-3 py-1 text-xs text-[color:var(--px-warning)]">
                        {activeChild.level}
                      </span>
                    )}
                    {activeChild.position && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {activeChild.position}
                      </span>
                    )}
                    {activeChild.dominantFoot && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {activeChild.dominantFoot}
                      </span>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              {[
                {
                  label: "Enfants lies",
                  value: children.length,
                  icon: <UserIcon className="h-5 w-5" />,
                  color: "text-[color:var(--px-accent)]",
                },
                {
                  label: "Séances terminées",
                  value: completedCount,
                  icon: <BoltIcon className="h-5 w-5" />,
                  color: "text-[color:var(--px-success)]",
                },
                {
                  label: "Total investi",
                  value: `${totalSpent}€`,
                  icon: <CalendarIcon className="h-5 w-5" />,
                  color: "text-[color:var(--px-warning)]",
                },
                {
                  label: "Coachs visibles",
                  value: coachCount,
                  icon: <StarIcon className="h-5 w-5" />,
                  color: "text-[color:var(--px-accent)]",
                },
              ].map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 60}>
                  <div className="px-card flex items-center gap-4 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-white">{stat.value}</p>
                      <p className="text-xs text-white/70">{stat.label}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="px-card p-6">
                    <h3 className="mb-5 text-base font-semibold text-[color:var(--px-text)]">
                      Suivi de progression
                    </h3>
                    <div className="space-y-5">
                      {metricBars.map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm text-[color:var(--px-text-secondary)]">
                              {metric.label}
                            </span>
                            <span className="text-sm font-semibold text-[color:var(--px-text)]">
                              {metric.value}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal>
                  <div className="px-card-strong p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg text-white">Séances a venir</h3>
                      <Link href="/sessions" className="text-xs text-[color:var(--px-accent)] hover:underline">
                        Voir tout
                      </Link>
                    </div>
                    {upcomingSessions.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                        <CalendarIcon className="mx-auto h-8 w-8 text-white/20" />
                        <p className="mt-2 text-sm text-white/70">
                          Aucune séance programmée pour cet enfant.
                        </p>
                        <Link href="/booking" className="px-button mt-4 text-sm">
                          Reserver une séance
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                                <CalendarIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{session.title}</p>
                                <p className="text-xs text-white/70">
                                  {formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--px-accent)]">
                              A venir
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              </div>

              <div className="space-y-6">
                <ScrollReveal>
                  <div className="px-card p-6">
                    <h3 className="text-lg text-white">Recommandation coach</h3>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Charge actuelle</p>
                      <p className="mt-2 text-lg text-white">
                        {LOAD_RECOMMENDATION_LABELS[overview.lastLoadRecommendation]}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">Axe d&apos;amélioration</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{overview.nextFocus}</p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal>
                  <div className="px-card-strong p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg text-white">Top coachs</h3>
                      <Link href="/coach" className="text-xs text-[color:var(--px-accent)] hover:underline">
                        Voir tout
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {coaches.map((coach) => (
                        <div
                          key={coach.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-transparent text-white/70">
                              <WhistleIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{coach.name}</p>
                              <p className="text-xs text-white/70">{coach.speciality}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">{coach.rating?.toFixed(1) ?? "-"}</p>
                            <Link
                              href={`/coach/${coach.id}`}
                              className="text-xs text-[color:var(--px-accent)] hover:underline"
                            >
                              Voir profil
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal>
                  <div className="px-card p-6">
                    <h3 className="mb-4 text-lg text-white">Actions parent</h3>
                    <div className="grid gap-3">
                      <Link href="/booking" className="px-button inline-flex items-center gap-2">
                        <BoltIcon className="h-4 w-4" />
                        Reserver une séance
                        <ArrowRightIcon className="ml-auto h-4 w-4" />
                      </Link>
                      <Link href="/messages" className="px-button-ghost inline-flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Ecrire a un coach
                        <ArrowRightIcon className="ml-auto h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

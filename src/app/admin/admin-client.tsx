"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import ConfirmModal from "@/components/confirm-modal";
import { Notice, type NoticeData } from "@/components/notice";
import {
  WhistleIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/icons";
import {
  checkIsAdmin,
  getAdminDashboardStats,
  getCoachesForReview,
  verifyCoach,
  type AdminCoachRecord,
  type AdminStats,
} from "@/lib/data/admin";

type Tab = "coaches" | "stats";

const EMPTY_STATS: AdminStats = { coaches: 0, players: 0, sessions: 0, bookings: 0 };

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/* ── Stat card (reuses pattern from public-stats) ── */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[color:var(--px-accent)]/30 hover:bg-white/8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">{label}</p>
      </div>
    </div>
  );
}

/* ── Coach card ── */
function CoachCard({
  coach,
  onApprove,
  onReject,
  busy,
}: {
  coach: AdminCoachRecord;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div className="px-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {/* Avatar placeholder */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60">
          <WhistleIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{coach.name}</p>
            {coach.verified && (
              <span className="px-badge flex items-center gap-1 text-[10px]">
                <CheckCircleIcon className="h-3 w-3" />
                Vérifie
              </span>
            )}
          </div>
          <p className="text-xs text-white/70">{coach.speciality}</p>
          {coach.diplomas.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {coach.diplomas.map((diploma) => (
                <span key={diploma} className="px-pill text-[10px]">
                  {diploma}
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-[10px] text-white/40">
            Inscrit le {formatDate(coach.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {!coach.verified ? (
          <>
            <button
              className="rounded-xl bg-[color:var(--px-success)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              onClick={onApprove}
              disabled={busy}
              type="button"
            >
              Approuver
            </button>
            <button
              className="rounded-xl bg-[color:var(--px-danger)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              onClick={onReject}
              disabled={busy}
              type="button"
            >
              Rejeter
            </button>
          </>
        ) : (
          <button
            className="px-button-ghost text-xs"
            onClick={onReject}
            disabled={busy}
            type="button"
          >
            Revoquer
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main admin component ── */
export default function AdminClient() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("coaches");
  const [coaches, setCoaches] = useState<AdminCoachRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeData>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    tone: "danger" | "warning";
    onConfirm: () => void;
  } | null>(null);

  // Check admin access
  useEffect(() => {
    let mounted = true;
    checkIsAdmin().then((result) => {
      if (mounted) setIsAdmin(result);
    });
    return () => { mounted = false; };
  }, []);

  // Fetch data once admin is confirmed
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coachesData, statsData] = await Promise.all([
        getCoachesForReview(),
        getAdminDashboardStats(),
      ]);
      setCoaches(coachesData);
      setStats(statsData);
    } catch {
      setNotice({ type: "error", text: "Erreur lors du chargement des donnees." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const handleVerify = useCallback(
    (coachId: string, verified: boolean) => {
      const action = verified ? "approuver" : "revoquer la verification de";
      const coachName = coaches.find((c) => c.id === coachId)?.name ?? "ce coach";

      setConfirmAction({
        title: verified ? "Approuver le coach" : "Revoquer la verification",
        description: `Voulez-vous ${action} ${coachName} ?`,
        tone: verified ? "warning" : "danger",
        onConfirm: async () => {
          setConfirmAction(null);
          setBusy(true);
          try {
            await verifyCoach(coachId, verified);
            setCoaches((prev) =>
              prev.map((c) => (c.id === coachId ? { ...c, verified } : c)),
            );
            setNotice({
              type: "success",
              text: verified
                ? `${coachName} a ete approuve.`
                : `Verification de ${coachName} revoquee.`,
            });
          } catch {
            setNotice({ type: "error", text: "Erreur lors de la mise à jour." });
          } finally {
            setBusy(false);
          }
        },
      });
    },
    [coaches],
  );

  // ── Access denied ──
  if (isAdmin === false) {
    return (
      <AppShell active="/admin" title="Administration">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <ShieldIcon className="h-12 w-12 text-[color:var(--px-danger)]" />
          <h2 className="text-xl font-semibold text-white">Accès refuse</h2>
          <p className="text-sm text-white/70">
            Vous n&apos;avez pas les droits d&apos;acces a cette page.
          </p>
        </div>
      </AppShell>
    );
  }

  // ── Loading auth check ──
  if (isAdmin === null) {
    return (
      <AppShell active="/admin" title="Administration">
        <div className="px-container py-10">
          <div className="px-skeleton h-[400px]" />
        </div>
      </AppShell>
    );
  }

  const pendingCoaches = coaches.filter((c) => !c.verified);
  const verifiedCoaches = coaches.filter((c) => c.verified);

  return (
    <AppShell active="/admin" title="Administration">
      {/* ── Notice ── */}
      {notice && (
        <div className="mb-4">
          <Notice notice={notice} />
        </div>
      )}

      {/* ── Tab navigation ── */}
      <div className="mb-6 flex gap-2">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === "coaches"
              ? "bg-[color:var(--px-accent)] text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => setTab("coaches")}
          type="button"
        >
          Coachs en attente
          {pendingCoaches.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
              {pendingCoaches.length}
            </span>
          )}
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === "stats"
              ? "bg-[color:var(--px-accent)] text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => setTab("stats")}
          type="button"
        >
          Statistiques
        </button>
      </div>

      {/* ── Coachs en attente tab ── */}
      {tab === "coaches" && (
        <div className="px-stack-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-skeleton h-24" />
              ))}
            </div>
          ) : (
            <>
              {/* Pending coaches */}
              {pendingCoaches.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    En attente de verification ({pendingCoaches.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingCoaches.map((coach) => (
                      <CoachCard
                        key={coach.id}
                        coach={coach}
                        onApprove={() => handleVerify(coach.id, true)}
                        onReject={() => handleVerify(coach.id, false)}
                        busy={busy}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Verified coaches */}
              {verifiedCoaches.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    Coachs vérifiés ({verifiedCoaches.length})
                  </h2>
                  <div className="space-y-3">
                    {verifiedCoaches.map((coach) => (
                      <CoachCard
                        key={coach.id}
                        coach={coach}
                        onApprove={() => handleVerify(coach.id, true)}
                        onReject={() => handleVerify(coach.id, false)}
                        busy={busy}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {coaches.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <WhistleIcon className="h-10 w-10 text-white/30" />
                  <p className="text-sm text-white/50">Aucun coach inscrit pour le moment.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Statistiques tab ── */}
      {tab === "stats" && (
        <div className="px-stack-3">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-skeleton h-20" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<WhistleIcon className="h-5 w-5" />}
                label="Coachs"
                value={stats.coaches}
              />
              <StatCard
                icon={<UsersIcon className="h-5 w-5" />}
                label="Joueurs"
                value={stats.players}
              />
              <StatCard
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Séances"
                value={stats.sessions}
              />
              <StatCard
                icon={<StarIcon className="h-5 w-5" />}
                label="Réservations"
                value={stats.bookings}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Confirm modal ── */}
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        tone={confirmAction?.tone ?? "danger"}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </AppShell>
  );
}

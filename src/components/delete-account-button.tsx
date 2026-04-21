"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Bouton de suppression de compte. Utilise la RPC `delete_my_account`
 * qui efface les profiles + coaches + bookings + sessions + reviews +
 * conversations + messages + parent_children + notifications liés à
 * l'utilisateur courant, puis signOut et hard reload vers l'accueil.
 *
 * La ligne `auth.users` reste (suppression réservée au service role) —
 * l'admin peut la clean depuis le dashboard Supabase. Le user peut
 * aussi se ré-inscrire avec le même email sans conflit.
 */
export default function DeleteAccountButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "SUPPRIMER";

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("delete_my_account");
    if (rpcError) {
      setError(rpcError.message);
      setDeleting(false);
      return;
    }

    // Sign out + hard navigation vers l'accueil (cookies propres).
    await supabase.auth.signOut().catch(() => {});
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  };

  return (
    <div className="rounded-2xl border border-[color:var(--px-danger)]/25 bg-[color:var(--px-danger)]/5 p-5">
      <p className="text-sm font-semibold text-[color:var(--px-danger)]">
        Supprimer mon compte
      </p>
      <p className="mt-1 text-xs text-white/70">
        Action définitive : efface ton profil, tes séances, tes avis et toute ta
        messagerie. Tu peux te ré-inscrire avec le même email ensuite.
      </p>

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => {
            setConfirmOpen(true);
            setConfirmText("");
            setError(null);
          }}
          className="mt-4 rounded-xl border border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/10 px-4 py-2 text-xs font-semibold text-[color:var(--px-danger)] transition hover:bg-[color:var(--px-danger)]/20"
        >
          Supprimer définitivement
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.2em] text-white/60">
            Tape <span className="font-mono text-white">SUPPRIMER</span> pour confirmer
          </label>
          <input
            type="text"
            className="px-input"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoFocus
            aria-label="Tape SUPPRIMER pour confirmer la suppression"
          />
          {error && (
            <p className="rounded-lg border border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/10 px-3 py-2 text-xs text-[color:var(--px-danger)]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="rounded-xl bg-[color:var(--px-danger)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Suppression..." : "Je confirme, supprimer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={deleting}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

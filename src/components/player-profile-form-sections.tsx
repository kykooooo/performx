"use client";

import { useMemo } from "react";
import { DEPARTMENTS } from "@/lib/constants";
import {
  AGE_CATEGORIES,
  DOMINANT_FEET,
  PLAYER_LEVELS,
  PLAYER_POSITIONS,
  TRAINING_FREQUENCY_OPTIONS,
  getPositionFamily,
  getPositionObjectives,
} from "@/lib/football";
import type { PlayerProfileValues } from "@/lib/player-profile";
import { ShieldIcon, UserIcon } from "./icons";

type Props = {
  values: PlayerProfileValues;
  onChange: (
    field: keyof PlayerProfileValues,
    value: PlayerProfileValues[keyof PlayerProfileValues],
  ) => void;
  onToggleObjective: (objective: string) => void;
  showIdentity?: boolean;
  showPrivacyHint?: boolean;
};

export default function PlayerProfileFormSections({
  values,
  onChange,
  onToggleObjective,
  showIdentity = true,
  showPrivacyHint = true,
}: Props) {
  const positionFamily = useMemo(() => getPositionFamily(values.position), [values.position]);
  const suggestedObjectives = useMemo(
    () => getPositionObjectives(positionFamily),
    [positionFamily],
  );

  return (
    <div className="space-y-6">
      {showIdentity && (
        <div className="px-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg text-white">Identite</h3>
              <p className="text-xs text-white/70">Informations de base du joueur</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Prénom</label>
              <input
                className="px-input mt-2"
                value={values.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Nom</label>
              <input
                className="px-input mt-2"
                value={values.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
                placeholder="Nom"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Genre</label>
              <select
                className="px-select mt-2"
                value={values.gender}
                onChange={(event) => onChange("gender", event.target.value)}
              >
                <option value="">Selectionner</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Date de naissance</label>
              <input
                className="px-input mt-2"
                type="date"
                value={values.birthDate}
                onChange={(event) => onChange("birthDate", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Departement</label>
            <select
              className="px-select mt-2"
              value={values.department}
              onChange={(event) => onChange("department", event.target.value)}
            >
              <option value="">Selectionner</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="px-card-strong p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg text-white">Projet football</h3>
            <p className="text-xs text-white/70">Poste, charge et objectifs terrain</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Niveau</label>
            <select
              className="px-select mt-2"
              value={values.level}
              onChange={(event) => onChange("level", event.target.value)}
            >
              <option value="">Selectionner</option>
              {PLAYER_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Poste détaillé</label>
            <select
              className="px-select mt-2"
              value={values.position}
              onChange={(event) => onChange("position", event.target.value)}
            >
              <option value="">Selectionner</option>
              {PLAYER_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Pied fort</label>
            <select
              className="px-select mt-2"
              value={values.dominantFoot}
              onChange={(event) => onChange("dominantFoot", event.target.value)}
            >
              <option value="">Selectionner</option>
              {DOMINANT_FEET.map((foot) => (
                <option key={foot} value={foot}>
                  {foot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Frequence hebdo</label>
            <select
              className="px-select mt-2"
              value={values.trainingFrequency}
              onChange={(event) =>
                onChange(
                  "trainingFrequency",
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            >
              <option value="">Selectionner</option>
              {TRAINING_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Club actuel</label>
            <input
              className="px-input mt-2"
              value={values.currentClub}
              onChange={(event) => onChange("currentClub", event.target.value)}
              placeholder="Club actuel"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Categorie d&apos;age</label>
            <select
              className="px-select mt-2"
              value={values.ageCategory}
              onChange={(event) => onChange("ageCategory", event.target.value)}
            >
              <option value="">Selectionner</option>
              {AGE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {suggestedObjectives.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/70">Objectifs lies au poste</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedObjectives.map((objective) => {
                const checked = values.positionObjectives.includes(objective);
                return (
                  <label
                    key={objective}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${
                      checked
                        ? "border-[color:var(--px-accent)]/50 bg-[color:var(--px-accent)]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={checked}
                      onChange={() => onToggleObjective(objective)}
                    />
                    {objective}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Objectifs personnels</label>
          <textarea
            className="mt-2 min-h-[110px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
            value={values.objectives}
            onChange={(event) => onChange("objectives", event.target.value)}
            placeholder="Ex: gagner en vitesse de decision, mieux finir mes actions..."
          />
        </div>
      </div>

      <div className="px-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg text-white">Charge et sante</h3>
            <p className="text-xs text-white/70">Infos privees utiles aux parents lies et aux coachs</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Historique de blessure</label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
              value={values.injuryHistory}
              onChange={(event) => onChange("injuryHistory", event.target.value)}
              placeholder="Ex: entorse cheville droite en 2024, reprise complète."
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/70">Contraintes de charge</label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[color:var(--px-accent)] focus:ring-2 focus:ring-[color:var(--px-accent)]/30"
              value={values.loadConstraints}
              onChange={(event) => onChange("loadConstraints", event.target.value)}
              placeholder="Ex: eviter les doubles séances explosives sur 48h."
            />
          </div>
        </div>

        {showPrivacyHint && (
          <p className="mt-3 text-[11px] text-white/50">
            Ces informations restent privees: elles sont visibles par le joueur, ses parents lies et ses coachs engages.
          </p>
        )}
      </div>
    </div>
  );
}

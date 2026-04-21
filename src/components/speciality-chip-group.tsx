"use client";

import { COACH_SPECIALITIES } from "@/lib/football";
import { getSpecialityEmoji } from "@/lib/football-surface";

/**
 * Composant unifié pour afficher les spécialités coach en chips.
 *
 * Remplace les 3 rendus différents qui coexistaient (select natif à
 * l'inscription, checkboxes custom côté profile edit, chips avec
 * emoji + counter sur /coach). Un seul design pour un seul concept :
 * chips arrondis, emoji de la spé, état actif en accent orange.
 *
 * Supporte :
 * - mode single-select (inscription)  → `value` + `onChange`
 * - mode multi-select (profile edit)   → `selectedValues` + `onMultiChange`
 * - option `showCount` + `counts`      → chips avec counter pill (/coach)
 * - option `specialities`              → liste custom (ex: inclure "Tous")
 */
export type SpecialityChipItem = {
  key: string;
  label?: string;
  /**
   * Emoji à afficher :
   *  - undefined  → fallback automatique via getSpecialityEmoji(key)
   *  - string     → emoji explicite (ex: "🌱")
   *  - null       → pas d'emoji (cas du chip "Tous")
   */
  emoji?: string | null;
};

type BaseProps = {
  /** Liste personnalisée. Par défaut : COACH_SPECIALITIES. */
  specialities?: readonly SpecialityChipItem[] | readonly string[];
  /** Afficher un compteur pill à droite de chaque chip. */
  showCount?: boolean;
  counts?: Record<string, number>;
  /** Si true et hasCoaches=false, on ne désactive pas les chips à 0. */
  hasCoaches?: boolean;
  /** Label optionnel affiché au-dessus du groupe. */
  label?: string;
  /** Aide contextuelle sous le label. */
  helper?: string;
  /** Nombre de colonnes CSS. Default: responsive (2 sm:3). */
  columns?: "auto" | "two" | "three";
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string) => void;
  selectedValues?: never;
  onMultiChange?: never;
};

type MultiProps = BaseProps & {
  multiple: true;
  selectedValues: string[];
  onMultiChange: (values: string[]) => void;
  value?: never;
  onChange?: never;
};

type Props = SingleProps | MultiProps;

function normalizeItems(
  items?: readonly SpecialityChipItem[] | readonly string[],
): SpecialityChipItem[] {
  if (!items) {
    return COACH_SPECIALITIES.map((key) => ({ key }));
  }
  if (typeof items[0] === "string") {
    return (items as readonly string[]).map((key) => ({ key }));
  }
  return [...(items as readonly SpecialityChipItem[])];
}

export default function SpecialityChipGroup(props: Props) {
  const {
    specialities,
    showCount = false,
    counts,
    hasCoaches = true,
    label,
    helper,
    columns = "auto",
  } = props;

  const items = normalizeItems(specialities);

  const isSelected = (key: string): boolean => {
    if (props.multiple) return props.selectedValues.includes(key);
    return props.value === key;
  };

  const toggle = (key: string) => {
    if (props.multiple) {
      const current = props.selectedValues;
      const next = current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key];
      props.onMultiChange(next);
    } else {
      props.onChange(key);
    }
  };

  const gridClass =
    columns === "two"
      ? "grid grid-cols-2 gap-2"
      : columns === "three"
        ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
        : "flex flex-wrap gap-2";

  return (
    <div>
      {label && (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{label}</p>
      )}
      {helper && <p className="mt-1 text-[11px] text-white/60">{helper}</p>}
      <div className={`${label || helper ? "mt-3 " : ""}${gridClass}`}>
        {items.map((item) => {
          const active = isSelected(item.key);
          const count = counts?.[item.key] ?? 0;
          // null explicite → pas d'emoji ; undefined → fallback auto
          const chipEmoji =
            item.emoji === null ? null : (item.emoji ?? getSpecialityEmoji(item.key));
          const disabled = showCount && hasCoaches && count === 0 && item.key !== "Tous";
          const displayCount = showCount && hasCoaches && count > 0;
          const labelText = item.label ?? item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => !disabled && toggle(item.key)}
              disabled={disabled}
              aria-pressed={active}
              className={`group inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
                active
                  ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] shadow-[0_0_0_3px_rgba(255,106,0,0.08)]"
                  : disabled
                    ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/30"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-white/30 hover:text-white"
              }`}
            >
              {chipEmoji && (
                <span className="text-sm leading-none" aria-hidden="true">
                  {chipEmoji}
                </span>
              )}
              <span className="truncate">{labelText}</span>
              {displayCount && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-[color:var(--px-accent)]/20 text-[color:var(--px-accent)]"
                      : "bg-white/5 text-white/50"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

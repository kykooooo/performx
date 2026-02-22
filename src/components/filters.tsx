import { FilterIcon, SearchIcon } from "./icons";

export default function FilterBar() {
  return (
    <div className="px-card px-fade-up flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Filtres rapides</p>
          <p className="text-xs text-white/50">Affine ta recherche pour trouver le coach idéal.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input className="px-input pl-9" placeholder="Rechercher..." aria-label="Rechercher un coach" />
          </div>
          <button className="px-button-ghost" type="button">
            <FilterIcon className="h-4 w-4" />
            Plus de filtres
          </button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="px-outline p-3">
          <label htmlFor="filter-speciality" className="text-[11px] uppercase tracking-[0.2em] text-white/50">Spécialité</label>
          <select id="filter-speciality" className="px-select mt-2">
            <option>Spécialité</option>
            <option>Technique</option>
            <option>Vitesse</option>
            <option>Gardien</option>
          </select>
        </div>
        <div className="px-outline p-3">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/50">Disponibilité</label>
          <div className="mt-2 flex items-center gap-3">
            <input className="px-input" type="date" aria-label="Date de début" />
            <span className="text-white/50" aria-hidden="true">→</span>
            <input className="px-input" type="date" aria-label="Date de fin" />
          </div>
        </div>
        <div className="px-outline p-3">
          <label htmlFor="filter-distance" className="text-[11px] uppercase tracking-[0.2em] text-white/50">Distance</label>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-white/50">15 km</span>
            <input id="filter-distance" className="w-full cursor-pointer" type="range" aria-label="Distance maximale" aria-valuemin={15} aria-valuemax={75} />
            <span className="text-xs text-white/50">75 km</span>
          </div>
        </div>
        <div className="px-outline p-3">
          <label htmlFor="filter-budget" className="text-[11px] uppercase tracking-[0.2em] text-white/50">Budget</label>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-white/50">15€</span>
            <input id="filter-budget" className="w-full cursor-pointer" type="range" aria-label="Budget maximum" aria-valuemin={15} aria-valuemax={80} />
            <span className="text-xs text-white/50">80€</span>
          </div>
        </div>
      </div>
    </div>
  );
}

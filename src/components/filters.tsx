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
            <input className="px-input pl-9" placeholder="Rechercher..." />
          </div>
          <button className="px-button-ghost" type="button">
            <FilterIcon className="h-4 w-4" />
            Plus de filtres
          </button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="px-outline p-3">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Spécialité</label>
          <select className="px-select mt-2">
            <option>Spécialité</option>
            <option>Technique</option>
            <option>Vitesse</option>
            <option>Gardien</option>
          </select>
        </div>
        <div className="px-outline p-3">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Disponibilité</label>
          <div className="mt-2 flex items-center gap-3">
            <input className="px-input" type="date" />
            <span className="text-white/40">→</span>
            <input className="px-input" type="date" />
          </div>
        </div>
        <div className="px-outline p-3">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Distance</label>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-white/50">15 km</label>
            <input className="w-full cursor-pointer" type="range" />
            <label className="text-xs text-white/50">75 km</label>
          </div>
        </div>
        <div className="px-outline p-3">
          <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Budget</label>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-white/50">15€</label>
            <input className="w-full cursor-pointer" type="range" />
            <label className="text-xs text-white/50">80€</label>
          </div>
        </div>
      </div>
    </div>
  );
}

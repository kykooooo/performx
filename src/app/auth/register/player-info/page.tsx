import AuthShell from "@/components/auth-shell";

export default function PlayerInfoPage() {
  return (
    <AuthShell
      title="Informations sur votre niveau de jeu"
      subtitle="Donnez-nous plus d'informations pour compléter votre profil de joueur."
    >
      <form className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <select className="px-select">
            <option>Latéralité</option>
            <option>Droitier</option>
            <option>Gaucher</option>
            <option>Ambidextre</option>
          </select>
          <select className="px-select">
            <option>Poste de jeu</option>
            <option>Défenseur</option>
            <option>Milieu</option>
            <option>Attaquant</option>
            <option>Gardien</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="px-select">
            <option>Niveau de pratique</option>
            <option>Débutant</option>
            <option>Intermédiaire</option>
            <option>Confirmé</option>
          </select>
          <input className="px-input" placeholder="Club actuel (optionnel)" />
        </div>
        <input className="px-input" placeholder="Localisation" />
        <select className="px-select">
          <option>Objectifs personnels</option>
          <option>Préparation physique</option>
          <option>Technique</option>
          <option>Détection</option>
        </select>
        <textarea
          className="min-h-[120px] w-full rounded-xl border border-[color:var(--px-border)] bg-[color:var(--px-surface)] px-4 py-3 text-sm text-white/90 outline-none"
          placeholder="Dites-nous en plus..."
        />
        <button className="px-button w-full" type="submit">
          Valider
        </button>
      </form>
    </AuthShell>
  );
}

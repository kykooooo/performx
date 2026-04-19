import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation",
};

export default function CGUPage() {
  return (
    <AppShell title="Conditions Generales d'Utilisation">
      <div className="prose prose-invert max-w-3xl">
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les presentes Conditions Generales d&apos;Utilisation (ci-apres
          &quot;CGU&quot;) regissent l&apos;utilisation de la plateforme
          PerformX, accessible a l&apos;adresse performx.app. En accedant a la
          plateforme, vous acceptez sans reserve l&apos;integralite des
          presentes CGU.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 1 - Acceptation des conditions
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          L&apos;utilisation de la plateforme PerformX implique
          l&apos;acceptation pleine et entiere des presentes CGU.
          L&apos;inscription sur la plateforme vaut acceptation de ces
          conditions. PerformX se reserve le droit de modifier les CGU a tout
          moment. Les utilisateurs seront informes de toute modification par
          notification sur la plateforme ou par email.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 2 - Comptes utilisateurs
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          La plateforme propose trois types de comptes : joueur, coach et
          parent. Chaque utilisateur s&apos;engage a fournir des informations
          exactes et a jour lors de son inscription. L&apos;utilisateur est
          responsable de la confidentialite de ses identifiants de connexion et
          de toutes les activites effectuees sous son compte.
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            Les joueurs peuvent consulter les profils des coachs, reserver des
            séances et suivre leur progression.
          </li>
          <li>
            Les coachs peuvent publier leur profil, gérer leurs disponibilités
            et fournir des retours sur les séances.
          </li>
          <li>
            Les parents peuvent suivre la progression de leurs enfants et
            gérer les réservations.
          </li>
        </ul>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX se reserve le droit de suspendre ou supprimer tout compte en
          cas de non-respect des presentes CGU.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 3 - Réservations et annulations
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les réservations de séances de coaching sont effectuees via la
          plateforme et sont soumises a la disponibilite du coach selectionne.
          Une fois la réservation confirmee, les conditions suivantes
          s&apos;appliquent :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            Toute annulation effectuee au moins 24 heures avant le debut de la
            séance donnera lieu a un remboursement integral.
          </li>
          <li>
            Toute annulation effectuee moins de 24 heures avant le debut de la
            séance ne donnera lieu a aucun remboursement.
          </li>
          <li>
            En cas d&apos;annulation par le coach, l&apos;utilisateur sera
            integralement rembourse et pourra reprogrammer la séance.
          </li>
          <li>
            En cas de non-presentation du joueur sans annulation prealable, la
            séance sera consideree comme effectuee.
          </li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 4 - Tarifs et rémunération
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les tarifs des séances de coaching sont fixés par chaque coach et
          affichés sur leur profil à titre indicatif. Pendant la phase de test
          de la plateforme, PerformX n&apos;encaisse aucun paiement en ligne :
          les modalités financières sont convenues directement entre le coach
          et le joueur (ou son parent) via la messagerie intégrée ou lors de
          la séance. Les prix affichés sont indiqués en euros toutes taxes
          comprises. PerformX se réserve le droit d&apos;introduire un
          paiement en ligne et une commission à une date ultérieure, les
          utilisateurs étant informés préalablement de tout changement.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 5 - Propriete intellectuelle
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          L&apos;ensemble des elements composant la plateforme PerformX
          (design, textes, logos, logiciels, base de donnees) sont la propriete
          exclusive de PerformX SAS et sont proteges par les lois relatives a
          la propriete intellectuelle. Toute reproduction, representation ou
          exploitation non autorisee de ces elements est interdite.
        </p>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les contenus publiés par les utilisateurs (commentaires, avis,
          photos de profil) restent la propriete de leurs auteurs.
          L&apos;utilisateur accorde a PerformX une licence non exclusive et
          gratuite d&apos;utilisation de ces contenus dans le cadre du
          fonctionnement de la plateforme.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 6 - Responsabilite
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX agit en tant qu&apos;intermediaire entre les joueurs et les
          coachs. A ce titre, PerformX ne saurait etre tenue responsable :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            De la qualite des séances de coaching dispensees par les coachs.
          </li>
          <li>
            Des dommages directs ou indirects resultant de l&apos;utilisation
            de la plateforme.
          </li>
          <li>
            Des litiges entre utilisateurs.
          </li>
          <li>
            Des interruptions temporaires du service pour maintenance ou mise a
            jour.
          </li>
        </ul>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX s&apos;engage a mettre en oeuvre tous les moyens
          raisonnables pour assurer la disponibilite et la securite de la
          plateforme.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 7 - Modification des CGU
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX se reserve le droit de modifier les presentes CGU a tout
          moment. Les modifications entrent en vigueur des leur publication sur
          la plateforme. L&apos;utilisation continue de la plateforme apres la
          publication des modifications vaut acceptation des nouvelles CGU.
          Les utilisateurs seront informes des modifications substantielles par
          email ou notification sur la plateforme.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Article 8 - Droit applicable et juridiction
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les presentes CGU sont regies par le droit francais. En cas de
          litige relatif a l&apos;interpretation ou a l&apos;execution des
          presentes conditions, les parties s&apos;efforceront de trouver une
          solution amiable. A defaut, tout litige sera soumis a la competence
          exclusive des tribunaux de Paris, sauf disposition legale contraire.
        </p>

        <p className="text-xs text-white/40 mt-12">
          Derniere mise à jour : avril 2026
        </p>
      </div>
    </AppShell>
  );
}

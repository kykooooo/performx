import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
};

export default function ConfidentialitePage() {
  return (
    <AppShell title="Politique de confidentialite">
      <div className="prose prose-invert max-w-3xl">
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          La presente politique de confidentialite decrit la maniere dont
          PerformX SAS collecte, utilise et protege les donnees personnelles
          des utilisateurs de la plateforme PerformX, conformement au
          Reglement General sur la Protection des Donnees (RGPD) et a la loi
          Informatique et Libertes.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          1. Donnees collectees
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Dans le cadre de l&apos;utilisation de la plateforme, nous
          collectons les donnees suivantes :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            Donnees d&apos;identification : nom, prenom, adresse email, date
            de naissance, photo de profil.
          </li>
          <li>
            Donnees relatives au profil sportif : position de jeu, pied
            prefere, categorie d&apos;age, niveau, club.
          </li>
          <li>
            Donnees de connexion : adresse IP, type de navigateur, pages
            consultees, dates et heures de connexion.
          </li>
          <li>
            Donnees de reservation : historique des seances, evaluations,
            retours des coachs.
          </li>
          <li>
            Donnees de messagerie : messages echanges entre utilisateurs via
            la plateforme.
          </li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">
          2. Finalites du traitement
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les donnees personnelles collectees sont utilisees pour les finalites
          suivantes :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            Gestion des comptes utilisateurs et authentification.
          </li>
          <li>
            Mise en relation entre joueurs, coachs et parents.
          </li>
          <li>
            Gestion des reservations et du suivi des seances.
          </li>
          <li>
            Suivi de la progression des joueurs et generation de statistiques.
          </li>
          <li>
            Communication entre les utilisateurs via la messagerie integree.
          </li>
          <li>
            Amelioration de la plateforme et analyse d&apos;usage.
          </li>
          <li>
            Envoi de notifications relatives aux seances et a l&apos;activite
            du compte.
          </li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">
          3. Base legale du traitement
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Le traitement des donnees repose sur les bases legales suivantes :
          l&apos;execution du contrat (creation de compte, reservations), le
          consentement (cookies, communications marketing), l&apos;interet
          legitime (amelioration du service, securite) et les obligations
          legales (facturation, conservation des donnees).
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          4. Duree de conservation
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Les donnees personnelles sont conservees pendant les durees
          suivantes :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            Donnees de compte : pendant toute la duree de l&apos;inscription,
            puis 3 ans apres la derniere activite du compte.
          </li>
          <li>
            Donnees de reservation et facturation : 5 ans conformement aux
            obligations legales.
          </li>
          <li>
            Donnees de connexion : 12 mois.
          </li>
          <li>
            Cookies : 13 mois maximum.
          </li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">
          5. Vos droits
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Conformement au RGPD, vous disposez des droits suivants concernant
          vos donnees personnelles :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            <strong className="text-white/90">Droit d&apos;acces</strong> :
            obtenir la confirmation que vos donnees sont traitees et en
            recevoir une copie.
          </li>
          <li>
            <strong className="text-white/90">Droit de rectification</strong> :
            demander la correction de donnees inexactes ou incompletes.
          </li>
          <li>
            <strong className="text-white/90">Droit a l&apos;effacement</strong> :
            demander la suppression de vos donnees dans les conditions prevues
            par le RGPD.
          </li>
          <li>
            <strong className="text-white/90">Droit a la portabilite</strong> :
            recevoir vos donnees dans un format structure et lisible par
            machine.
          </li>
          <li>
            <strong className="text-white/90">Droit d&apos;opposition</strong> :
            vous opposer au traitement de vos donnees pour des motifs
            legitimes.
          </li>
          <li>
            <strong className="text-white/90">
              Droit a la limitation du traitement
            </strong> :
            demander la suspension du traitement de vos donnees dans certains
            cas.
          </li>
        </ul>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Pour exercer ces droits, contactez-nous a l&apos;adresse :{" "}
          <a
            href="mailto:contact@performx.app"
            className="text-[color:var(--px-accent)] underline"
          >
            contact@performx.app
          </a>
          . Nous nous engageons a repondre dans un delai de 30 jours. Vous
          disposez egalement du droit d&apos;introduire une reclamation aupres
          de la CNIL (Commission Nationale de l&apos;Informatique et des
          Libertes).
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          6. Cookies
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          La plateforme utilise des cookies necessaires au fonctionnement du
          service (authentification, preferences). Des cookies analytiques
          peuvent egalement etre utilises pour mesurer l&apos;audience et
          ameliorer l&apos;experience utilisateur. Vous pouvez configurer votre
          navigateur pour refuser les cookies non essentiels.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          7. Sous-traitants et tiers
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Dans le cadre de son activite, PerformX fait appel aux sous-traitants
          suivants pour le traitement de donnees :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>
            <strong className="text-white/90">Supabase</strong> : hebergement
            de la base de donnees, authentification et stockage de fichiers
            (serveurs en Europe).
          </li>
          <li>
            <strong className="text-white/90">Vercel</strong> : hebergement de
            l&apos;application web et diffusion du contenu.
          </li>
          <li>
            <strong className="text-white/90">Sentry</strong> : suivi des
            erreurs et monitoring de la performance applicative.
          </li>
        </ul>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Ces sous-traitants sont soumis a des obligations contractuelles
          garantissant la protection de vos donnees. Aucune donnee n&apos;est
          vendue a des tiers.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          8. Securite des donnees
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX met en oeuvre des mesures techniques et organisationnelles
          appropriees pour assurer la securite des donnees personnelles :
          chiffrement des donnees en transit (TLS), controle d&apos;acces par
          roles (RLS), authentification securisee et sauvegardes regulieres.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          9. Delegue a la Protection des Donnees
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Pour toute question relative a la protection de vos donnees
          personnelles, vous pouvez contacter notre Delegue a la Protection
          des Donnees (DPO) a l&apos;adresse suivante :{" "}
          <a
            href="mailto:contact@performx.app"
            className="text-[color:var(--px-accent)] underline"
          >
            contact@performx.app
          </a>
        </p>

        <p className="text-xs text-white/40 mt-12">
          Derniere mise a jour : avril 2026
        </p>
      </div>
    </AppShell>
  );
}

import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <AppShell title="Contact">
      <div className="prose prose-invert max-w-3xl">
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Vous avez une question, une suggestion ou besoin d&apos;aide ?
          N&apos;hesitez pas a nous contacter. Notre equipe se fera un plaisir
          de vous repondre.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">Email</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Ecrivez-nous a l&apos;adresse suivante :{" "}
          <a
            href="mailto:contact@performx.app"
            className="text-[color:var(--px-accent)] underline"
          >
            contact@performx.app
          </a>
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">Delai de reponse</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Nous nous efforcons de repondre a toutes les demandes dans un delai
          de 48 heures ouvrables. Pour les demandes liees a vos droits sur
          les donnees personnelles (acces, rectification, suppression), le
          delai de reponse est de 30 jours conformement au RGPD.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">Objet de votre demande</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Afin de traiter votre demande au mieux, merci de preciser dans votre
          email :
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>Votre nom et prénom</li>
          <li>L&apos;adresse email associee a votre compte PerformX (le cas echeant)</li>
          <li>L&apos;objet de votre demande (question technique, signalement, partenariat, presse, etc.)</li>
          <li>Une description détaillée de votre demande</li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">Editeur</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          PerformX SAS
          <br />
          Email :{" "}
          <a
            href="mailto:contact@performx.app"
            className="text-[color:var(--px-accent)] underline"
          >
            contact@performx.app
          </a>
        </p>
      </div>
    </AppShell>
  );
}

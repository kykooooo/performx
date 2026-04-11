import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Mentions legales",
};

export default function MentionsLegalesPage() {
  return (
    <AppShell title="Mentions legales">
      <div className="prose prose-invert max-w-3xl">
        <h2 className="text-2xl text-white mt-8 mb-4">Editeur du site</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Le site PerformX est edite par la societe PerformX SAS, societe par
          actions simplifiee au capital de 10 000 euros, immatriculee au
          Registre du Commerce et des Societes de Paris.
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>Raison sociale : PerformX SAS</li>
          <li>Forme juridique : Societe par Actions Simplifiee</li>
          <li>Capital social : 10 000 euros</li>
          <li>Directeur de la publication : Le President de PerformX SAS</li>
          <li>Email : contact@performx.app</li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">Hebergement</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Le site est heberge par Vercel Inc., dont le siege social est situe au
          440 N Barranca Ave #4133, Covina, CA 91723, Etats-Unis.
        </p>
        <ul className="list-disc pl-6 text-sm text-white/70 space-y-1 mb-4">
          <li>Hebergeur : Vercel Inc.</li>
          <li>Site web : https://vercel.com</li>
        </ul>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Propriete intellectuelle
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          L&apos;ensemble des contenus presents sur le site PerformX
          (textes, images, logos, icones, logiciels, base de donnees) est
          protege par les lois francaises et internationales relatives a la
          propriete intellectuelle. Toute reproduction, representation,
          modification, publication ou adaptation de tout ou partie des
          elements du site est interdite sans autorisation ecrite prealable de
          PerformX SAS.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Donnees personnelles
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Conformement a la loi n° 78-17 du 6 janvier 1978 relative a
          l&apos;informatique, aux fichiers et aux libertes, et au Reglement
          General sur la Protection des Donnees (RGPD), vous disposez d&apos;un
          droit d&apos;acces, de rectification et de suppression des donnees
          vous concernant. Pour exercer ces droits, veuillez nous contacter a
          l&apos;adresse : contact@performx.app.
        </p>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Pour plus d&apos;informations sur le traitement de vos donnees
          personnelles, veuillez consulter notre Politique de confidentialite.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">
          Declaration CNIL
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Conformement aux dispositions du RGPD, le traitement des donnees
          personnelles effectue par PerformX a fait l&apos;objet d&apos;une
          inscription au registre des activites de traitement tenu par le
          responsable de traitement, en conformite avec l&apos;article 30 du
          RGPD. PerformX s&apos;engage a assurer la protection des donnees
          personnelles collectees et a ne les traiter que dans le respect de la
          reglementation en vigueur.
        </p>

        <h2 className="text-2xl text-white mt-8 mb-4">Contact</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Pour toute question ou demande d&apos;information concernant le site,
          vous pouvez nous contacter par email a l&apos;adresse suivante :{" "}
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

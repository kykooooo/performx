import { headers } from "next/headers";

type JsonLdProps = {
  data: Record<string, unknown>;
};

export default async function JsonLd({ data }: JsonLdProps) {
  let nonce = "";
  try {
    nonce = (await headers()).get("x-nonce") ?? "";
  } catch {
    // headers() unavailable during static generation
  }

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

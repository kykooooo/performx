import Script from "next/script";

type AnalyticsProps = {
  nonce?: string;
};

export default function Analytics({ nonce }: AnalyticsProps) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!plausibleDomain && !gaId) return null;

  if (plausibleDomain) {
    return (
      <Script
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
        data-domain={plausibleDomain}
        nonce={nonce}
      />
    );
  }

  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" nonce={nonce} />
      <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const siteUrl = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/booking/", "/sessions", "/messages"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

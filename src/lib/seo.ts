import cafesData from "../../data/cafes.json";
import { cafesSchema } from "./schema";

const DEFAULT_SITE_URL = "https://cafeblr.com";
const configuredSiteUrl = import.meta.env.PUBLIC_SITE_URL?.trim();
const siteUrl = (configuredSiteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");

const cafes = cafesSchema.parse(cafesData);
const sortedCafes = [...cafes].sort((a, b) => b.id - a.id);

const areaCounts = new Map<string, number>();
for (const cafe of cafes) {
  areaCounts.set(cafe.area, (areaCounts.get(cafe.area) ?? 0) + 1);
}

export const seoStats = {
  cafeCount: cafes.length,
  areaCount: areaCounts.size,
  topAreas: [...areaCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5),
  latestCafes: sortedCafes.slice(0, 3).map((cafe) => ({
    name: cafe.name,
    area: cafe.area,
    knownFor: cafe.knownFor,
  })),
};

export const SEO = {
  siteName: "Cafe BLR",
  title: "Cafe BLR - nice cafes in Bengaluru, found by the internet",
  description:
    "Nice cafes in Bengaluru, found by the internet. Every spot comes from a post people actually loved, with directions and a link to the receipts.",
  siteUrl,
  canonicalUrl: `${siteUrl}/`,
  ogImageUrl: `${siteUrl}/og.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    "Cafe BLR, a directory of nice cafes in Bengaluru found from loved internet posts.",
  themeColor: "#ffffff",
  accentColor: "#1e5f48",
  locale: "en_IN",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: SEO.siteName,
  headline: SEO.title,
  description: SEO.description,
  url: SEO.canonicalUrl,
  image: SEO.ogImageUrl,
  inLanguage: "en-IN",
  isPartOf: {
    "@type": "WebSite",
    name: SEO.siteName,
    url: SEO.canonicalUrl,
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: cafes.length,
    itemListElement: sortedCafes.map((cafe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: cafe.name,
        description: cafe.knownFor,
        image: cafe.image,
        sameAs: cafe.source,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          addressCountry: "IN",
        },
      },
    })),
  },
};

export const structuredDataJson = JSON.stringify(structuredData).replace(
  /</g,
  "\\u003c",
);

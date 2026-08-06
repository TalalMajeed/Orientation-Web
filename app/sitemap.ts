import type { MetadataRoute } from "next";

const siteUrl = "https://orientation.nust.edu.pk";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/schedule",
    "/map",
    "/contact",
    "/passes",
    "/scavenger-hunt",
    "/societies",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}

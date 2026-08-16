import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/hr", "/liaison", "/login"],
    },
    sitemap: "https://orientation.nust.edu.pk/sitemap.xml",
  };
}

import type { MetadataRoute } from "next";

/** https://skillsprinter.com/robots.txt — allow marketing pages, keep API and
 *  gated app pages out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/learn/"],
      },
    ],
    sitemap: "https://skillsprinter.com/sitemap.xml",
    host: "https://skillsprinter.com",
  };
}

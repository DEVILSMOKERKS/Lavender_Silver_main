/**
 * SEO-friendly XML sitemap generator (Google sitemap standards).
 *
 * Includes: all public, indexable pages (static + product + blog).
 * Excludes: admin, login, signup, cart, checkout, myaccount, thankyou, private flows.
 *
 * Output: frontend/public/sitemap.xml (served at /sitemap.xml).
 * URLs are canonical: no trailing slash, path segments normalized.
 *
 * Run: npm run generate-sitemap (or prebuild runs it before npm run build)
 * Env: SITE_URL (default https://pvjewellers.in), VITE_API_URL for dynamic URLs.
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  } catch (_) {}
}

loadEnv();

const SITE_URL = (process.env.SITE_URL || "https://pvjewellers.in").replace(/\/$/, "");
const API_URL = (process.env.VITE_API_URL || process.env.API_URL || "").replace(/\/$/, "");

const { SITEMAP_STATIC_ROUTES } = await import("../src/config/sitemapRoutes.js");

const today = new Date().toISOString().slice(0, 10);

function escapeXml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build one <url> entry. lastmod: YYYY-MM-DD (ISO 8601), changefreq/priority per Google spec. */
function urlEntry(loc, lastmod = today, changefreq = "weekly", priority = "0.6") {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/** Canonical URL: base + path, no trailing slash (except empty path = /). Lowercase path where safe. */
function canonicalUrl(base, pathSegment) {
  const p = pathSegment.startsWith("/") ? pathSegment : `/${pathSegment}`;
  const normalized = p === "/" ? "" : p.replace(/\/+/g, "/").replace(/\/$/, "") || "";
  return `${base}${normalized || "/"}`;
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Fetch failed for ${url}:`, err.message);
    return null;
  }
}

async function getProductSlugs() {
  if (!API_URL) return [];
  const data = await fetchJson(`${API_URL}/api/products?limit=5000`);
  if (!data || !data.success) return [];
  const list = Array.isArray(data.data) ? data.data : data.data?.data || [];
  return list
    .map((p) => (p.slug && String(p.slug).trim()) || null)
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

async function getBlogSlugs() {
  if (!API_URL) return [];
  const data = await fetchJson(`${API_URL}/api/blogs`);
  const list = Array.isArray(data) ? data : data?.data || data?.blogs || [];
  return list
    .filter((b) => b.status === "published" || !b.status)
    .map((b) => (b.slug && String(b.slug).trim()) || null)
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

async function main() {
  const urls = [];

  for (const r of SITEMAP_STATIC_ROUTES) {
    const loc = canonicalUrl(SITE_URL, r.path);
    urls.push(
      urlEntry(loc, today, r.changefreq || "weekly", String(r.priority ?? 0.6))
    );
  }

  const productSlugs = await getProductSlugs();
  for (const slug of productSlugs) {
    const loc = canonicalUrl(SITE_URL, `/product/${encodeURIComponent(slug)}`);
    urls.push(urlEntry(loc, today, "weekly", "0.8"));
  }

  const blogSlugs = await getBlogSlugs();
  for (const slug of blogSlugs) {
    const loc = canonicalUrl(SITE_URL, `/blog/${encodeURIComponent(slug)}`);
    urls.push(urlEntry(loc, today, "monthly", "0.7"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join("\n")}
</urlset>
`;

  const outPath = path.resolve(__dirname, "..", "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf8");
  console.log(
    `[sitemap] Wrote ${urls.length} URLs to public/sitemap.xml (static: ${SITEMAP_STATIC_ROUTES.length}, products: ${productSlugs.length}, blogs: ${blogSlugs.length})`
  );
}

main().catch((err) => {
  console.error("[sitemap] Error:", err);
  process.exit(1);
});

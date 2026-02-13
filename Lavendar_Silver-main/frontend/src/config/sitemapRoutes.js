/**
 * SEO sitemap: indexable, public routes only.
 * Excluded from sitemap (do not add): admin, login, signup, cart, checkout,
 * myaccount, thankyou, video-cart/booking, video-cart/thankyou, compare.
 *
 * - Paths match app routes (e.g. /About-us). Use lowercase for new routes when possible.
 * - changefreq: always | hourly | daily | weekly | monthly | yearly
 * - priority: 0.0 to 1.0
 *
 * Dynamic URLs (products, blogs) are added by scripts/generate-sitemap.js from API.
 */

/** @type {{ path: string; changefreq?: string; priority?: number }[]} */
export const SITEMAP_STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/shop", changefreq: "daily", priority: 0.9 },
  { path: "/About-us", changefreq: "monthly", priority: 0.8 },
  { path: "/contact", changefreq: "monthly", priority: 0.7 },
  { path: "/blogs", changefreq: "weekly", priority: 0.8 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.5 },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: 0.5 },
  { path: "/return-and-cancellation", changefreq: "yearly", priority: 0.5 },
  { path: "/shipping-policy", changefreq: "yearly", priority: 0.5 },
  { path: "/faq", changefreq: "monthly", priority: 0.6 },
  { path: "/video-cart", changefreq: "weekly", priority: 0.7 },
  { path: "/old-gold", changefreq: "weekly", priority: 0.7 },
  { path: "/goldmine", changefreq: "weekly", priority: 0.7 },
  { path: "/goldmine-subscription", changefreq: "monthly", priority: 0.6 },
  { path: "/digital-gold", changefreq: "weekly", priority: 0.7 },
  { path: "/custom-jewelry", changefreq: "weekly", priority: 0.7 },
  { path: "/wishlist", changefreq: "weekly", priority: 0.5 },
];

/** Paths excluded from sitemap (admin, login, cart, checkout, private). Used by generator. */
export const SITEMAP_EXCLUDED_PATHS = [
  "/admin",
  "/login",
  "/signup",
  "/carts",
  "/checkout",
  "/myaccount",
  "/thankyou",
  "/video-cart/booking",
  "/video-cart/thankyou",
  "/compare",
];

export default SITEMAP_STATIC_ROUTES;

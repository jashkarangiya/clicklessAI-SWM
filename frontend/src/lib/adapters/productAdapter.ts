/**
 * Maps orchestration / fixture product payloads to NormalizedProduct (frontend contract).
 * The backend uses current_price, stars, images.primary, etc.; Zod expects current, average, URL arrays.
 */
import { NormalizedProductSchema, type NormalizedProduct } from '@/contracts/product';

const SOURCES = new Set(['amazon', 'walmart', 'other']);

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Accepts http(s) URLs and example.com used in fixtures. */
function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

/**
 * Coerce a single API/orchestration product dict into NormalizedProduct.
 */
export function coerceNormalizedProduct(raw: unknown): NormalizedProduct {
  const p = asRecord(raw);
  const pricing = asRecord(p.pricing);
  const current =
    typeof pricing.current === 'number' && !Number.isNaN(pricing.current)
      ? pricing.current
      : Number(pricing.current_price ?? 0);

  const originalRaw = pricing.original ?? pricing.original_price;
  const original =
    typeof originalRaw === 'number'
      ? originalRaw
      : originalRaw != null && originalRaw !== ''
        ? Number(originalRaw)
        : undefined;

  const ratingsIn = asRecord(p.ratings);
  const ratings =
    ratingsIn && (ratingsIn.stars != null || ratingsIn.average != null || ratingsIn.count != null || ratingsIn.review_count != null)
      ? {
          average: Number(ratingsIn.average ?? ratingsIn.stars ?? 0),
          count: Math.max(0, Math.floor(Number(ratingsIn.count ?? ratingsIn.review_count ?? 0))),
          count_label: typeof ratingsIn.count_label === 'string' ? ratingsIn.count_label : undefined,
        }
      : undefined;

  const deliveryIn = asRecord(p.delivery);
  const delivery =
    Object.keys(deliveryIn).length > 0
      ? {
          estimate_label:
            typeof deliveryIn.estimate_label === 'string'
              ? deliveryIn.estimate_label
              : typeof deliveryIn.estimated_date === 'string'
                ? deliveryIn.estimated_date
                : undefined,
          estimate_days: typeof deliveryIn.estimate_days === 'number' ? deliveryIn.estimate_days : undefined,
          free: deliveryIn.shipping_cost === 0 || deliveryIn.free === true,
          prime: Boolean(deliveryIn.prime_eligible),
        }
      : undefined;

  let images: string[] | undefined;
  const imgVal = p.images;
  if (Array.isArray(imgVal)) {
    images = imgVal.filter((u): u is string => typeof u === 'string' && isHttpUrl(u));
  } else if (imgVal && typeof imgVal === 'object') {
    const primary = (imgVal as Record<string, unknown>).primary;
    if (typeof primary === 'string' && isHttpUrl(primary)) images = [primary];
  }

  const scoringIn = asRecord(p.scoring);
  const scoring =
    scoringIn && Object.keys(scoringIn).length > 0
      ? {
          total: typeof scoringIn.composite_score === 'number' ? scoringIn.composite_score : undefined,
          price_score: typeof scoringIn.price_score === 'number' ? scoringIn.price_score : undefined,
          rating_score: typeof scoringIn.rating_score === 'number' ? scoringIn.rating_score : undefined,
          delivery_score: typeof scoringIn.delivery_score === 'number' ? scoringIn.delivery_score : undefined,
          pref_score: typeof scoringIn.preference_match_score === 'number' ? scoringIn.preference_match_score : undefined,
          match_reasons: Array.isArray(scoringIn.match_reasons)
            ? scoringIn.match_reasons.filter((x): x is string => typeof x === 'string')
            : undefined,
          recommended: typeof scoringIn.recommended === 'boolean' ? scoringIn.recommended : undefined,
          rank: typeof scoringIn.rank === 'number' ? scoringIn.rank : undefined,
        }
      : undefined;

  const attrsIn = p.attributes;
  let attributes: Record<string, string> | undefined;
  if (attrsIn && typeof attrsIn === 'object' && !Array.isArray(attrsIn)) {
    attributes = {};
    for (const [k, v] of Object.entries(attrsIn)) {
      if (typeof v === 'string') attributes[k] = v;
      else attributes[k] = JSON.stringify(v);
    }
  }

  const src = String(p.source ?? 'other').toLowerCase();
  const source = SOURCES.has(src) ? (src as NormalizedProduct['source']) : 'other';

  const candidate = {
    product_id: String(p.product_id ?? 'unknown'),
    source,
    source_url: typeof p.source_url === 'string' && isHttpUrl(p.source_url) ? p.source_url
      : typeof p.product_url === 'string' && isHttpUrl(p.product_url) ? p.product_url
      : undefined,
    source_product_id: typeof p.source_product_id === 'string' ? p.source_product_id
      : typeof p.asin === 'string' ? p.asin
      : undefined,
    name: String(p.name ?? 'Product'),
    brand: typeof p.brand === 'string' ? p.brand : undefined,
    category: typeof p.category === 'string' ? p.category : undefined,
    pricing: {
      current,
      original: original !== undefined && !Number.isNaN(original) ? original : undefined,
      currency: typeof pricing.currency === 'string' ? pricing.currency : 'USD',
      discount_pct: typeof pricing.discount_pct === 'number' ? pricing.discount_pct : undefined,
      price_label: typeof pricing.price_label === 'string' ? pricing.price_label : undefined,
    },
    ratings,
    delivery,
    attributes,
    images: images?.length ? images : undefined,
    description: typeof p.description === 'string' ? p.description : undefined,
    in_stock: typeof p.in_stock === 'boolean' ? p.in_stock : typeof deliveryIn.in_stock === 'boolean' ? deliveryIn.in_stock : undefined,
    scoring,
    scraped_at: typeof p.scraped_at === 'string' ? p.scraped_at : undefined,
    cache_ttl_seconds: typeof p.cache_ttl_seconds === 'number' ? p.cache_ttl_seconds : undefined,
  };

  const parsed = NormalizedProductSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;

  return NormalizedProductSchema.parse({
    product_id: candidate.product_id,
    source: 'other',
    name: candidate.name,
    pricing: { current: current || 0, currency: 'USD' },
  });
}

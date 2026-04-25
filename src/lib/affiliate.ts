/* ── Affiliate Marketplace Configuration ──────────────────────────── */

export interface AffiliateMarketplace {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  color: string;           // tailwind gradient classes
  bgColor: string;         // tailwind bg class
  textColor: string;       // tailwind text class
  borderColor: string;     // tailwind border class
  searchBaseUrl: string;   // URL template, {query} will be replaced
  category: string;        // grocery / fresh / general
  rating: number;          // 1-5
  features: string[];      // selling points
}

export const AFFILIATE_MARKETPLACES: AffiliateMarketplace[] = [
  {
    id: 'tokopedia-now',
    name: 'Tokopedia Now',
    tagline: 'Belanja instan, sampai hari ini',
    logo: '🛒',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800/40',
    searchBaseUrl: 'https://www.tokopedia.com/search?st=product&q={query}&source=universe&srp_component_id=02.01.00.00&srp_page_id=&srp_page_title=&navsource=',
    category: 'grocery',
    rating: 5,
    features: ['Pengiriman 2 jam', 'Promo harian', 'Cashback 10%'],
  },
  {
    id: 'shopee-segar',
    name: 'Shopee Segar',
    tagline: 'Sayur & buah segar langsung dari petani',
    logo: '🧡',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800/40',
    searchBaseUrl: 'https://shopee.co.id/search?keyword={query}',
    category: 'fresh',
    rating: 5,
    features: ['Segar dari kebun', 'Gratis Ongkir XTRA', 'Voucher belanja'],
  },
  {
    id: 'sayurbox',
    name: 'Sayurbox',
    tagline: 'Bahan segar premium untuk keluarga',
    logo: '🥬',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800/40',
    searchBaseUrl: 'https://www.sayurbox.com/search?q={query}',
    category: 'fresh',
    rating: 4,
    features: ['Produk organik', 'Langsung dari petani', 'Fresh guarantee'],
  },
  {
    id: 'blibli-mart',
    name: 'Blibli Mart',
    tagline: 'Supermarket online lengkap & hemat',
    logo: '🔵',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800/40',
    searchBaseUrl: 'https://www.blibli.com/cari?search={query}',
    category: 'grocery',
    rating: 4,
    features: ['Brand terlengkap', 'Coupon harian', 'Gratis Ongkir'],
  },
  {
    id: 'lottemart',
    name: 'LotteMart Online',
    tagline: 'Belanja grosir & retail terpercaya',
    logo: '🏪',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800/40',
    searchBaseUrl: 'https://www.lotteonline.co.id/search?keyword={query}',
    category: 'grocery',
    rating: 4,
    features: ['Harga grosir', 'Fresh food', 'Same day delivery'],
  },
  {
    id: 'klikindomaret',
    name: 'Klik Indomaret',
    tagline: 'Semua ada, dekat & praktis',
    logo: '🏪',
    color: 'from-yellow-500 to-red-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800/40',
    searchBaseUrl: 'https://www.klikindomaret.com/search/?keyword={query}',
    category: 'grocery',
    rating: 3,
    features: ['Tersedia 24 jam', 'Ambil di store', 'Harga terjangkau'],
  },
];

/** Build a search URL for a given marketplace and ingredient name */
export function buildAffiliateUrl(marketplaceId: string, query: string): string {
  const mp = AFFILIATE_MARKETPLACES.find((m) => m.id === marketplaceId);
  if (!mp) return '#';
  const encoded = encodeURIComponent(query);
  return mp.searchBaseUrl.replace('{query}', encoded);
}

/** Build a combined search URL for multiple ingredients */
export function buildBulkAffiliateUrl(marketplaceId: string, ingredients: string[]): string {
  const combined = ingredients.slice(0, 5).join(' ');
  return buildAffiliateUrl(marketplaceId, combined);
}

/** Get recommended marketplaces based on ingredient category */
export function getRecommendedMarketplaces(category: string): AffiliateMarketplace[] {
  // Fresh produce → prioritize Sayurbox, Shopee Segar
  if (['Sayuran', 'Susu & Telur'].includes(category)) {
    return AFFILIATE_MARKETPLACES.filter((m) =>
      ['sayurbox', 'shopee-segar', 'tokopedia-now'].includes(m.id)
    );
  }
  // Meat/Protein → prioritize Tokopedia Now, LotteMart
  if (['Daging'].includes(category)) {
    return AFFILIATE_MARKETPLACES.filter((m) =>
      ['tokopedia-now', 'lottemart', 'blibli-mart'].includes(m.id)
    );
  }
  // Spices & Staples → prioritize Klik Indomaret, Blibli Mart
  return AFFILIATE_MARKETPLACES.filter((m) =>
    ['klikindomaret', 'blibli-mart', 'tokopedia-now'].includes(m.id)
  );
}

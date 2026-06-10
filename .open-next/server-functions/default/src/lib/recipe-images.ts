/**
 * Recipe image mapping utility.
 * Maps recipe IDs and name keywords to AI-generated food images.
 */

/* ── Keyword → image path mapping ──────────────────────────────── */

interface ImageMapping {
  keywords: string[];
  image: string;
}

const IMAGE_MAP: ImageMapping[] = [
  // Main dishes
  { keywords: ['nasi goreng'], image: '/recipes/nasi-goreng.png' },
  { keywords: ['rendang'], image: '/recipes/rendang.png' },
  { keywords: ['sate ayam', 'satay'], image: '/recipes/sate-ayam.png' },
  { keywords: ['soto ayam'], image: '/recipes/soto-ayam.png' },
  { keywords: ['soto'], image: '/recipes/soto-ayam.png' },
  { keywords: ['mie goreng', 'bakmi goreng'], image: '/recipes/mie-goreng.png' },
  { keywords: ['gado-gado', 'gado gado'], image: '/recipes/gado-gado.png' },
  { keywords: ['bakso'], image: '/recipes/bakso.png' },
  { keywords: ['nasi uduk'], image: '/recipes/nasi-uduk.png' },
  { keywords: ['nasi padang', 'nasi kapau'], image: '/recipes/nasi-padang.png' },
  { keywords: ['nasi kuning'], image: '/recipes/nasi-uduk.png' },
  { keywords: ['nasi liwet', 'nasi tim'], image: '/recipes/nasi-uduk.png' },
  { keywords: ['ayam goreng', 'fried chicken'], image: '/recipes/ayam-goreng.png' },
  { keywords: ['ayam bakar', 'grilled chicken'], image: '/recipes/ayam-goreng.png' },
  { keywords: ['ayam pop'], image: '/recipes/ayam-goreng.png' },
  { keywords: ['ayam kecap'], image: '/recipes/ayam-goreng.png' },
  { keywords: ['bubur ayam', 'congee'], image: '/recipes/bubur-ayam.png' },
  { keywords: ['bubur', 'porridge'], image: '/recipes/bubur-ayam.png' },
  { keywords: ['tempe orek', 'tempe goreng'], image: '/recipes/tempe-orek.png' },
  { keywords: ['tempe', 'tahu tempe'], image: '/recipes/tempe-orek.png' },
  { keywords: ['perkedel', 'bergedel'], image: '/recipes/perkedel.png' },
  { keywords: ['sayur asem'], image: '/recipes/sayur-asem.png' },
  { keywords: ['plecing kangkung'], image: '/recipes/plecing-kangkung.png' },
  { keywords: ['klepon'], image: '/recipes/klepon.png' },
  { keywords: ['pisang goreng'], image: '/recipes/pisang-goreng.png' },
  { keywords: ['es campur'], image: '/recipes/es-campur.png' },
  { keywords: ['martabak manis', 'martabak terang bulan'], image: '/recipes/martabak.png' },
  { keywords: ['martabak'], image: '/recipes/martabak.png' },
  { keywords: ['es teh', 'teh manis', 'iced tea'], image: '/recipes/es-teh.png' },
  { keywords: ['es kelapa', 'kelapa muda', 'coconut'], image: '/recipes/es-kelapa.png' },

  // More dish types
  { keywords: ['ikan bakar', 'ikan goreng', 'grilled fish'], image: '/recipes/makan-malam-generic.png' },
  { keywords: ['ikan'], image: '/recipes/makan-malam-generic.png' },
  { keywords: ['udang', 'shrimp', 'prawn'], image: '/recipes/makan-siang-generic.png' },
  { keywords: ['gulai', 'opor', 'kari', 'curry'], image: '/recipes/rendang.png' },
  { keywords: ['tongkol', 'pindang'], image: '/recipes/makan-malam-generic.png' },
  { keywords: ['rawon', 'bungkil'], image: '/recipes/makan-siang-generic.png' },
  { keywords: ['tahu goreng', 'tahu crispy'], image: '/recipes/tempe-orek.png' },
  { keywords: ['tahu'], image: '/recipes/tempe-orek.png' },
  { keywords: ['roti bakar', 'roti'], image: '/recipes/sarapan-generic.png' },
  { keywords: ['telur dadar', 'telur', 'omelette'], image: '/recipes/sarapan-generic.png' },
  { keywords: ['pancake', 'crepe'], image: '/recipes/sarapan-generic.png' },
  { keywords: ['roti canai', 'canai', 'prata'], image: '/recipes/sarapan-generic.png' },
  { keywords: ['lontong', 'ketupat'], image: '/recipes/soto-ayam.png' },
  { keywords: ['pecel', 'lalapan', 'karedok'], image: '/recipes/gado-gado.png' },
  { keywords: ['capcay', 'chap cai'], image: '/recipes/makan-siang-generic.png' },
  { keywords: ['fuyunghai', 'fu yung hai'], image: '/recipes/makan-siang-generic.png' },
  { keywords: ['nasi kebuli', 'biryani'], image: '/recipes/nasi-goreng.png' },
  { keywords: ['nasi box', 'nasi campur'], image: '/recipes/nasi-padang.png' },

  // Snacks
  { keywords: ['risoles', 'pastel', 'croquette'], image: '/recipes/snack-generic.png' },
  { keywords: ['lemper', 'lontong isi'], image: '/recipes/snack-generic.png' },
  { keywords: ['rempeyek', 'peyek'], image: '/recipes/snack-generic.png' },
  { keywords: ['kerupuk', 'krupuk'], image: '/recipes/snack-generic.png' },
  { keywords: ['cireng', 'tahu isi'], image: '/recipes/snack-generic.png' },
  { keywords: ['dadar gulung'], image: '/recipes/dessert-generic.png' },
  { keywords: ['kue lapis', 'lapis'], image: '/recipes/dessert-generic.png' },
  { keywords: ['onde-onde', 'onde'], image: '/recipes/klepon.png' },
  { keywords: ['nagasari'], image: '/recipes/dessert-generic.png' },
  { keywords: ['serabi', 'srabi'], image: '/recipes/sarapan-generic.png' },
  { keywords: ['kue cubit'], image: '/recipes/dessert-generic.png' },
  { keywords: ['kolak'], image: '/recipes/dessert-generic.png' },
  { keywords: ['puding', 'pudding'], image: '/recipes/dessert-generic.png' },

  // Drinks
  { keywords: ['jus', 'juice'], image: '/recipes/minuman-generic.png' },
  { keywords: ['smoothie'], image: '/recipes/minuman-generic.png' },
  { keywords: ['kopi', 'coffee'], image: '/recipes/minuman-generic.png' },
  { keywords: ['susu', 'milk'], image: '/recipes/minuman-generic.png' },
  { keywords: ['bandrek', 'wedang'], image: '/recipes/minuman-generic.png' },
  { keywords: ['es cincau'], image: '/recipes/es-campur.png' },
  { keywords: ['es buah', 'fruit punch'], image: '/recipes/es-campur.png' },
  { keywords: ['es jeruk', 'orange juice'], image: '/recipes/minuman-generic.png' },
  { keywords: ['dawet', 'cendol'], image: '/recipes/es-campur.png' },

  // Western dishes
  { keywords: ['pizza', 'margherita'], image: '/recipes/western-pizza.png' },
  { keywords: ['spaghetti', 'pasta', 'carbonara', 'bolognese', 'fettuccine', 'penne', 'lasagna', 'alfredo'], image: '/recipes/western-pasta.png' },
  { keywords: ['steak', 'ribeye', 'grilled', 'lamb chop', 'pork chop', 'filet mignon'], image: '/recipes/western-steak.png' },
  { keywords: ['burger', 'hamburger', 'cheeseburger'], image: '/recipes/western-burger.png' },
  { keywords: ['pancake', 'waffle', 'french toast', 'crepe'], image: '/recipes/western-pancake.png' },
  { keywords: ['salad', 'caesar', 'greek salad'], image: '/recipes/western-salad.png' },
  { keywords: ['chocolate lava', 'chocolate cake', 'brownie', 'tiramisu', 'mousse'], image: '/recipes/western-chocolate.png' },
  { keywords: ['sandwich', 'club sandwich', 'grilled cheese', 'blt', 'panini', 'wrap'], image: '/recipes/western-burger.png' },
  { keywords: ['soup', 'tomato soup', 'onion soup', 'chowder', 'bisque'], image: '/recipes/western-generic.png' },
  { keywords: ['fish and chips', 'fish', 'salmon', 'shrimp', 'seafood'], image: '/recipes/western-generic.png' },
  { keywords: ['roast chicken', 'roast', 'chicken parmesan', 'chicken tikka'], image: '/recipes/western-generic.png' },
  { keywords: ['tacos', 'burrito', 'quesadilla', 'nachos', 'enchilada'], image: '/recipes/western-generic.png' },
  { keywords: ['sushi', 'ramen', 'pad thai', 'curry', 'katsu', 'teriyaki'], image: '/recipes/western-generic.png' },
  { keywords: ['cheesecake', 'apple pie', 'crumble', 'cobbler'], image: '/recipes/western-chocolate.png' },
  { keywords: ['milkshake', 'hot chocolate', 'lemonade', 'mojito', 'sangria', 'smoothie bowl', 'latte', 'cappuccino', 'macchiato'], image: '/recipes/western-generic.png' },
  { keywords: ['cookie', 'cupcake', 'donut', 'muffin', 'scone'], image: '/recipes/western-pancake.png' },
];

/* ── Category fallback images ──────────────────────────────────── */

const CATEGORY_FALLBACKS: Record<string, string> = {
  Sarapan: '/recipes/sarapan-generic.png',
  'Makan Siang': '/recipes/makan-siang-generic.png',
  'Makan Malam': '/recipes/makan-malam-generic.png',
  Snack: '/recipes/snack-generic.png',
  Cemilan: '/recipes/snack-generic.png',
  Minuman: '/recipes/minuman-generic.png',
  Dessert: '/recipes/dessert-generic.png',
  Western: '/recipes/western-generic.png',
};

/* ── Default fallback ──────────────────────────────────────────── */

const DEFAULT_IMAGE = '/recipes/nasi-goreng.png';

/**
 * Get the food image URL for a recipe based on its ID or name.
 * Falls back to category-based image if no keyword matches.
 */
export function getRecipeImageUrl(recipeId: string, recipeName: string, category?: string): string {
  const idLower = recipeId.toLowerCase();
  const nameLower = recipeName.toLowerCase();

  // First try to match by recipe ID
  for (const mapping of IMAGE_MAP) {
    for (const keyword of mapping.keywords) {
      if (idLower.includes(keyword.toLowerCase())) {
        return mapping.image;
      }
    }
  }

  // Then try to match by recipe name
  for (const mapping of IMAGE_MAP) {
    for (const keyword of mapping.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return mapping.image;
      }
    }
  }

  // Fall back to category image
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }

  return DEFAULT_IMAGE;
}

/**
 * Get all available recipe images (for preloading)
 */
export function getAllRecipeImages(): string[] {
  const images = new Set<string>();
  for (const mapping of IMAGE_MAP) {
    images.add(mapping.image);
  }
  for (const img of Object.values(CATEGORY_FALLBACKS)) {
    images.add(img);
  }
  images.add(DEFAULT_IMAGE);
  return Array.from(images);
}

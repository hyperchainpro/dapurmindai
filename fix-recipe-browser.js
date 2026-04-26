const fs = require('fs');
let c = fs.readFileSync('src/components/dapurmind/RecipeBrowser.tsx', 'utf-8');

// 1. Add ChevronDown import
c = c.replace(
  'import { Heart, Search, Clock, Star, X, Sparkles, Flame, Globe2, Wifi, WifiOff, RefreshCw, Loader2, Play } from',
  'import { Heart, Search, Clock, Star, X, Sparkles, Flame, Globe2, Wifi, WifiOff, RefreshCw, Loader2, Play, ChevronDown } from'
);
console.log('1. ChevronDown import added');

// 2. Add pagination state after scrollRef
c = c.replace(
  'const scrollRef = useRef<HTMLDivElement>(null);',
  'const scrollRef = useRef<HTMLDivElement>(null);\n  const [visibleCount, setVisibleCount] = useState(50);'
);
console.log('2. Pagination state added');

// 3. Add pagination reset and variables after filteredRecipes useMemo
const useMemoEnd = c.indexOf('}, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);');
if (useMemoEnd === -1) { console.log('ERROR: useMemoEnd not found'); process.exit(1); }
const insertAfter = useMemoEnd + '}, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);'.length;
c = c.substring(0, insertAfter) + 
  '\n\n  useEffect(() => {\n    setVisibleCount(50);\n  }, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);\n\n  const paginatedRecipes = filteredRecipes.slice(0, visibleCount);\n  const hasMore = visibleCount < filteredRecipes.length;' + 
  c.substring(insertAfter);
console.log('3. Pagination reset + variables added');

// 4. Replace the local recipe rendering block
const localStart = c.indexOf("{mode === 'local' && (");
const emptyStateClosing = c.indexOf('/>', localStart);
const ternaryEnd = c.indexOf(')}', emptyStateClosing);

if (localStart === -1 || ternaryEnd === -1) {
  console.log('ERROR: Could not find local recipe section', { localStart, ternaryEnd });
  process.exit(1);
}

const newLocal = [
  "{mode === 'local' && filteredRecipes.length > 0 && (",
  '            <div>',
  '              <motion.div',
  '                className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3"',
  '                initial="hidden"',
  '                animate="visible"',
  '                variants={{',
  '                  hidden: {},',
  '                  visible: { transition: { staggerChildren: 0.06 } },',
  '                }}',
  '              >',
  '                {paginatedRecipes.map((recipe) => (',
  '                  <RecipeCard',
  '                    key={recipe.id}',
  '                    recipe={recipe}',
  '                    isFavorite={favoriteRecipes.includes(recipe.id)}',
  '                    onClick={() => handleRecipeClick(recipe)}',
  '                    onToggleFavorite={(e) => handleToggleFavorite(e, recipe.id)}',
  '                  />',
  '                ))}',
  '              </motion.div>',
  '              {hasMore && (',
  '                <motion.div',
  '                  initial={{ opacity: 0, y: 10 }}',
  '                  animate={{ opacity: 1, y: 0 }}',
  '                  className="mt-5 flex flex-col items-center gap-2"',
  '                >',
  '                  <p className="text-xs text-muted-foreground">',
  '                    Menampilkan {paginatedRecipes.length} dari {filteredRecipes.length} resep',
  '                  </p>',
  '                  <Button',
  '                    variant="outline"',
  '                    size="sm"',
  '                    onClick={() => setVisibleCount(prev => prev + 50)}',
  '                    className="rounded-full border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"',
  '                  >',
  '                    <ChevronDown className="mr-1 h-4 w-4" />',
  '                    Muat 50 Resep Berikutnya',
  '                  </Button>',
  '                </motion.div>',
  '              )}',
  '              {!hasMore && filteredRecipes.length > 50 && (',
  '                <p className="mt-4 text-center text-xs text-muted-foreground">',
  '                  Semua {filteredRecipes.length} resep ditampilkan',
  '                </p>',
  '              )}',
  '            </div>',
  '          )}',
  "          {mode === 'local' && filteredRecipes.length === 0 && (",
  '            <EmptyState',
  '              onReset={() => {',
  "                setSearchQuery('');",
  "                setActiveCategory('Semua');",
  '                clearFilters();',
  '              }}',
  '            />',
  '          )}',
].join('\n');

c = c.substring(0, localStart) + newLocal + c.substring(ternaryEnd + 2);
console.log('4. Local recipe rendering replaced with pagination');

// 5. Update stats text
c = c.replace(
  "? `Menampilkan ${filteredRecipes.length} dari ${recipes.length} resep lokal`",
  "? filteredRecipes.length > 50\n                ? `Menampilkan ${paginatedRecipes.length} dari ${filteredRecipes.length} resep lokal`\n                : `${filteredRecipes.length} resep lokal`"
);
console.log('5. Stats text updated');

// 6. Add western image support in RecipeCard
c = c.replace(
  "const isApi = recipe.id.startsWith('api-');",
  "const isApi = recipe.id.startsWith('api-');\n  const isWestern = recipe.category === 'Western';\n  const hasRealImage = isApi && recipe.image && !recipe.image.startsWith('data:');\n  const westernImagePath = isWestern ? `/recipes/western/${recipe.id}.jpg` : null;"
);
console.log('6. Western image variables added');

// 7. Update image rendering in RecipeCard
c = c.replace(
  '{isApi && recipe.image && !recipe.image.startsWith(\'data:\') ? (\n              <img\n                src={recipe.image}\n                alt={recipe.name}\n                className="h-full w-full object-cover"\n                loading="lazy"\n              />\n            ) : (\n              <motion.span',
  '{hasRealImage ? (\n              <img\n                src={recipe.image}\n                alt={recipe.name}\n                className="h-full w-full object-cover"\n                loading="lazy"\n              />\n            ) : westernImagePath ? (\n              <img\n                src={westernImagePath}\n                alt={recipe.name}\n                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"\n                loading="lazy"\n              />\n            ) : (\n              <motion.span'
);
console.log('7. Image rendering updated');

fs.writeFileSync('src/components/dapurmind/RecipeBrowser.tsx', c);
console.log('All changes applied! File saved.');

#!/bin/bash
# Generate recipe images in parallel batches
RECIPE_FILE="/tmp/recipes_noimage.json"

TOTAL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$RECIPE_FILE','utf8')).length)")
echo "Total recipes to generate: $TOTAL"

# Process batches with node for better parallel control
node << 'SCRIPT'
const fs = require('fs');
const { execSync } = require('child_process');
const recipes = JSON.parse(fs.readFileSync('/tmp/recipes_noimage.json', 'utf8'));
const BATCH = 15;
let done = 0;
let failed = 0;

async function generateBatch(batch) {
  const promises = batch.map(async (r) => {
    try {
      // Escape quotes in prompt for shell
      const safePrompt = r.prompt.replace(/"/g, '\\"');
      execSync(`z-ai-generate -p "${safePrompt}" -o "${r.outputPath}" -s 1024x1024`, {
        timeout: 60000,
        stdio: 'pipe'
      });
      done++;
      process.stdout.write(`\r[${done + failed}/${recipes.length}] OK: ${r.id} - ${r.name}        `);
    } catch (e) {
      failed++;
      done++;
      process.stdout.write(`\r[${done + failed}/${recipes.length}] FAIL: ${r.id}                      `);
    }
  });
  await Promise.all(promises);
}

async function main() {
  console.log(`Starting image generation for ${recipes.length} recipes...`);
  console.log('');

  for (let i = 0; i < recipes.length; i += BATCH) {
    const batch = recipes.slice(i, i + BATCH);
    await generateBatch(batch);
    if (i + BATCH < recipes.length) {
      // Small delay between batches
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('');
  console.log(`Done! Success: ${done - failed}, Failed: ${failed}`);
}

main().catch(console.error);
SCRIPT

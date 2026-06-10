const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const recipes = JSON.parse(fs.readFileSync('/tmp/recipes_noimage.json', 'utf8'));

// Filter out recipes that already have images
const baseDir = '/home/z/my-project';
const todo = recipes.filter(r => !fs.existsSync(path.join(baseDir, r.outputPath)));

console.log(`Recipes needing images: ${todo.length} (out of ${recipes.length})`);

let success = 0;
let failed = 0;
const failedList = [];

for (const r of todo) {
  try {
    const safePrompt = r.prompt.replace(/"/g, '\\"');
    execSync(`z-ai-generate -p "${safePrompt}" -o "${path.join(baseDir, r.outputPath)}" -s 1024x1024`, {
      timeout: 45000,
      stdio: 'pipe'
    });
    success++;
    console.log(`[${success + failed}/${todo.length}] OK: ${r.id} - ${r.name}`);
  } catch (e) {
    failed++;
    failedList.push(r.id);
    console.log(`[${success + failed}/${todo.length}] FAIL: ${r.id} - ${e.message.slice(0, 60)}`);
  }
}

console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
if (failedList.length > 0) {
  console.log('Failed IDs:', failedList.join(', '));
}

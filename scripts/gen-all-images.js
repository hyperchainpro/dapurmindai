const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const wContent = fs.readFileSync('src/lib/recipes/western.ts', 'utf8');
const wIds = [...wContent.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const wNames = [...wContent.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
const westernImages = new Set(fs.readdirSync('public/recipes/western').filter(f => f.endsWith('.jpg')).map(f => f.replace('.jpg','')));

const todo = [];
for (let i = 0; i < wIds.length; i++) {
  if (!westernImages.has(wIds[i])) {
    todo.push({ id: wIds[i], name: wNames[i] || wIds[i] });
  }
}

console.log(`[${new Date().toISOString()}] Starting: ${todo.length} recipes to generate`);

let ok = 0, fail = 0;
const PARALLEL = 5;

async function run() {
  for (let i = 0; i < todo.length; i += PARALLEL) {
    const batch = todo.slice(i, i + PARALLEL);
    const promises = batch.map(async (r) => {
      try {
        const p = `Delicious ${r.name}, professional food photography, warm lighting, top-down view`;
        execSync(`z-ai-generate -p "${p}" -o public/recipes/western/${r.id}.jpg -s 1024x1024`, {
          timeout: 60000, stdio: 'pipe'
        });
        ok++;
      } catch(e) { fail++; }
    });
    await Promise.all(promises);
    const total = ok + fail;
    process.stdout.write(`\r[${total}/${todo.length}] OK: ${ok}, Fail: ${fail}`);
  }
  console.log(`\n[${new Date().toISOString()}] Done! OK: ${ok}, Fail: ${fail}`);
}

run();

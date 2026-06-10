# ⚡ Quick Start Guide

## 🏃‍♂️ Development

```bash
# Start both Convex and Next.js
npm run dev

# Or start separately:
npm run dev:convex  # Terminal 1
npm run dev:next    # Terminal 2
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy Production

### 1. Deploy Convex Backend

```bash
npx convex deploy --prod
```

Copy the output URLs:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

### 2. Deploy to Cloudflare Pages

#### Via Dashboard (Easiest)
1. Push to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
3. Create Project → Connect GitHub
4. Build settings:
   - Build command: `npm run build`
   - Output: `.next`
5. Add env vars (from step 1)
6. Deploy!

#### Via CLI (Advanced)
```bash
# Install (if needed)
npm install @cloudflare/next-on-pages wrangler -D --legacy-peer-deps

# Build
npm run pages:build

# Deploy
npx wrangler pages deploy .vercel/output/static
```

## 📝 Environment Variables

### Local (.env.local) - Already set ✅
```env
NEXT_PUBLIC_CONVEX_URL=https://unique-bear-361.eu-west-1.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://unique-bear-361.eu-west-1.convex.site
```

### Production (Cloudflare Pages) - TODO
```env
NEXT_PUBLIC_CONVEX_URL=<from-convex-prod-deploy>
NEXT_PUBLIC_CONVEX_SITE_URL=<from-convex-prod-deploy>
NODE_VERSION=20
```

## 🔥 Common Commands

```bash
# Development
npm run dev                 # Start dev servers
npm run dev:convex          # Convex only
npm run dev:next            # Next.js only

# Build & Test
npm run build               # Build for production
npm run start               # Test production build locally

# Convex
npx convex dev              # Start Convex dev
npx convex deploy           # Deploy to production
npx convex dashboard        # Open Convex dashboard

# Cloudflare (if installed)
npm run pages:build         # Build for Cloudflare
npm run preview             # Preview locally
npm run deploy              # Deploy to Cloudflare
```

## 📊 Check Status

```bash
# Convex status
npx convex dashboard

# See deployed functions
# Visit: https://dashboard.convex.dev/
```

## 🐛 Quick Fixes

### Error: Convex types not found
```bash
npx convex dev  # Regenerate types
```

### Error: Build fails
```bash
npm install      # Reinstall dependencies
npm run build    # Try build again
```

### Error: Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## 📚 Documentation Files

- **README_DEPLOYMENT.md** - Overview & checklist
- **DEPLOYMENT.md** - Full deployment guide
- **CONVEX_USAGE_EXAMPLES.md** - Code examples
- **QUICK_START.md** - This file

## 🎯 Key URLs

- **Dev Frontend**: http://localhost:3000
- **Dev Convex**: https://unique-bear-361.eu-west-1.convex.cloud
- **Convex Dashboard**: https://dashboard.convex.dev/d/unique-bear-361
- **Production**: (after deploy)

## ✅ Current Status

- [x] Convex development ready
- [x] Next.js integrated
- [x] Sample functions created
- [ ] Production deployed

## 🚦 Next: Deploy Production

1. Run: `npx convex deploy --prod`
2. Copy env vars
3. Deploy to Cloudflare Pages
4. Test production site

That's it! 🎉

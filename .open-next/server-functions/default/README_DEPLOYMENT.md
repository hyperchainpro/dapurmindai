# 🚀 DapurMind AI - Deployment Guide

## ✅ Yang Sudah Selesai

### 1. Convex Backend Setup
- ✅ Convex installed dan configured
- ✅ Schema sudah di-migrate dari Prisma → Convex
- ✅ Development deployment sudah aktif di: `https://unique-bear-361.eu-west-1.convex.cloud`
- ✅ 22 tables sudah di-define dengan proper indexes
- ✅ Sample queries dan mutations sudah dibuat:
  - `convex/users.ts` - User management
  - `convex/recipes.ts` - Recipe CRUD dengan search
  - `convex/finance.ts` - Financial tracking

### 2. Next.js Integration
- ✅ ConvexProvider sudah ditambahkan di `layout.tsx`
- ✅ Helper hooks dibuat di `src/lib/convex-client.ts`
- ✅ Next.js config sudah disesuaikan untuk Cloudflare Pages
- ✅ Build scripts sudah diupdate

### 3. Documentation
- ✅ `DEPLOYMENT.md` - Panduan lengkap deployment
- ✅ `CONVEX_USAGE_EXAMPLES.md` - Contoh penggunaan Convex
- ✅ `README_DEPLOYMENT.md` - Summary (file ini)

## 🎯 Langkah Selanjutnya

### Deploy ke Production

#### 1. Deploy Convex Backend ke Production

```bash
# Deploy Convex functions ke production
npx convex deploy --prod
```

Setelah deploy, copy environment variables yang dihasilkan:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

#### 2. Deploy ke Cloudflare Pages

**Opsi A: Via Cloudflare Dashboard (RECOMMENDED)**

1. Push code ke GitHub repository
2. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Pages → Create a project → Connect GitHub
4. Pilih repository Anda
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: (leave blank)
6. Add environment variables:
   ```
   NEXT_PUBLIC_CONVEX_URL=<from convex deploy>
   NEXT_PUBLIC_CONVEX_SITE_URL=<from convex deploy>
   NODE_VERSION=20
   ```
7. Click "Save and Deploy"

**Opsi B: Via Command Line**

Jika ingin deploy via CLI, install dependencies terlebih dahulu:

```bash
# Note: Ada peer dependency conflict dengan Next.js 16
# Anda bisa skip ini dan gunakan Cloudflare Dashboard saja
npm install @cloudflare/next-on-pages wrangler --save-dev --legacy-peer-deps
```

Kemudian:

```bash
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=dapumindai
```

### 3. Migrasi Data (Jika Ada)

Jika Anda memiliki data existing di PostgreSQL:

1. Export data dari database lama
2. Buat script migration di `convex/migrations/`
3. Import data ke Convex

Lihat detail di `DEPLOYMENT.md` bagian "Migrasi Data".

## 📁 Struktur Project

```
DapuMindAI/
├── convex/                    # Convex backend functions
│   ├── _generated/           # Auto-generated types
│   ├── schema.ts             # Database schema
│   ├── users.ts              # User queries/mutations
│   ├── recipes.ts            # Recipe queries/mutations
│   ├── finance.ts            # Finance queries/mutations
│   └── auth.config.ts        # Auth configuration
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/
│   │   └── ConvexProvider.tsx  # Convex client provider
│   └── lib/
│       └── convex-client.ts  # Convex helper hooks
├── .env.local                # Local environment variables
├── package.json              # Updated with Convex scripts
├── next.config.ts            # Configured for Cloudflare
├── DEPLOYMENT.md             # Full deployment guide
├── CONVEX_USAGE_EXAMPLES.md  # Usage examples
└── README_DEPLOYMENT.md      # This file
```

## 🔧 Environment Variables

### Development (.env.local)

```bash
# Convex (already configured)
CONVEX_DEPLOYMENT=dev:hyperchain:dapumindai-10062026:dev/hyperchain
NEXT_PUBLIC_CONVEX_URL=https://unique-bear-361.eu-west-1.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://unique-bear-361.eu-west-1.convex.site
```

### Production (Cloudflare Pages)

```bash
# Akan berbeda setelah deploy production
NEXT_PUBLIC_CONVEX_URL=<production-url>
NEXT_PUBLIC_CONVEX_SITE_URL=<production-site-url>
NODE_VERSION=20
```

## 🧪 Testing Local

```bash
# Terminal 1: Start Convex dev server
npm run dev:convex

# Terminal 2: Start Next.js dev server
npm run dev:next

# Or run both at once
npm run dev
```

## 📊 Database Schema Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| users | User accounts | Username, email, role-based access |
| sessions | JWT sessions | Token management, device tracking |
| creatorRecipes | User recipes | Full-text search, categories, likes |
| creatorProfiles | Creator profiles | Stats, bio, followers |
| financeRecords | Transactions | Income/expense tracking |
| financeBudgets | Budget limits | Category-based budgets |
| financeGoals | Savings goals | Target tracking with progress |
| affiliateAccounts | Affiliate integrations | Platform configs |
| productLinks | Affiliate products | Click tracking |
| aiAgents | AI agent configs | Multi-provider support |
| notifications | User notifications | Real-time push |
| + 11 more tables | Various features | See `convex/schema.ts` |

## 📚 Key Files to Understand

1. **convex/schema.ts** - Database schema definition
2. **src/lib/convex-client.ts** - React hooks untuk queries/mutations
3. **src/components/ConvexProvider.tsx** - Client setup
4. **CONVEX_USAGE_EXAMPLES.md** - Contoh praktis usage

## 🎓 Learning Resources

- [Convex Quick Start](https://docs.convex.dev/quickstart)
- [Convex with Next.js](https://docs.convex.dev/client/react/nextjs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

## 🐛 Troubleshooting

### Error: "by_userId is not assignable to keyof SystemIndexes"

**✅ SOLVED** - Schema sudah di-generate dengan `npx convex dev`

### Build fails di Cloudflare

Pastikan:
- NODE_VERSION=20 di environment variables
- `npm run build` berjalan sukses locally
- Semua dependencies terinstall

### Convex connection failed

Check:
- Environment variables benar
- Convex deployment masih aktif
- Internet connection

## 💡 Tips

1. **Real-time Updates**: Semua queries otomatis real-time, tidak perlu polling
2. **Type Safety**: Generated types di `convex/_generated/` untuk full TypeScript support
3. **No API Routes**: Langsung call Convex functions dari client
4. **Pagination**: Gunakan pagination untuk performa optimal
5. **Search**: Full-text search sudah built-in untuk recipes

## 🚦 Status Checklist

- [x] Convex installed
- [x] Schema migrated
- [x] Sample functions created
- [x] Next.js integrated
- [x] Documentation created
- [ ] Production deployment (Convex)
- [ ] Production deployment (Cloudflare)
- [ ] Data migration (if needed)
- [ ] Custom domain setup (optional)
- [ ] Monitoring setup (optional)

## 📞 Next Steps

1. **Deploy Convex production**: `npx convex deploy --prod`
2. **Deploy to Cloudflare**: Follow guide in `DEPLOYMENT.md`
3. **Test production**: Verify all features work
4. **Monitor**: Check Convex dashboard for errors/usage

## 🎉 Selesai!

Aplikasi Anda sekarang siap di-deploy ke Cloudflare Pages dengan Convex backend!

Jika ada pertanyaan, lihat:
- `DEPLOYMENT.md` untuk detail deployment
- `CONVEX_USAGE_EXAMPLES.md` untuk contoh coding
- [Convex Discord](https://convex.dev/community) untuk support

Good luck! 🚀

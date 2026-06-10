# Panduan Deployment ke Cloudflare Pages dengan Convex

## ✅ Persiapan yang Sudah Selesai

1. ✅ Convex sudah dikonfigurasi dan schema sudah di-deploy
2. ✅ Package.json sudah diupdate dengan script deployment
3. ✅ Next.js config sudah disesuaikan untuk Cloudflare Pages

## 🚀 Langkah Deployment

### 1. Deploy Convex Backend (Production)

```bash
# Deploy Convex functions ke production
npx convex deploy --prod
```

Setelah deploy, Anda akan mendapat:
- `CONVEX_DEPLOYMENT` - nama deployment production
- `NEXT_PUBLIC_CONVEX_URL` - URL untuk client
- `NEXT_PUBLIC_CONVEX_SITE_URL` - URL untuk HTTP actions

### 2. Setup Cloudflare Pages

#### Opsi A: Via Dashboard Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih **Pages** dari sidebar
3. Klik **Create a project**
4. Connect repository GitHub Anda
5. Konfigurasi build:
   - **Framework preset**: Next.js (Pages Router atau App Router tergantung project Anda)
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
6. Tambahkan Environment Variables:
   ```
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
   NEXT_PUBLIC_CONVEX_SITE_URL=<your-convex-site-url>
   NODE_VERSION=20
   ```
7. Klik **Save and Deploy**

#### Opsi B: Via Wrangler CLI

**CATATAN**: Untuk menggunakan opsi ini, Anda perlu install package tambahan:

```bash
# Install dependencies untuk Cloudflare deployment
npm install @cloudflare/next-on-pages wrangler --save-dev --legacy-peer-deps
```

Kemudian buat file `wrangler.toml`:

```toml
name = "dapumindai"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[env.production]
vars = { NODE_ENV = "production" }
```

Deploy dengan:

```bash
# Build untuk Cloudflare Pages
npm run pages:build

# Deploy
npx wrangler pages deploy .vercel/output/static --project-name=dapumindai
```

### 3. Environment Variables

Pastikan environment variables berikut sudah di-set di Cloudflare Pages:

```
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-convex-deployment.convex.site
NODE_VERSION=20
```

## 🔄 Migrasi Data dari PostgreSQL ke Convex

### Data yang Perlu Dimigrasi

Jika Anda memiliki data existing di PostgreSQL, Anda perlu migrasi manual:

1. **Export data dari PostgreSQL**:
```bash
# Export ke JSON
npx prisma db export --format json > data-export.json
```

2. **Buat script migrasi**:
Buat file `convex/migrations/importData.ts`:

```typescript
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const importUsers = internalMutation({
  args: { users: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const user of args.users) {
      await ctx.db.insert("users", {
        username: user.username,
        email: user.email,
        name: user.name,
        password: user.password,
        avatar: user.avatar,
        language: user.language || "id",
        role: user.role || "user",
        isActive: user.isActive ?? true,
        lastLoginAt: user.lastLoginAt?.getTime(),
        deletedAt: user.deletedAt?.getTime(),
      });
    }
  },
});

// Buat fungsi serupa untuk tabel lainnya
```

3. **Run migrasi**:
```bash
# Jalankan dari Node.js script atau Convex dashboard
```

## 🧪 Testing

### Local Development

```bash
# Start Convex dev server
npm run dev:convex

# Di terminal lain, start Next.js
npm run dev:next

# Atau jalankan keduanya sekaligus
npm run dev
```

### Testing Production Build

```bash
# Build project
npm run build

# Start production server locally
npm start
```

## 📝 Catatan Penting

### Perubahan dari Prisma ke Convex

1. **DateTime → Number**: Convex menggunakan timestamp (number) untuk dates
2. **Null safety**: Gunakan `v.optional()` untuk field nullable
3. **Relations**: Tidak ada foreign key constraints, gunakan `v.id("tableName")`
4. **Indexes**: Indexes otomatis menambahkan `_creationTime` di akhir
5. **Queries**: Convex menggunakan `.take()` bukan `.findMany()`
6. **Mutations**: Gunakan `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.replace()`

### Convex vs Prisma Cheat Sheet

| Prisma | Convex |
|--------|--------|
| `prisma.user.findUnique()` | `ctx.db.get(userId)` |
| `prisma.user.findMany()` | `ctx.db.query("users").take(n)` |
| `prisma.user.create()` | `ctx.db.insert("users", data)` |
| `prisma.user.update()` | `ctx.db.patch(userId, data)` |
| `prisma.user.delete()` | `ctx.db.delete(userId)` |
| `where: { ... }` | `.withIndex()` + `.filter()` |
| `DateTime` | `number` (timestamp) |

## 🔗 Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Dashboard](https://dashboard.convex.dev/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

## 🆘 Troubleshooting

### Error: "Module not found"
Pastikan semua dependencies sudah terinstall:
```bash
npm install
```

### Error: Convex connection failed
Check environment variables sudah benar di `.env.local` untuk dev atau di Cloudflare Pages settings untuk production.

### Build Error di Cloudflare
Pastikan Node version di-set ke 20:
```
NODE_VERSION=20
```

### Type Errors
Regenerate Convex types:
```bash
npx convex dev
```

# ⚙️ Setting Environment Variables

## 🚨 PENTING: Site Perlu Environment Variables

Site Anda sudah LIVE di:
**https://763e6e4f.dapumindai.pages.dev**

Tapi perlu environment variables agar berfungsi dengan baik.

---

## 🎯 Quick Steps (2 menit)

### 1. Buka Cloudflare Dashboard
👉 **https://dash.cloudflare.com/**

### 2. Navigate ke Pages Project
- Klik **"Pages"** di sidebar kiri
- Klik project **"dapumindai"**

### 3. Go to Settings
- Klik tab **"Settings"**
- Scroll ke **"Environment variables"**
- Klik **"Add variable"**

### 4. Add Variable #1
```
Variable name: NEXT_PUBLIC_CONVEX_URL
Value: https://silent-ocelot-29.convex.cloud
Environment: Production
```
Klik **"Save"**

### 5. Add Variable #2
```
Variable name: NEXT_PUBLIC_CONVEX_SITE_URL
Value: https://silent-ocelot-29.convex.site
Environment: Production
```
Klik **"Save"**

### 6. Redeploy
Ada 2 cara:

**Cara A: Via Dashboard**
- Go to **"Deployments"** tab
- Click **"Retry deployment"** pada deployment terakhir

**Cara B: Via Terminal** (di folder project)
```bash
wrangler pages deploy .next --project-name=dapumindai
```

---

## ✅ Verification

Setelah redeploy selesai (~2 menit), test:

### Test Site
```
https://763e6e4f.dapumindai.pages.dev
```

### Test API
```bash
curl https://silent-ocelot-29.convex.site/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": 1781061297806,
  "service": "DapurMind AI - Convex Backend"
}
```

---

## 🎯 Alternative: Via Wrangler CLI

Jika prefer via command line:

```bash
# Set variables
wrangler pages secret put NEXT_PUBLIC_CONVEX_URL \
  --project-name=dapumindai

# When prompted, enter: https://silent-ocelot-29.convex.cloud

wrangler pages secret put NEXT_PUBLIC_CONVEX_SITE_URL \
  --project-name=dapumindai

# When prompted, enter: https://silent-ocelot-29.convex.site

# Redeploy
wrangler pages deploy .next --project-name=dapumindai
```

---

## 📸 Screenshots Guide

### Step 1: Dashboard Home
![Dashboard](https://i.imgur.com/example.png)
- Login → Pages section

### Step 2: Project Settings
- Click "dapumindai" project
- Go to "Settings" tab

### Step 3: Environment Variables
- Scroll to "Environment variables" section
- Click "Add variable" button

### Step 4: Add Variable
- Enter name and value
- Select "Production"
- Click "Save"

---

## 🔍 What These Variables Do

### NEXT_PUBLIC_CONVEX_URL
- URL untuk Convex backend
- Digunakan oleh React hooks untuk real-time queries
- Format: `https://your-deployment.convex.cloud`

### NEXT_PUBLIC_CONVEX_SITE_URL  
- URL untuk HTTP Actions (REST API)
- Digunakan untuk server-side calls
- Format: `https://your-deployment.convex.site`

---

## ✅ Done!

Setelah env vars di-set dan redeploy, site Anda akan:
- ✅ Connect ke Convex backend
- ✅ Real-time updates working
- ✅ Authentication working
- ✅ All features enabled

**Site akan fully functional!** 🎉

---

## 🆘 Need Help?

If stuck, check:
1. Environment variables spelling (case-sensitive!)
2. Values are exact URLs (no trailing slash)
3. Environment is set to "Production"
4. Site has been redeployed after adding vars

Or visit:
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Convex Docs**: https://docs.convex.dev/

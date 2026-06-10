import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

interface GenerateLinkRequest {
  productName: string;
  category: string;
  platform?: string;
  context?: string;
}

// POST - Generate affiliate link using template or AI
export async function POST(request: NextRequest) {
  try {
    const body: GenerateLinkRequest = await request.json();
    const { productName, category, platform: targetPlatform, context } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Nama produk wajib diisi' },
        { status: 400 }
      );
    }

    // Get active affiliate accounts
    const accounts = await db.affiliateAccount.findMany({
      where: { isActive: true },
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Belum ada akun afiliasi yang aktif', links: [] },
        { status: 200 }
      );
    }

    const links = [];

    for (const account of accounts) {
      // Skip if specific platform requested and this doesn't match
      if (targetPlatform && account.platform !== targetPlatform) {
        continue;
      }

      let affiliateUrl: string;

      try {
        affiliateUrl = account.baseUrlTemplate
          .replace('{productName}', encodeURIComponent(productName))
          .replace('{productId}', encodeURIComponent(productName))
          .replace('{query}', encodeURIComponent(productName))
          .replace('{category}', encodeURIComponent(category));
      } catch {
        affiliateUrl = account.baseUrlTemplate;
      }

      // Try to generate a more intelligent link using AI
      let aiGeneratedUrl = affiliateUrl;
      let priceEstimate: number | null = null;

      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Kamu adalah asisten afiliasi marketplace Indonesia. Untuk produk "${productName}" di kategori "${category}", berikan:
1. URL pencarian yang dioptimasi untuk platform ${account.platform} (satu baris, hanya URL)
2. Estimasi harga dalam Rupiah (angka saja)

Format jawaban:
URL: [url]
HARGA: [angka]`,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });

        const aiContent = completion.choices[0]?.message?.content || '';
        const urlMatch = aiContent.match(/URL:\s*(.+)/);
        const priceMatch = aiContent.match(/HARGA:\s*(\d+)/);

        if (urlMatch?.[1]) {
          aiGeneratedUrl = urlMatch[1].trim();
        }
        if (priceMatch?.[1]) {
          priceEstimate = parseInt(priceMatch[1], 10);
        }
      } catch {
        // Fallback to template URL
      }

      // Save to database
      const productLink = await db.productLink.create({
        data: {
          productName,
          category,
          platform: account.platform,
          affiliateUrl: aiGeneratedUrl,
          originalPrice: priceEstimate,
          createdByAi: true,
          lastVerified: Math.floor(Date.now() / 1000),
          createdAt: Math.floor(Date.now() / 1000),
          accountId: account.id,
        },
      });

      links.push({
        id: productLink.id,
        productName: productLink.productName,
        category: productLink.category,
        platform: productLink.platform,
        affiliateUrl: productLink.affiliateUrl,
        originalPrice: productLink.originalPrice,
        createdByAi: productLink.createdByAi,
      });
    }

    // Also log context if provided
    if (context) {
      for (const link of links) {
        // Context is stored when user actually clicks
      }
    }

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    return NextResponse.json(
      { error: 'Gagal generate tautan afiliasi' },
      { status: 500 }
    );
  }
}

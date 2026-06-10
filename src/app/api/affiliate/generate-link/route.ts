import { NextRequest, NextResponse } from 'next/server';
import { client } from '../../../../lib/convex';
import { api } from '../../../../../convex/_generated/api';
import ZAI from 'z-ai-web-dev-sdk';

interface GenerateLinkRequest {
  productName: string;
  category: string;
  platform?: string;
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateLinkRequest = await request.json();
    const { productName, category, platform: targetPlatform, context } = body;

    if (!productName) {
      return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 });
    }

    const accounts = await client.query(api.affiliate.getAffiliateAccounts, {});

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Belum ada akun afiliasi yang aktif', links: [] }, { status: 200 });
    }

    const links: any[] = [];
    
    let token = "dapurmind-admin-key-2025";

    for (const account of accounts) {
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

      let aiGeneratedUrl = affiliateUrl;
      let priceEstimate: number | null = null;

      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Kamu adalah asisten afiliasi marketplace Indonesia. Untuk produk "${productName}" di kategori "${category}", berikan:\n1. URL pencarian yang dioptimasi untuk platform ${account.platform} (satu baris, hanya URL)\n2. Estimasi harga dalam Rupiah (angka saja)\n\nFormat jawaban:\nURL: [url]\nHARGA: [angka]`,
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

      const linkId = await client.mutation(api.affiliate.createProductLink, {
        token,
        accountId: account._id,
        productName,
        category,
        platform: account.platform,
        affiliateUrl: aiGeneratedUrl,
        originalPrice: priceEstimate || undefined,
        createdByAi: true,
      });

      links.push({
        id: linkId,
        productName,
        category,
        platform: account.platform,
        affiliateUrl: aiGeneratedUrl,
        originalPrice: priceEstimate,
        createdByAi: true,
      });
    }

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    return NextResponse.json({ error: 'Gagal generate tautan afiliasi' }, { status: 500 });
  }
}

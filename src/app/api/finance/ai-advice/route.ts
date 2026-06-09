import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, question } = body;

    if (!userId || !question) {
      return NextResponse.json({ error: 'User ID dan pertanyaan wajib diisi' }, { status: 400 });
    }

    // Fetch user's recent financial data for context
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentRecords = await db.financeRecord.findMany({
      where: { userId, isActive: true, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const totalIncome = recentRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const totalExpense = recentRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

    // Build expense category summary
    const catMap = new Map<string, number>();
    for (const r of recentRecords) {
      if (r.type !== 'expense') continue;
      catMap.set(r.category, (catMap.get(r.category) ?? 0) + r.amount);
    }
    const catSummary = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `- ${cat}: Rp ${Math.round(amt).toLocaleString('id-ID')}`)
      .join('\n');

    const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

    const systemPrompt = `Kamu adalah AI Financial Advisor untuk DapurMind, sebuah aplikasi manajemen keuangan untuk keluarga Indonesia. Kamu memberikan saran keuangan yang praktis, mudah dipahami, dan relevan dengan konteks Indonesia.

Data keuangan pengguna (30 hari terakhir):
- Total Pemasukan: ${formatRupiah(totalIncome)}
- Total Pengeluaran: ${formatRupiah(totalExpense)}
- Saldo Bersih: ${formatRupiah(totalIncome - totalExpense)}
- Jumlah Transaksi: ${recentRecords.length}
- Pengeluaran per Kategori:
${catSummary || 'Belum ada data'}

Panduan jawaban:
1. Gunakan bahasa Indonesia yang santai namun informatif
2. Berikan saran yang konkret dan actionable
3. Gunakan format yang mudah dibaca (poin, angka)
4. Jika data kurang, berikan saran umum yang bermanfaat
5. Jangan memberikan saran investasi berisiko tinggi
6. Fokus pada penghematan, perencanaan, dan kebiasaan baik
7. Jawab singkat tapi padat (maks 3-4 paragraf)`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini. Coba lagi nanti.';

    return NextResponse.json({ success: true, data: { response } });
  } catch (error) {
    console.error('Error in AI financial advisor:', error);

    // Fallback response when AI is unavailable
    const fallbackResponses = [
      '💡 **Tips Hemat Belanja Minggu Ini:**\n\n1. Buat daftar belanja sebelum ke supermarket dan patuhi!\n2. Cek promo dan diskon di aplikasi supermarket\n3. Beli bahan mentah vs siap saji - lebih hemat 30-50%\n4. Masak di rumah bisa hemat hingga Rp 500.000/minggu\n5. Bandingkan harga di beberapa platform sebelum beli',
      '📊 **Analisa Pengeluaran:**\n\nBerdasarkan data yang tersedia, berikut saran saya:\n\n1. Cek kategori pengeluaran terbesarmu\n2. Tetapkan anggaran per kategori\n3. Gunakan fitur budget di DapurMind untuk tracking\n4. Evaluasi setiap minggu apakah masih sesuai anggaran\n5. Sisihkan minimal 20% dari pemasukan untuk tabungan',
      '🎯 **Rencana Tabungan untuk Liburan:**\n\n1. Tentukan target budget liburan\n2. Hitung berapa bulan lagi waktu keberangkatan\n3. Bagi target budget dengan jumlah bulan = tabungan per bulan\n4. Buat goal tabungan di menu "Tujuan Keuangan"\n5. Potong pengeluaran non-esensial untuk menambah tabungan\n6. Cari promo tiket & penginapan jauh-jauh hari!',
    ];

    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return NextResponse.json({ success: true, data: { response: randomFallback } });
  }
}
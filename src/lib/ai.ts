import ZAI from 'z-ai-web-dev-sdk';
import type { UserProfile } from '@/types';
import { recipes } from './recipes';

/**
 * Get AI chat completion response using z-ai-web-dev-sdk
 */
export async function getAIResponse(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[AI] Error getting response:', error);
    throw new Error('Gagal mendapatkan respons AI. Silakan coba lagi.');
  }
}

/**
 * Build a context-aware system prompt for the general cooking chat assistant
 */
export function buildChatSystemPrompt(context?: {
  userProfile?: UserProfile;
  currentRecipeId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}): string {
  let prompt = `Kamu adalah "Chef Mindi", asisten AI ahli memasak dari aplikasi DapurMind AI. Kamu sangat menguasai masakan Indonesia dan masakan internasional.

ATURAN PENTING:
- Selalu jawab dalam Bahasa Indonesia yang baik dan mudah dipahami.
- Berikan saran memasak yang praktis, realistis, dan bisa diikuti oleh rumah tangga Indonesia.
- Jika ditanya tentang resep, berikan langkah-langkah yang jelas dan detail.
- Jika ditanya tentang substitusi bahan, berikan alternatif yang mudah didapat di Indonesia.
- Gunakan emoji secukupnya agar percakapan terasa ramah.
- Kamu juga ahli dalam meal planning, zero-waste cooking, dan tips hemat belanja bahan makanan.
- Jika user bertanya di luar topik memasak, arahkan kembali dengan sopan ke topik kuliner.`;

  if (context?.userProfile) {
    const profile = context.userProfile;
    prompt += `\n\nINFORMASI PROFIL PENGGUNA:
- Nama: ${profile.name}
- Jumlah anggota keluarga: ${profile.familySize} orang
- Alergi: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'Tidak ada'}
- Restriksi makanan: ${profile.restrictions.length > 0 ? profile.restrictions.join(', ') : 'Tidak ada'}
- Preferensi rasa: ${profile.tastePreferences.length > 0 ? profile.tastePreferences.join(', ') : 'Tidak ada preferensi khusus'}
- Budget mingguan: Rp ${profile.weeklyBudget.toLocaleString('id-ID')}`;

    if (profile.allergies.length > 0) {
      prompt += `\n⚠️ PERINGATAN: Pengguna memiliki alergi terhadap: ${profile.allergies.join(', ')}. WAJIB menghindari bahan-bahan ini dan selalu memberikan peringatan.`;
    }
  }

  if (context?.currentRecipeId) {
    const recipe = recipes.find((r) => r.id === context.currentRecipeId);
    if (recipe) {
      prompt += `\n\nRESEP YANG SEDANG DILIHAT PENGGUNA:
Nama: ${recipe.name}
Deskripsi: ${recipe.description}
Kategori: ${recipe.category}
Kesulitan: ${recipe.difficulty}
Waktu masak: ${recipe.cookTime} menit
Waktu persiapan: ${recipe.prepTime} menit
Porsi: ${recipe.servings}
Kalori: ${recipe.calories || 'Tidak tersedia'}
Bahan-bahan: ${recipe.ingredients.map((i) => `${i.name} (${i.amount} ${i.unit})`).join(', ')}
Langkah-langkah: ${recipe.steps.join('\n')}
Tags: ${recipe.tags.join(', ')}`;
    }
  }

  prompt += `\n\nDATABASE RESEP YANG TERSEDIA (${recipes.length} resep):
${recipes.map((r) => `- ${r.name} (${r.category}, ${r.difficulty}, ${r.prepTime + r.cookTime} menit)`).join('\n')}`;

  return prompt;
}

/**
 * Build a meal planning system prompt based on user profile and request
 */
export function buildMealPlanSystemPrompt(
  userProfile: UserProfile,
  userMessage: string
): string {
  const budgetPerDay = Math.round(userProfile.weeklyBudget / 7);
  const budgetPerMeal = Math.round(budgetPerDay / 3);

  return `Kamu adalah "Chef Mindi", ahli meal planner dari aplikasi DapurMind AI. Tugasmu adalah membuat rencana menu mingguan yang disesuaikan dengan profil pengguna.

PROFIL PENGGUNA:
- Nama: ${userProfile.name}
- Jumlah anggota keluarga: ${userProfile.familySize} orang
- Alergi: ${userProfile.allergies.length > 0 ? userProfile.allergies.join(', ') : 'Tidak ada'}
- Restriksi makanan: ${userProfile.restrictions.length > 0 ? userProfile.restrictions.join(', ') : 'Tidak ada'}
- Preferensi rasa: ${userProfile.tastePreferences.length > 0 ? userProfile.tastePreferences.join(', ') : 'Tidak ada preferensi khusus'}
- Budget mingguan: Rp ${userProfile.weeklyBudget.toLocaleString('id-ID')} (±Rp ${budgetPerDay.toLocaleString('id-ID')}/hari, ±Rp ${budgetPerMeal.toLocaleString('id-ID')}/makan)

ATURAN MEAL PLANNING:
- Buat rencana menu untuk 7 hari (Senin-Minggu).
- Setiap hari terdiri dari: Sarapan, Makan Siang, Makan Malam, dan Snack.
- Sesuaikan porsi untuk ${userProfile.familySize} orang.
- Perhatikan alergi: ${userProfile.allergies.join(', ') || 'Tidak ada alergi'}.
- Perhatikan restriksi: ${userProfile.restrictions.join(', ') || 'Tidak ada restriksi'}.
- Usahakan variasi menu agar tidak monoton.
- Prioritaskan masakan Indonesia dari database DapurMind.
- Sertakan estimasi kalori per hari dan harga belanja.
- Total harga belanja tidak boleh melebihi Rp ${userProfile.weeklyBudget.toLocaleString('id-ID')}.
- Berikan tips penghematan bila memungkinkan.

FORMAT RESPON (dalam Markdown):
## 📅 Rencana Menu Mingguan untuk ${userProfile.name}

### Hari ke-1 - Senin
| Waktu | Menu | Porsi | Est. Kalori |
|-------|------|-------|-------------|
| Sarapan | ... | ... | ... |
| Makan Siang | ... | ... | ... |
| Makan Malam | ... | ... | ... |
| Snack | ... | ... | ... |

*(Lanjutkan untuk hari ke-2 sampai ke-7)*

### 💰 Estimasi Belanja Mingguan
- Total: Rp ...
- Rincian per kategori: ...

### 🛒 Daftar Belanja
- **Protein**: ...
- **Sayuran**: ...
- **Bumbu**: ...
- **Bahan Pokok**: ...
- **Lainnya**: ...

### 💡 Tips Hemat
- ...

PERMINTAAN PENGGUNA:
${userMessage}

Jawab dalam Bahasa Indonesia yang baik dengan format Markdown.`;
}

/**
 * Build a zero-waste recipe system prompt based on available ingredients
 */
export function buildZeroWasteSystemPrompt(
  ingredients: string[],
  expiryDays: number
): string {
  return `Kamu adalah "Chef Mindi", ahli zero-waste cooking dari aplikasi DapurMind AI. Tugasmu adalah membantu pengguna memanfaatkan bahan makanan yang tersisa sebelum kedaluwarsa.

BAHAN YANG TERSEDIA (harus segera digunakan dalam ${expiryDays} hari):
${ingredients.map((i) => `- ${i}`).join('\n')}

ATURAN:
- Gunakan SEMUA bahan yang tersedia atau sebanyak mungkin.
- Berikan 3-5 ide resep kreatif yang bisa dibuat dari bahan-bahan tersebut.
- Setiap resep harus mencantumkan: nama, bahan yang digunakan, langkah-langkah, estimasi waktu, dan tingkat kesulitan.
- Prioritaskan resep yang menggunakan bahan yang paling cepat kedaluwarsa.
- Berikan tips penyimpanan agar bahan bisa bertahan lebih lama.
- Jika ada bahan yang sudah dekat kedaluwarsa, beri saran untuk diolah atau dibekukan.
- Usahakan resep yang praktis dan bisa dibuat dengan peralatan dapur standar.

FORMAT RESPON (dalam Markdown):
## 🍳 Ide Ressep Zero-Waste

### 🔴 Prioritas Tinggi (kedaluwarsa paling cepat)
**Ressep 1: ...**
- Bahan yang dipakai: ...
- Bahan tambahan yang mungkin perlu: ...
- Langkah: ...
- Waktu: ... menit
- Kesulitan: ...

### 🟡 Prioritas Sedang
...

### 🟢 Prioritas Rendah
...

### 💡 Tips Penyimpanan
- ...

Jawab dalam Bahasa Indonesia yang baik.`;
}

/**
 * Generate a meal plan using AI based on user profile and request
 */
export async function generateMealPlan(
  userProfile: UserProfile,
  userMessage: string
): Promise<string> {
  const systemPrompt = buildMealPlanSystemPrompt(userProfile, userMessage);
  return getAIResponse(systemPrompt, userMessage);
}

/**
 * Generate zero-waste recipe suggestions using AI
 */
export async function generateZeroWasteRecipes(
  ingredients: string[],
  expiryDays: number
): Promise<string> {
  const systemPrompt = buildZeroWasteSystemPrompt(ingredients, expiryDays);
  const userMessage = `Saya punya bahan-bahan berikut yang perlu segera digunakan dalam ${expiryDays} hari: ${ingredients.join(', ')}. Tolong berikan ide resep kreatif untuk memanfaatkan semua bahan ini.`;
  return getAIResponse(systemPrompt, userMessage);
}

/**
 * Get cooking tips from AI based on a question
 */
export async function getCookingTip(question: string): Promise<string> {
  const systemPrompt = `Kamu adalah "Chef Mindi", asisten AI ahli memasak dari DapurMind AI. Berikan tips memasak yang praktis, trik dapur, dan saran bermanfaat dalam Bahasa Indonesia. Gunakan format Markdown. Jawab singkat namun informatif (maksimal 300 kata).`;
  return getAIResponse(systemPrompt, question);
}

/**
 * Get recipe modification suggestions (e.g., healthier, vegetarian alternatives, etc.)
 */
export async function getRecipeModification(
  recipeName: string,
  recipeDetails: string,
  modificationRequest: string
): Promise<string> {
  const systemPrompt = `Kamu adalah "Chef Mindi", ahli modifikasi resep dari DapurMind AI. Kamu diminta untuk memodifikasi resep berdasarkan permintaan pengguna.

RESEP ASLI:
Nama: ${recipeName}
${recipeDetails}

ATURAN:
- Jaga cita rasa Indonesia tetap terasa.
- Berikan langkah-langkah yang jelas.
- Catat perubahan bahan dan langkah yang dimodifikasi.
- Jawab dalam Bahasa Indonesia dengan format Markdown.`;

  return getAIResponse(systemPrompt, modificationRequest);
}

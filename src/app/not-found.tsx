import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-6xl">🍳</span>
      <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Ditemukan</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

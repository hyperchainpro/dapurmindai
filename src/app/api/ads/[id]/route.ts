import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    await db.adPlacement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json({ error: 'Gagal menghapus iklan' }, { status: 500 });
  }
}
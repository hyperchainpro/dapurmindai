import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Cache directory for generated images
const CACHE_DIR = path.join(process.cwd(), 'public', 'recipes', 'generated');
const WESTERN_DIR = path.join(process.cwd(), 'public', 'recipes', 'western');
const LOCAL_DIR = path.join(process.cwd(), 'public', 'recipes');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('id');
    const isWestern = searchParams.get('western') === 'true';

    if (!recipeId) {
      return NextResponse.json({ error: 'Missing recipe ID' }, { status: 400 });
    }

    // Sanitize recipe ID (prevent path traversal)
    const safeId = recipeId.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!safeId) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Check if image exists in public directory
    const possiblePaths = [
      path.join(isWestern ? WESTERN_DIR : LOCAL_DIR, `${safeId}.jpg`),
      path.join(CACHE_DIR, `${safeId}.jpg`),
      path.join(LOCAL_DIR, `${safeId}.png`),
      path.join(CACHE_DIR, `${safeId}.png`),
    ];

    for (const imgPath of possiblePaths) {
      try {
        const buffer = await fs.readFile(imgPath);
        const ext = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': ext,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch {
        // File doesn't exist at this path, try next
      }
    }

    // No image found - return a transparent 1x1 pixel placeholder instead of 404
    // This prevents the app from breaking when images aren't pre-generated
    const placeholder = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(placeholder, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[API /recipe-image] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

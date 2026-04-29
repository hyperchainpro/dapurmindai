import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Cache directory for generated images
const CACHE_DIR = path.join(process.cwd(), 'public', 'recipes', 'generated');
const WESTERN_DIR = path.join(process.cwd(), 'public', 'recipes', 'western');
const LOCAL_DIR = path.join(process.cwd(), 'public', 'recipes');

async function generateImage(recipeId: string, recipeName: string, isWestern: boolean): Promise<Buffer | null> {
  try {
    const outputDir = isWestern ? WESTERN_DIR : CACHE_DIR;
    const outputPath = path.join(outputDir, `${recipeId}.jpg`);

    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const prompt = `Delicious ${recipeName}, professional food photography, warm lighting, top-down view, on a white plate, high quality`;

    execSync(
      `z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${outputPath}" -s 1024x1024`,
      { timeout: 60000, stdio: 'pipe' }
    );

    const imageBuffer = await fs.readFile(outputPath);
    return imageBuffer;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get('id');
  const recipeName = searchParams.get('name') || 'food dish';
  const isWestern = searchParams.get('western') === 'true';

  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipe ID' }, { status: 400 });
  }

  // Sanitize recipe ID (prevent path traversal)
  const safeId = recipeId.replace(/[^a-zA-Z0-9_-]/g, '');

  // Check if image already exists in public directory
  const possiblePaths = [
    path.join(isWestern ? WESTERN_DIR : LOCAL_DIR, `${safeId}.jpg`),
    path.join(CACHE_DIR, `${safeId}.jpg`),
  ];

  for (const imgPath of possiblePaths) {
    try {
      const buffer = await fs.readFile(imgPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // File doesn't exist at this path, try next
    }
  }

  // Generate the image on-demand
  const imageBuffer = await generateImage(safeId, recipeName, isWestern);

  if (imageBuffer) {
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Return 404
  return new NextResponse.json({ error: 'Image generation failed' }, { status: 404 });
}

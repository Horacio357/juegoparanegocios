import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const stageField = formData.get('stageField') || '1';
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create safe filename
    const filename = `bg-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, buffer);
    const bgImagePath = `/uploads/${filename}`;

    // Get current settings
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    // Determine which field to update
    const dataToUpdate = {};
    if (stageField === '2') {
      dataToUpdate.bgImagePathStage2 = bgImagePath;
    } else if (stageField === '3') {
      dataToUpdate.bgImagePathStage3 = bgImagePath;
    } else {
      dataToUpdate.bgImagePath = bgImagePath;
    }

    // Update settings with new image path
    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data: dataToUpdate
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to ensure at least one settings row exists
async function getOrCreateSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {}
    });
  }
  return settings;
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch (error) {
    // Fallback if Prisma is broken
    return NextResponse.json({
      colorTheme: 1, discountPerBrick: 0.5, maxDiscount: 50, bgImagePath: '/uploads/wolverine.jpg'
    });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const current = await getOrCreateSettings();
    
    const updated = await prisma.settings.update({
      where: { id: current.id },
      data: {
        colorTheme: body.colorTheme !== undefined ? parseInt(body.colorTheme) : undefined,
        discountPerBrick: body.discountPerBrick !== undefined ? parseFloat(body.discountPerBrick) : undefined,
        maxDiscount: body.maxDiscount !== undefined ? parseInt(body.maxDiscount) : undefined,
        bgImagePosition: body.bgImagePosition !== undefined ? body.bgImagePosition : undefined,
        gameMode: body.gameMode !== undefined ? body.gameMode : undefined,
        timeAttackSeconds: body.timeAttackSeconds !== undefined ? parseInt(body.timeAttackSeconds) : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
  }
}

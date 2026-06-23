import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topLeads = await prisma.lead.findMany({
      orderBy: [
        { discountWon: 'desc' },
        { stageReached: 'desc' }
      ],
      take: 10
    });

    return NextResponse.json(topLeads);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
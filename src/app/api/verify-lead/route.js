import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, email, phone } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Bypass de prueba (más tolerante)
    if (email.toLowerCase().includes('prueba')) {
      return NextResponse.json({ exists: false });
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const existingLead = await prisma.lead.findFirst({
      where: {
        AND: [
          { createdAt: { gte: oneMonthAgo } },
          {
            OR: [
              { email: email.toLowerCase().trim() },
              { phone: phone.trim() },
              { name: name.trim() }
            ]
          }
        ]
      }
    });

    if (existingLead) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error verifying lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
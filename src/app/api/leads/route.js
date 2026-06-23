import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, stageReached, discountWon } = body;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        stageReached,
        discountWon
      }
    });

    // Send data to Google Sheets Webhook
    try {
      const sheetsUrl = 'https://script.google.com/macros/s/AKfycbyFJ6RUkTnRIqE-9ppQUUkiTynOmrDX3AlMcbMg32o8r3fAqX7wdM0M24IX44jQ0DEB/exec';
      await fetch(sheetsUrl, {
        method: 'POST',
        body: JSON.stringify(lead),
      });
    } catch (sheetError) {
      console.error("Error saving to Google Sheets:", sheetError);
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating lead' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching leads' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const mixedDrinks = await db.mixedDrink.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ mixedDrinks });
  } catch (error) {
    console.error('Error fetching mixed drinks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mixed drinks' },
      { status: 500 }
    );
  }
}


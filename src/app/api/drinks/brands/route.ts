import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category: category as "beer" | "wine" | "cocktail" | "shot" | "other" } : {};

    const brands = await db.drinkBrand.findMany({
      where,
      include: {
        servingSizes: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}


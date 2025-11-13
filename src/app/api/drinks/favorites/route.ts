import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ favorites: [] }); // Return empty array instead of error
    }

    const favorites = await db.userFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        preset: true,
        mixedDrink: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ favorites: [] }); // Return empty array on error
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { presetId, mixedDrinkId, customName, customAbv, customVolumeMl, customCategory } = body;

    const favorite = await db.userFavorite.create({
      data: {
        userId: session.user.id,
        presetId,
        mixedDrinkId,
        customName,
        customAbv,
        customVolumeMl,
        customCategory,
      },
      include: {
        preset: true,
        mixedDrink: true,
      },
    });

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');

    if (!favoriteId) {
      return NextResponse.json({ error: 'Favorite ID required' }, { status: 400 });
    }

    await db.userFavorite.delete({
      where: {
        id: favoriteId,
        userId: session.user.id, // Ensure user owns this favorite
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}


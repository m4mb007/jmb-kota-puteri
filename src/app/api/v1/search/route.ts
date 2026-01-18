import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();
    const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);

    const results: Array<{
      type: 'user' | 'unit';
      id: string;
      label: string;
      subtitle?: string;
    }> = [];

    // Only management can search all data
    if (isManagement) {
      // Search users
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
        },
      });

      users.forEach(user => {
        results.push({
          type: 'user',
          id: user.id,
          label: user.name,
          subtitle: `${user.phone} • ${user.role}`,
        });
      });

      // Search units
      const units = await prisma.unit.findMany({
        where: {
          isActive: true,
          OR: [
            { unitNumber: { contains: searchTerm, mode: 'insensitive' } },
            { owner: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { owner: { phone: { contains: searchTerm } } },
            { tenant: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { tenant: { phone: { contains: searchTerm } } },
          ],
        },
        take: 5,
        include: {
          owner: {
            select: {
              name: true,
            },
          },
          tenant: {
            select: {
              name: true,
            },
          },
        },
      });

      units.forEach(unit => {
        const ownerName = unit.owner?.name || 'Tiada pemilik';
        const tenantInfo = unit.tenant ? ` • Penyewa: ${unit.tenant.name}` : '';
        results.push({
          type: 'unit',
          id: unit.id,
          label: unit.unitNumber,
          subtitle: `Pemilik: ${ownerName}${tenantInfo}`,
        });
      });
    } else {
      // Regular users can only search their own units
      const units = await prisma.unit.findMany({
        where: {
          isActive: true,
          OR: [
            { ownerId: session.user.id },
            { tenantId: session.user.id },
          ],
          unitNumber: { contains: searchTerm, mode: 'insensitive' },
        },
        take: 5,
      });

      units.forEach(unit => {
        results.push({
          type: 'unit',
          id: unit.id,
          label: unit.unitNumber,
          subtitle: 'Unit anda',
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Ralat semasa mencari' },
      { status: 500 }
    );
  }
}


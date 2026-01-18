'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from './audit';

/**
 * Check if a user is eligible to vote
 * Priority: Manual override by JMB > System check (arrears)
 */
export async function checkVotingEligibility(userId: string): Promise<{
  eligible: boolean;
  reason?: string;
  arrearsAmount?: number;
  isManualOverride?: boolean;
  overrideReason?: string;
}> {
  try {
    // Check for manual override by JMB first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        votingEligibilityOverride: true,
        votingEligibilityReason: true,
      },
    });

    // If JMB has manually set eligibility, respect that decision
    if (user?.votingEligibilityOverride !== null && user?.votingEligibilityOverride !== undefined) {
      if (user.votingEligibilityOverride === true) {
        return {
          eligible: true,
          isManualOverride: true,
          overrideReason: user.votingEligibilityReason || 'Diluluskan oleh JMB',
        };
      } else {
        return {
          eligible: false,
          reason: user.votingEligibilityReason || 'Tidak dibenarkan oleh JMB',
          isManualOverride: true,
        };
      }
    }

    // Otherwise, check system rules (arrears)
    const units = await prisma.unit.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { tenantId: userId },
        ],
      },
      select: {
        id: true,
        unitNumber: true,
        manualArrearsAmount: true,
      },
    });

    if (units.length === 0) {
      return {
        eligible: false,
        reason: 'Tiada unit berdaftar',
      };
    }

    // Calculate manual arrears
    const manualArrearsTotal = units.reduce(
      (sum, u) => sum + (u.manualArrearsAmount || 0),
      0
    );

    // Calculate system arrears (pending bills)
    const arrears = await prisma.bill.aggregate({
      where: {
        status: 'PENDING',
        unitId: {
          in: units.map(u => u.id),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const systemArrearsAmount = arrears._sum.amount || 0;
    const totalArrears = manualArrearsTotal + systemArrearsAmount;

    if (totalArrears > 0) {
      return {
        eligible: false,
        reason: `Mempunyai tunggakan sebanyak RM ${totalArrears.toFixed(2)}. Sila selesaikan tunggakan untuk layak mengundi.`,
        arrearsAmount: totalArrears,
      };
    }

    return {
      eligible: true,
    };
  } catch (error) {
    console.error('Error checking voting eligibility:', error);
    return {
      eligible: false,
      reason: 'Ralat memeriksa kelayakan',
    };
  }
}

/**
 * Create a new AGM
 */
export async function createAGM(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const meetingDate = formData.get('meetingDate') as string;
  const status = (formData.get('status') as string) || 'DRAFT';

  if (!title || !meetingDate) {
    throw new Error('Sila isi semua maklumat yang diperlukan');
  }

  // Parse resolutions from form data
  const resolutions: { title: string; description?: string; order: number }[] = [];
  let i = 0;
  while (formData.has(`resolution_${i}_title`)) {
    const resTitle = formData.get(`resolution_${i}_title`) as string;
    const resDescription = formData.get(`resolution_${i}_description`) as string;
    if (resTitle) {
      resolutions.push({
        title: resTitle,
        description: resDescription || undefined,
        order: i,
      });
    }
    i++;
  }

  const agm = await prisma.aGM.create({
    data: {
      title,
      description: description || undefined,
      meetingDate: new Date(meetingDate),
      status: status as any,
      createdById: session.user.id,
      resolutions: {
        create: resolutions,
      },
    },
    include: {
      resolutions: true,
    },
  });

  await createAuditLog(
    'CREATE_AGM',
    `Cipta AGM: ${title} pada ${new Date(meetingDate).toLocaleDateString('ms-MY')}`
  );

  revalidatePath('/dashboard/agm');
  return agm;
}

/**
 * Update AGM
 */
export async function updateAGM(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const meetingDate = formData.get('meetingDate') as string;
  const status = formData.get('status') as string;

  if (!title || !meetingDate) {
    throw new Error('Sila isi semua maklumat yang diperlukan');
  }

  const agm = await prisma.aGM.update({
    where: { id },
    data: {
      title,
      description: description || undefined,
      meetingDate: new Date(meetingDate),
      status: status as any,
    },
  });

  await createAuditLog(
    'UPDATE_AGM',
    `Kemaskini AGM: ${title}`
  );

  revalidatePath('/dashboard/agm');
  revalidatePath(`/dashboard/agm/${id}`);
  return agm;
}

/**
 * Update AGM status
 */
export async function updateAGMStatus(id: string, status: 'DRAFT' | 'ACTIVE' | 'CLOSED') {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const agm = await prisma.aGM.update({
    where: { id },
    data: { status },
  });

  await createAuditLog(
    'UPDATE_AGM_STATUS',
    `Status AGM "${agm.title}" dikemaskini kepada ${status}`
  );

  revalidatePath('/dashboard/agm');
  revalidatePath(`/dashboard/agm/${id}`);
  return agm;
}

/**
 * Delete AGM
 */
export async function deleteAGM(id: string) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const agm = await prisma.aGM.findUnique({
    where: { id },
    select: { title: true },
  });

  if (!agm) {
    throw new Error('AGM tidak dijumpai');
  }

  await prisma.aGM.delete({
    where: { id },
  });

  await createAuditLog(
    'DELETE_AGM',
    `Padam AGM: ${agm.title}`
  );

  revalidatePath('/dashboard/agm');
}

/**
 * Add resolution to AGM
 */
export async function addResolution(agmId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (!title) {
    throw new Error('Sila isi tajuk resolusi');
  }

  // Get the max order for this AGM
  const maxOrder = await prisma.aGMResolution.aggregate({
    where: { agmId },
    _max: { order: true },
  });

  const order = (maxOrder._max.order || 0) + 1;

  const resolution = await prisma.aGMResolution.create({
    data: {
      title,
      description: description || undefined,
      order,
      agmId,
    },
  });

  await createAuditLog(
    'ADD_RESOLUTION',
    `Tambah resolusi: ${title}`
  );

  revalidatePath('/dashboard/agm');
  revalidatePath(`/dashboard/agm/${agmId}`);
  return resolution;
}

/**
 * Delete resolution
 */
export async function deleteResolution(id: string) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const resolution = await prisma.aGMResolution.findUnique({
    where: { id },
    include: { agm: true },
  });

  if (!resolution) {
    throw new Error('Resolusi tidak dijumpai');
  }

  await prisma.aGMResolution.delete({
    where: { id },
  });

  await createAuditLog(
    'DELETE_RESOLUTION',
    `Padam resolusi: ${resolution.title}`
  );

  revalidatePath('/dashboard/agm');
  revalidatePath(`/dashboard/agm/${resolution.agmId}`);
}

/**
 * Cast a vote
 */
export async function castVote(resolutionId: string, choice: 'SETUJU' | 'TIDAK_SETUJU' | 'BERKECUALI') {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Sila log masuk');
  }

  // Check if user is eligible to vote
  const eligibility = await checkVotingEligibility(session.user.id);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || 'Tidak layak mengundi');
  }

  // Check if resolution exists and AGM is active
  const resolution = await prisma.aGMResolution.findUnique({
    where: { id: resolutionId },
    include: { agm: true },
  });

  if (!resolution) {
    throw new Error('Resolusi tidak dijumpai');
  }

  if (resolution.agm.status !== 'ACTIVE') {
    throw new Error('AGM tidak aktif. Pengundian tidak dibenarkan.');
  }

  // Get user's primary unit (for record keeping)
  const unit = await prisma.unit.findFirst({
    where: {
      OR: [
        { ownerId: session.user.id },
        { tenantId: session.user.id },
      ],
    },
  });

  // Upsert vote (update if exists, create if not)
  const vote = await prisma.vote.upsert({
    where: {
      resolutionId_userId: {
        resolutionId,
        userId: session.user.id,
      },
    },
    update: {
      choice,
    },
    create: {
      resolutionId,
      userId: session.user.id,
      unitId: unit?.id,
      choice,
    },
  });

  await createAuditLog(
    'CAST_VOTE',
    `Undi resolusi "${resolution.title}": ${choice}`
  );

  revalidatePath(`/dashboard/agm/${resolution.agmId}`);
  revalidatePath('/dashboard/agm/vote');
  return vote;
}

/**
 * Get AGM results
 */
export async function getAGMResults(agmId: string) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const agm = await prisma.aGM.findUnique({
    where: { id: agmId },
    include: {
      resolutions: {
        include: {
          votes: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              unit: {
                select: {
                  unitNumber: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!agm) {
    throw new Error('AGM tidak dijumpai');
  }

  // Calculate vote counts for each resolution
  const results = agm.resolutions.map(resolution => {
    const voteCounts = {
      SETUJU: 0,
      TIDAK_SETUJU: 0,
      BERKECUALI: 0,
    };

    resolution.votes.forEach(vote => {
      voteCounts[vote.choice]++;
    });

    return {
      ...resolution,
      voteCounts,
      totalVotes: resolution.votes.length,
    };
  });

  return {
    agm,
    results,
  };
}

/**
 * Set voting eligibility override for a user (JMB only)
 */
export async function setVotingEligibilityOverride(
  userId: string,
  eligible: boolean | null,
  reason?: string
) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) {
    throw new Error('Pengguna tidak dijumpai');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      votingEligibilityOverride: eligible,
      votingEligibilityReason: reason || null,
      votingEligibilitySetBy: eligible !== null ? session.user.id : null,
      votingEligibilitySetAt: eligible !== null ? new Date() : null,
    },
  });

  const action = 
    eligible === true ? 'LAYAK (manual)' :
    eligible === false ? 'TIDAK LAYAK (manual)' :
    'RESET (ikut sistem)';

  await createAuditLog(
    'SET_VOTING_ELIGIBILITY',
    `Tetapkan kelayakan undi untuk ${user.name}: ${action}${reason ? ` - ${reason}` : ''}`
  );

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}


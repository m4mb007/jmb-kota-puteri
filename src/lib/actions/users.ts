'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuditLog } from '@/lib/actions/audit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Role, Gender, Religion, Prisma, CommitteeType } from '@prisma/client';

async function saveFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
  
  await mkdir(uploadDir, { recursive: true });
  
  const path = join(uploadDir, filename);
  await writeFile(path, buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;
  const phone = formData.get('phone') as string;
  
  const icNumber = formData.get('icNumber') as string;
  const gender = formData.get('gender') as Gender;
  const religion = formData.get('religion') as Religion;

  if (!name || !password || !role || !phone) {
    throw new Error('Semua medan wajib diisi');
  }

  // File and Date handling for Owner
  let handoverDate: Date | null = null;
  let snpDate: Date | null = null;
  let snpFile: string | null = null;
  let fileB: string | null = null;
  let fileC: string | null = null;

  if (role === 'OWNER') {
    const handoverDateStr = formData.get('handoverDate') as string;
    const snpDateStr = formData.get('snpDate') as string;
    const snpFileObj = formData.get('snpFile') as File;
    const fileBObj = formData.get('fileB') as File;
    const fileCObj = formData.get('fileC') as File;

    if (handoverDateStr) handoverDate = new Date(handoverDateStr);
    if (snpDateStr) snpDate = new Date(snpDateStr);
    
    // Save files if they exist and have size > 0
    if (snpFileObj && snpFileObj.size > 0) snpFile = await saveFile(snpFileObj, 'snp');
    if (fileBObj && fileBObj.size > 0) fileB = await saveFile(fileBObj, 'file_b');
    if (fileCObj && fileCObj.size > 0) fileC = await saveFile(fileCObj, 'file_c');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email: email || null,
        password: hashedPassword,
        role,
        phone,
        icNumber: icNumber || null,
        gender: gender || null,
        religion: religion || null,
        handoverDate,
        snpDate,
        snpFile,
        fileB,
        fileC,
      },
    });

    await createAuditLog('CREATE_USER', `Created user: ${name} (${role})`);

  } catch (error: unknown) {
    console.error('Failed to create user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target) {
      const target = error.meta.target;
      if (Array.isArray(target)) {
        if (target.includes('email')) throw new Error('Emel ini telah digunakan.');
        if (target.includes('phone')) throw new Error('No. Telefon ini telah digunakan.');
        if (target.includes('icNumber')) throw new Error('No. KP ini telah digunakan.');
      }
    }
    throw new Error('Gagal mencipta pengguna. Sila pastikan Emel dan No. Telefon adalah unik.');
  }

  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      ownedUnits: {
        include: {
          lot: true,
        },
      },
      rentedUnits: {
        include: {
          lot: true,
        },
      },
    },
  });
  return user;
}

export async function deactivateUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Tiada kebenaran (Unauthorized).');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new Error('Pengguna tidak dijumpai.');
  }

  if (targetUser.id === session.user.id) {
    throw new Error('Tidak boleh nyahaktif akaun sendiri.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await createAuditLog(
    'DEACTIVATE_USER',
    `Super Admin deactivated user: ${targetUser.name} (${targetUser.role})`
  );

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Sesi tamat. Sila log masuk semula.');
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const icNumber = formData.get('icNumber') as string;
  const gender = formData.get('gender') as Gender;
  const religion = formData.get('religion') as Religion;
  
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name) throw new Error('Nama wajib diisi.');
  if (!phone) throw new Error('No. Telefon wajib diisi.');

  // Validate password change only if new password is provided
  if (newPassword) {
    if (!currentPassword) {
      throw new Error('Sila masukkan kata laluan semasa untuk menukar kata laluan.');
    }

    if (newPassword.length < 6) {
      throw new Error('Kata laluan baru mesti sekurang-kurangnya 6 aksara.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Kata laluan baru tidak sepadan.');
    }

    // Verify current password
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    
    if (!currentUser) {
      throw new Error('Pengguna tidak dijumpai.');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, currentUser.password);
    if (!passwordMatch) {
      throw new Error('Kata laluan semasa tidak betul.');
    }
  }

  const data: Prisma.UserUpdateInput = {
    name,
    email: email || null,
    phone,
    icNumber: icNumber || null,
    gender: gender || null,
    religion: religion || null,
  };

  // Add hashed new password if changing password
  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 10);
  }

  if (userRole === 'OWNER') {
    const handoverDateStr = formData.get('handoverDate') as string;
    const snpDateStr = formData.get('snpDate') as string;
    
    if (handoverDateStr) data.handoverDate = new Date(handoverDateStr);
    if (snpDateStr) data.snpDate = new Date(snpDateStr);

    const snpFileObj = formData.get('snpFile') as File;
    const fileBObj = formData.get('fileB') as File;
    const fileCObj = formData.get('fileC') as File;

    if (snpFileObj && snpFileObj.size > 0) {
      data.snpFile = await saveFile(snpFileObj, 'snp');
    }
    if (fileBObj && fileBObj.size > 0) {
      data.fileB = await saveFile(fileBObj, 'file_b');
    }
    if (fileCObj && fileCObj.size > 0) {
      data.fileC = await saveFile(fileCObj, 'file_c');
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
    
    const auditDetails = newPassword 
      ? `User updated profile and changed password: ${name}` 
      : `User updated profile: ${name}`;
    await createAuditLog('UPDATE_PROFILE', auditDetails);
  } catch (error: unknown) {
    console.error('Failed to update profile:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target) {
      const target = error.meta.target;
      if (Array.isArray(target)) {
        if (target.includes('email')) throw new Error('Emel ini telah digunakan.');
        if (target.includes('phone')) throw new Error('No. Telefon ini telah digunakan.');
        if (target.includes('icNumber')) throw new Error('No. KP ini telah digunakan.');
      }
    }
    throw new Error('Gagal mengemaskini profil.');
  }

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard');
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Tiada kebenaran (Unauthorized).');
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;
  const phone = formData.get('phone') as string;
  
  const icNumber = formData.get('icNumber') as string;
  const gender = formData.get('gender') as Gender;
  const religion = formData.get('religion') as Religion;
  
  // Committee info
  const committeeType = formData.get('committeeType') as string;
  const committeePosition = formData.get('committeePosition') as string;

  if (!name || !role || !phone) {
    throw new Error('Nama, Peranan, dan No. Telefon wajib diisi.');
  }

  const data: Prisma.UserUpdateInput = {
    name,
    email: email || null,
    role,
    phone,
    icNumber: icNumber || null,
    gender: gender || null,
    religion: religion || null,
    committeeType: (committeeType && committeeType !== '_none') ? (committeeType as CommitteeType) : null,
    committeePosition: committeePosition || null,
  };

  if (password && password.trim() !== '') {
    data.password = await bcrypt.hash(password, 10);
  }

  if (role === 'OWNER') {
    const handoverDateStr = formData.get('handoverDate') as string;
    const snpDateStr = formData.get('snpDate') as string;
    
    if (handoverDateStr) data.handoverDate = new Date(handoverDateStr);
    if (snpDateStr) data.snpDate = new Date(snpDateStr);

    const snpFileObj = formData.get('snpFile') as File;
    const fileBObj = formData.get('fileB') as File;
    const fileCObj = formData.get('fileC') as File;

    if (snpFileObj && snpFileObj.size > 0) {
      data.snpFile = await saveFile(snpFileObj, 'snp');
    }
    if (fileBObj && fileBObj.size > 0) {
      data.fileB = await saveFile(fileBObj, 'file_b');
    }
    if (fileCObj && fileCObj.size > 0) {
      data.fileC = await saveFile(fileCObj, 'file_c');
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
    
    await createAuditLog('UPDATE_USER', `Super Admin updated user: ${name} (${role})`);
  } catch (error: unknown) {
    console.error('Failed to update user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target) {
        const target = error.meta.target;
        if (Array.isArray(target)) {
          if (target.includes('email')) throw new Error('Emel ini telah digunakan.');
          if (target.includes('phone')) throw new Error('No. Telefon ini telah digunakan.');
          if (target.includes('icNumber')) throw new Error('No. KP ini telah digunakan.');
        }
    }
    throw new Error('Gagal mengemaskini pengguna.');
  }

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
  redirect('/dashboard/users');
}

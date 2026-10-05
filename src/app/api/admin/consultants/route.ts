import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const consultants = await prisma.consultant.findMany({
      include: {
        user: true,
        specialties: {
          include: { specialty: true },
        },
        services: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, consultants });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      avatarUrl,
      title,
      slug,
      initials,
      shortBio,
      bio,
      yearsOfExperience,
      languages,
      tags,
      isActive,
    } = body;

    if (!name || !email || !title || !bio) {
      return NextResponse.json({ success: false, error: 'يرجى تعبئة كافة الحقول المطلوبة' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const rawPassword = password ? password.trim() : 'Consultant@123456';
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // Generate slug if not provided
    const generatedSlug = slug || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        passwordHash,
        phone: phone ? phone.trim() : null,
        avatarUrl: avatarUrl || null,
        role: 'CONSULTANT',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    const consultant = await prisma.consultant.create({
      data: {
        userId: user.id,
        slug: generatedSlug || undefined,
        title: title.trim(),
        initials: initials ? initials.trim() : null,
        shortBio: shortBio || null,
        bio: bio.trim(),
        yearsOfExperience: Number(yearsOfExperience) || 1,
        languages: Array.isArray(languages) ? languages : ['العربية'],
        tags: Array.isArray(tags) ? tags : [],
        telegramChatId: body.telegramChatId ? String(body.telegramChatId).trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, consultant });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

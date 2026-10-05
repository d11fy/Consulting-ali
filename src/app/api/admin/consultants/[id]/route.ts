import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { id } = await params;
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
      telegramChatId,
      isActive,
    } = body;

    const existingConsultant = await prisma.consultant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingConsultant) {
      return NextResponse.json({ success: false, error: 'المستشار غير موجود' }, { status: 404 });
    }

    // Prepare password hash if updated
    let newPasswordHash: string | undefined = undefined;
    if (password && typeof password === 'string' && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      newPasswordHash = await bcrypt.hash(password.trim(), salt);
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    if (cleanEmail && cleanEmail !== existingConsultant.user.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (emailConflict) {
        return NextResponse.json({ success: false, error: 'البريد الإلكتروني مستخدم لحساب آخر' }, { status: 400 });
      }
    }

    // Update user info
    await prisma.user.update({
      where: { id: existingConsultant.userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(cleanEmail && { email: cleanEmail }),
        ...(newPasswordHash && { passwordHash: newPasswordHash }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    // Update consultant info
    const updatedConsultant = await prisma.consultant.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(slug !== undefined && { slug }),
        ...(initials !== undefined && { initials }),
        ...(shortBio !== undefined && { shortBio }),
        ...(bio && { bio }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
        ...(languages && { languages: Array.isArray(languages) ? languages : [languages] }),
        ...(tags && { tags: Array.isArray(tags) ? tags : [tags] }),
        ...(telegramChatId !== undefined && { telegramChatId: telegramChatId ? String(telegramChatId).trim() : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, consultant: updatedConsultant });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { id } = await params;

    // Soft-delete / disable consultant
    const updated = await prisma.consultant.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, consultant: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { sendRoadmapReadyEmail } from '@/lib/integrations/email/service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

    const formData = await request.formData();
    const bookingId = formData.get('bookingId') as string;
    const summary = (formData.get('summary') as string) || '';
    const analysis = (formData.get('analysis') as string) || '';
    const nextSteps = (formData.get('nextSteps') as string) || '';
    const file = formData.get('file') as File | null;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'معرف الحجز مطلوب' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, roadmap: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    // Role check: if CONSULTANT, must match assigned consultant
    if (session.role === Role.CONSULTANT) {
      const consultant = await prisma.consultant.findUnique({ where: { userId: session.id } });
      if (booking.consultantId !== consultant?.id) {
        return NextResponse.json({ success: false, error: 'غير مصرح لك بإدارة هذا الحجز' }, { status: 403 });
      }
    }

    let documentId = booking.roadmap?.roadmapDocumentId;
    const downloadToken = booking.roadmap?.downloadToken || crypto.randomBytes(24).toString('hex');

    // If new file provided
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.pdf';
      const storedFileName = `roadmap_${crypto.randomBytes(16).toString('hex')}${ext}`;

      const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
      await fs.mkdir(uploadDir, { recursive: true });

      const targetPath = path.join(uploadDir, storedFileName);
      await fs.writeFile(targetPath, buffer);

      const doc = await prisma.document.create({
        data: {
          originalName: file.name,
          storedFileName,
          filePath: targetPath,
          mimeType: file.type || 'application/pdf',
          sizeBytes: file.size,
          category: 'roadmap',
          isConfidential: true,
          uploadedBy: session.name,
        },
      });

      documentId = doc.id;
    }

    // Update Roadmap in DB
    const now = new Date();
    await prisma.roadmap.upsert({
      where: { bookingId },
      update: {
        summary,
        analysis,
        nextSteps,
        roadmapDocumentId: documentId,
        downloadToken,
        status: 'delivered',
        deliveredAt: now,
      },
      create: {
        bookingId,
        consultantId: booking.consultantId!,
        summary,
        analysis,
        nextSteps,
        roadmapDocumentId: documentId,
        downloadToken,
        status: 'delivered',
        deliveredAt: now,
      },
    });

    // Send email notification to client
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const downloadUrl = `${appUrl}/api/documents/download?token=${downloadToken}`;

    await sendRoadmapReadyEmail({
      customerName: booking.customer.fullName,
      customerEmail: booking.customer.email,
      reference: booking.bookingReference,
      downloadUrl,
    }).catch((err) => console.error('Failed to send roadmap email:', err));

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPLOAD_ROADMAP_DELIVERED',
        entity: 'Roadmap',
        entityId: booking.id,
        newValue: JSON.stringify({ downloadToken }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسليم وثيقة خارطة الطريق بنجاح وإرسال رابط التنزيل للعميل.',
      downloadToken,
    });
  } catch (error: any) {
    console.error('Error uploading roadmap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

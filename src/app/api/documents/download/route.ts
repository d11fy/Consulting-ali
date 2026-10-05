import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import fs from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const documentId = searchParams.get('id');
    const token = searchParams.get('token');
    const receiptProofId = searchParams.get('receiptProofId');

    let document: any = null;

    // 0. If receiptProofId requested
    if (receiptProofId) {
      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
      }

      const proof = await prisma.paymentProof.findUnique({
        where: { id: receiptProofId },
      });

      if (!proof) {
        return NextResponse.json({ success: false, error: 'الإيصال غير موجود' }, { status: 404 });
      }

      let fileBuffer: Buffer;
      const mime = proof.fileMime || 'image/jpeg';

      if (proof.receiptFilePath.startsWith('data:')) {
        const matches = proof.receiptFilePath.match(/^data:(.+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : proof.receiptFilePath.replace(/^data:[^;]+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        try {
          fileBuffer = await fs.readFile(proof.receiptFilePath);
        } catch {
          return NextResponse.json({ success: false, error: 'تعذر العثور على ملف الإيصال المخزن' }, { status: 404 });
        }
      }

      const headers = new Headers();
      headers.set('Content-Type', mime);
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(proof.receiptFileName)}"`);
      return new NextResponse(new Uint8Array(fileBuffer), { status: 200, headers });
    }

    // 1. If download token is provided (e.g. for Roadmap download by client)
    if (token) {
      const roadmap = await prisma.roadmap.findUnique({
        where: { downloadToken: token },
        include: { roadmapDocument: true, booking: true },
      });

      if (!roadmap || !roadmap.roadmapDocument) {
        return NextResponse.json({ success: false, error: 'رابط التنزيل غير صالح أو منتهي الصلاحية' }, { status: 404 });
      }

      document = roadmap.roadmapDocument;

      // Log download in audit
      await prisma.auditLog.create({
        data: {
          action: 'DOWNLOAD_ROADMAP_FILE',
          entity: 'Roadmap',
          entityId: roadmap.id,
          newValue: JSON.stringify({ fileName: document.originalName }),
        },
      });
    } else if (documentId) {
      // 2. Direct document ID: Requires authentication & permission check
      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول لتحميل هذا الملف' }, { status: 401 });
      }

      document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          bookings: {
            include: {
              booking: true,
            },
          },
        },
      });

      if (!document) {
        return NextResponse.json({ success: false, error: 'الملف غير موجود' }, { status: 404 });
      }

      // Check RBAC permission:
      if (session.role === 'CONSULTANT') {
        const isLinkedToConsultant = document.bookings.some(
          (b: any) => b.booking.consultantId === session.consultantId
        );
        if (!isLinkedToConsultant) {
          return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول لهذا الملف' }, { status: 403 });
        }
      }

      // Record Audit Log for sensitive file access
      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'DOWNLOAD_SENSITIVE_FILE',
          entity: 'Document',
          entityId: document.id,
          newValue: JSON.stringify({ fileName: document.originalName, mimeType: document.mimeType }),
        },
      });
    } else {
      return NextResponse.json({ success: false, error: 'معرف الملف غير محدد' }, { status: 400 });
    }

    let fileBuffer: Buffer;
    if (document.filePath.startsWith('data:')) {
      const matches = document.filePath.match(/^data:(.+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : document.filePath.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = await fs.readFile(document.filePath);
    }

    const headers = new Headers();
    headers.set('Content-Type', document.mimeType);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.originalName)}"`
    );
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تنزيل الملف' },
      { status: 500 }
    );
  }
}

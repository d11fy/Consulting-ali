import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { notifyPaymentProofTelegram } from '@/lib/integrations/telegram/service';
import { sendAdminNotificationEmail } from '@/lib/integrations/email/service';

const ALLOWED_RECEIPT_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/gif',
  'application/pdf',
  'application/octet-stream',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            customer: true,
            service: true,
            consultant: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'سجل الدفع غير موجود' },
        { status: 404 }
      );
    }

    if (payment.booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'عذرًا، هذا الحجز ملغى ولا يمكن رفع إثبات دفع له.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const rawSenderName = formData.get('senderName') as string;
    const paymentMethodId = formData.get('paymentMethodId') as string;
    const amountStr = formData.get('amount') as string;
    const currency = (formData.get('currency') as string) || 'USD';
    const transactionNumber = (formData.get('transactionNumber') as string) || '';
    const paymentDateStr = formData.get('paymentDate') as string;
    const notes = (formData.get('notes') as string) || '';
    const receiptFile = formData.get('receipt') as File | null;

    const senderName = rawSenderName?.trim() || payment.booking.customer.fullName;

    if (!receiptFile) {
      return NextResponse.json(
        { success: false, error: 'يرجى إرفاق صورة الإشعار أو ملف PDF' },
        { status: 400 }
      );
    }

    // Flexible MIME type & Extension check
    const ext = path.extname(receiptFile.name).toLowerCase() || '.jpg';
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic', '.heif', '.bmp', '.gif'];
    const isAllowedExt = allowedExtensions.includes(ext);
    const isAllowedMime =
      receiptFile.type.startsWith('image/') ||
      receiptFile.type === 'application/pdf' ||
      ALLOWED_RECEIPT_MIMES.includes(receiptFile.type);

    if (!isAllowedExt && !isAllowedMime) {
      return NextResponse.json(
        { success: false, error: 'صيغة الإشعار غير مدعومة. يرجى رفع صورة (JPG, PNG, WebP) أو ملف PDF.' },
        { status: 400 }
      );
    }

    // Safely check if paymentMethodId exists in DB
    let validPaymentMethodId: string | null = null;
    if (paymentMethodId) {
      const pm = await prisma.paymentMethod.findFirst({
        where: {
          OR: [
            { id: paymentMethodId },
            { code: paymentMethodId },
          ],
        },
      });
      if (pm) {
        validPaymentMethodId = pm.id;
      }
    }

    // Read file bytes
    const bytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Primary Vercel-compatible storage format: Data URL (Base64)
    const mimeType = receiptFile.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    let targetFilePath = dataUrl;
    const safeName = `receipt_${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;

    // Try saving to disk (local environment or persistent servers)
    try {
      const receiptDir = path.join(process.cwd(), 'uploads', 'receipts');
      await fs.mkdir(receiptDir, { recursive: true });
      const diskPath = path.join(receiptDir, safeName);
      await fs.writeFile(diskPath, buffer);
      targetFilePath = diskPath;
    } catch {
      // Serverless (Vercel): Try /tmp directory as backup
      try {
        const tmpDir = path.join(os.tmpdir(), 'receipts');
        await fs.mkdir(tmpDir, { recursive: true });
        const tmpPath = path.join(tmpDir, safeName);
        await fs.writeFile(tmpPath, buffer);
      } catch {
        // Fallback remains dataUrl
      }
    }

    const paymentDate = paymentDateStr ? new Date(paymentDateStr) : new Date();
    const amount = amountStr ? parseFloat(amountStr) : payment.amount;

    // Sequential DB updates (avoiding interactive transaction timeout with remote Supabase pooler)
    // 1. Create Payment Proof
    const proof = await prisma.paymentProof.create({
      data: {
        paymentId: payment.id,
        senderName,
        amount,
        currency,
        transactionNumber: transactionNumber ? transactionNumber.trim() : null,
        paymentDate,
        receiptFilePath: targetFilePath,
        receiptFileName: receiptFile.name,
        fileMime: mimeType,
        fileSize: receiptFile.size,
        notes: notes || null,
        status: 'pending',
      },
    });

    // 2. Update Payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.uploaded,
        ...(validPaymentMethodId && { paymentMethodId: validPaymentMethodId }),
      },
    });

    // 3. Update Booking Status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.payment_uploaded,
      },
    });

    // 4. Record Booking Status History
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        fromStatus: payment.booking.status,
        toStatus: BookingStatus.payment_uploaded,
        changedBy: senderName,
        note: `تم رفع إثبات الدفع بواسطة ${senderName} بقيمة ${amount} ${currency}`,
      },
    });

    // Direct Notifications to Admin (In-app, Telegram, Email)
    try {
      await prisma.notification.create({
        data: {
          recipientType: 'admin',
          title: 'إشعار دفع جديد بانتظار المراجعة',
          message: `رفع العميل ${senderName} إشعار تحويل بقيمة ${amount} ${currency} للحجز رقم ${payment.booking.bookingReference}.`,
          type: 'payment_uploaded',
          linkUrl: `/admin/bookings/${payment.bookingId}`,
        },
      });

      // Direct Telegram notification
      try {
        await notifyPaymentProofTelegram({
          id: payment.bookingId,
          reference: payment.booking.bookingReference,
          customerName: payment.booking.customer.fullName,
          senderName,
          amount,
          currency,
          transactionNumber: transactionNumber || undefined,
        });
      } catch (tgErr) {
        console.error('Failed to send telegram notification for payment proof:', tgErr);
      }

      // Direct Admin Email notification
      try {
        await sendAdminNotificationEmail({
          subject: `💳 إشعار دفع جديد بانتظار المراجعة والاعتماد [${payment.booking.bookingReference}]`,
          title: `تم رفع إشعار تحويل جديد بانتظار مراجعة الإدارة واعتماده`,
          detailsHtml: `
            <p><strong>الرقم المرجعي:</strong> <code>${payment.booking.bookingReference}</code></p>
            <p><strong>العميل:</strong> ${payment.booking.customer.fullName} (${payment.booking.customer.email})</p>
            <p><strong>اسم المحول:</strong> ${senderName}</p>
            <p><strong>المبلغ المحول:</strong> ${amount} ${currency}</p>
            ${transactionNumber ? `<p><strong>رقم الحوالة:</strong> <code>${transactionNumber}</code></p>` : ''}
            ${notes ? `<p><strong>ملاحظات العميل:</strong> ${notes}</p>` : ''}
          `,
          actionUrl: `/admin/bookings/${payment.bookingId}`,
          actionText: 'مراجعة إشعار الدفع واعتماده الآن',
        });
      } catch (mailErr) {
        console.error('Failed to send admin email notification for payment proof:', mailErr);
      }
    } catch (err) {
      console.error('Failed to process notifications on payment proof:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفع إشعار الدفع بنجاح وهو قيد المراجعة والتحقق.',
      proofId: proof.id,
    });
  } catch (error: any) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ أثناء حفظ إثبات الدفع' },
      { status: 500 }
    );
  }
}

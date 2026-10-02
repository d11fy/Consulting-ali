import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

const ALLOWED_RECEIPT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
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
    const senderName = formData.get('senderName') as string;
    const paymentMethodId = formData.get('paymentMethodId') as string;
    const amountStr = formData.get('amount') as string;
    const currency = (formData.get('currency') as string) || 'USD';
    const transactionNumber = (formData.get('transactionNumber') as string) || '';
    const paymentDateStr = formData.get('paymentDate') as string;
    const notes = (formData.get('notes') as string) || '';
    const receiptFile = formData.get('receipt') as File | null;

    if (!senderName || !paymentMethodId || !receiptFile) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم المحول، واختيار طريقة الدفع، وإرفاق صورة الإشعار' },
        { status: 400 }
      );
    }

    if (!ALLOWED_RECEIPT_MIMES.includes(receiptFile.type)) {
      return NextResponse.json(
        { success: false, error: 'صيغة الإشعار غير مدعومة. يرجى رفع صورة (JPG, PNG) أو ملف PDF.' },
        { status: 400 }
      );
    }

    // Save receipt file securely
    const bytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(receiptFile.name) || '.jpg';
    const safeName = `receipt_${crypto.randomBytes(16).toString('hex')}${ext}`;

    const receiptDir = path.join(process.cwd(), 'uploads', 'receipts');
    await fs.mkdir(receiptDir, { recursive: true });

    const targetPath = path.join(receiptDir, safeName);
    await fs.writeFile(targetPath, buffer);

    const paymentDate = paymentDateStr ? new Date(paymentDateStr) : new Date();
    const amount = amountStr ? parseFloat(amountStr) : payment.amount;

    // Transactional DB update
    const updatedData = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Proof
      const proof = await tx.paymentProof.create({
        data: {
          paymentId: payment.id,
          senderName: senderName.trim(),
          amount,
          currency,
          transactionNumber: transactionNumber ? transactionNumber.trim() : null,
          paymentDate,
          receiptFilePath: targetPath,
          receiptFileName: receiptFile.name,
          fileMime: receiptFile.type,
          fileSize: receiptFile.size,
          notes: notes || null,
          status: 'pending',
        },
      });

      // 2. Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.uploaded,
          paymentMethodId,
        },
      });

      // 3. Update Booking Status
      // Rule: Once payment proof is uploaded, slot is locked and not auto-released until admin decides.
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.payment_uploaded,
        },
      });

      // 4. Record Booking Status History
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: payment.bookingId,
          fromStatus: payment.booking.status,
          toStatus: BookingStatus.payment_uploaded,
          changedBy: senderName,
          note: `تم رفع إثبات الدفع بواسطة ${senderName} بقيمة ${amount} ${currency}`,
        },
      });

      return proof;
    });

    // Queue Telegram notification to admins
    try {
      await prisma.jobQueue.create({
        data: {
          type: 'TELEGRAM_NOTIFY',
          payload: JSON.stringify({
            event: 'PAYMENT_PROOF_UPLOADED',
            bookingId: payment.bookingId,
            reference: payment.booking.bookingReference,
            customerName: payment.booking.customer.fullName,
            senderName,
            amount,
            currency,
            transactionNumber,
          }),
        },
      });

      // In-app admin notification
      await prisma.notification.create({
        data: {
          recipientType: 'admin',
          title: 'إشعار دفع جديد بانتظار المراجعة',
          message: `رفع العميل ${senderName} إشعار تحويل بقيمة ${amount} ${currency} للحجز رقم ${payment.booking.bookingReference}.`,
          type: 'payment_uploaded',
          linkUrl: `/admin/bookings/${payment.bookingId}`,
        },
      });
    } catch (err) {
      console.error('Failed to queue notifications on payment proof:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفع إشعار الدفع بنجاح وهو قيد المراجعة والتحقق.',
      proofId: updatedData.id,
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ إثبات الدفع' },
      { status: 500 }
    );
  }
}

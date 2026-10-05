import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role, BookingStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        consultant: { include: { user: true } },
        payment: {
          include: {
            paymentMethod: true,
            proofs: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'غير مصرح' }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;
    const body = await req.json();

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, payment: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    const {
      status,
      slotStartTime,
      slotEndTime,
      meetingLink,
      consultantId,
      serviceId,
      caseDescription,
      cancellationReason,
      customerName,
      customerEmail,
      customerPhone,
      customerCountry,
    } = body;

    // Update customer details if provided
    if (existingBooking.customerId && (customerName || customerEmail || customerPhone || customerCountry)) {
      await prisma.customer.update({
        where: { id: existingBooking.customerId },
        data: {
          ...(customerName && { fullName: customerName.trim() }),
          ...(customerEmail && { email: customerEmail.trim().toLowerCase() }),
          ...(customerPhone && { whatsappPhone: customerPhone.trim() }),
          ...(customerCountry && { country: customerCountry.trim() }),
        },
      });
    }

    // Status change handling
    const isStatusChanged = status && status !== existingBooking.status;
    const newStatus = status as BookingStatus;

    if (isStatusChanged) {
      await prisma.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: existingBooking.status,
          toStatus: newStatus,
          changedBy: session.name || session.email,
          note: `تعديل يدوي من لوحة تحكم الإدارة`,
        },
      });
    }

    const updateData: any = {};

    if (isStatusChanged) {
      updateData.status = newStatus;
      if (newStatus === 'cancelled') {
        updateData.cancelledAt = new Date();
        if (cancellationReason) {
          updateData.cancellationReason = cancellationReason.trim();
        }
      } else if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (slotStartTime) {
      const parsedStart = new Date(slotStartTime);
      if (!isNaN(parsedStart.getTime())) {
        updateData.slotStartTime = parsedStart;
      }
    }

    if (slotEndTime) {
      const parsedEnd = new Date(slotEndTime);
      if (!isNaN(parsedEnd.getTime())) {
        updateData.slotEndTime = parsedEnd;
      }
    }

    if (meetingLink !== undefined) {
      updateData.meetingLink = meetingLink ? meetingLink.trim() : null;
    }

    if (consultantId !== undefined) {
      updateData.consultantId = consultantId || null;
    }

    if (serviceId) {
      updateData.serviceId = serviceId;
    }

    if (caseDescription !== undefined) {
      updateData.caseDescription = caseDescription ? caseDescription.trim() : null;
    }

    if (cancellationReason !== undefined && !updateData.cancellationReason) {
      updateData.cancellationReason = cancellationReason ? cancellationReason.trim() : null;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        service: true,
        consultant: { include: { user: true } },
        payment: {
          include: {
            paymentMethod: true,
            proofs: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPDATE_BOOKING_DETAILS',
        entity: 'Booking',
        entityId: id,
        oldValue: JSON.stringify(existingBooking),
        newValue: JSON.stringify(updatedBooking),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كافة بيانات الحجز بنجاح.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ أثناء تعديل الحجز',
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: { include: { proofs: true } } },
    });

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    // Delete associated payment proofs and payment if exist
    if (existingBooking.payment) {
      await prisma.paymentProof.deleteMany({
        where: { paymentId: existingBooking.payment.id },
      });
      await prisma.payment.delete({
        where: { id: existingBooking.payment.id },
      });
    }

    // Delete the booking itself (cascades notes, history, docs)
    await prisma.booking.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'DELETE_BOOKING',
        entity: 'Booking',
        entityId: id,
        oldValue: JSON.stringify(existingBooking),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الحجز وكافة البيانات المتعلقة به بنجاح.',
    });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ أثناء حذف الحجز',
    }, { status: 500 });
  }
}

import prisma from '@/lib/db/prisma';
import { addMinutes, format, isAfter, isBefore, parse, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface AvailableSlot {
  startTimeUtc: string; // ISO string in UTC
  endTimeUtc: string;   // ISO string in UTC
  localStartTime: string; // HH:mm format in requested timezone
  localEndTime: string;   // HH:mm format in requested timezone
}

export async function getConsultantAvailableSlots(
  consultantId: string,
  serviceId: string,
  dateStr: string, // YYYY-MM-DD
  clientTimezone: string = 'Asia/Gaza'
): Promise<AvailableSlot[]> {
  // 1. Get Service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, isActive: true },
  });

  if (!service || !service.isActive) {
    return [];
  }

  const duration = service.durationMinutes;

  // 2. Get Consultant
  const consultant = await prisma.consultant.findUnique({
    where: { id: consultantId },
    include: {
      availabilityRules: {
        where: { isActive: true },
      },
    },
  });

  if (!consultant || !consultant.isActive) {
    return [];
  }

  // Determine Day of week in consultant's local time or target date
  // Parse target date (YYYY-MM-DD)
  const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Find availability rule for this day
  const rule = consultant.availabilityRules.find((r) => r.dayOfWeek === dayOfWeek);
  if (!rule) {
    return []; // Consultant doesn't work on this day
  }

  // Consultant working hours in consultant's timezone (e.g. "Asia/Gaza")
  const consultantTz = consultant.timezone || 'Asia/Gaza';

  // Construct start and end dates in consultant's timezone
  const workStartLocalStr = `${dateStr} ${rule.startTime}:00`;
  const workEndLocalStr = `${dateStr} ${rule.endTime}:00`;

  const workStartUtc = fromZonedTime(workStartLocalStr, consultantTz);
  const workEndUtc = fromZonedTime(workEndLocalStr, consultantTz);

  // Break time
  let breakStartUtc: Date | null = null;
  let breakEndUtc: Date | null = null;
  if (rule.breakStartTime && rule.breakEndTime) {
    breakStartUtc = fromZonedTime(`${dateStr} ${rule.breakStartTime}:00`, consultantTz);
    breakEndUtc = fromZonedTime(`${dateStr} ${rule.breakEndTime}:00`, consultantTz);
  }

  // 3. Fetch Blocked Slots in this date range
  const dayStartUtc = startOfDay(workStartUtc);
  const dayEndUtc = endOfDay(workEndUtc);

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      consultantId,
      startDateTime: { lte: dayEndUtc },
      endDateTime: { gte: dayStartUtc },
    },
  });

  // 4. Fetch Existing Bookings
  // Exclude cancelled and refunded bookings.
  // For pending_payment or draft bookings: only block if slotExpiresAt is in the future!
  const now = new Date();
  const existingBookings = await prisma.booking.findMany({
    where: {
      consultantId,
      status: {
        notIn: ['cancelled', 'refunded'],
      },
      slotStartTime: { lte: dayEndUtc },
      slotEndTime: { gte: dayStartUtc },
      OR: [
        // Confirmed, scheduled, payment under review, payment uploaded, completed
        {
          status: {
            in: ['confirmed', 'scheduled', 'payment_uploaded', 'payment_under_review', 'completed'],
          },
        },
        // Pending payment or draft: only lock if not expired
        {
          status: { in: ['pending_payment', 'draft'] },
          slotExpiresAt: { gt: now },
        },
      ],
    },
    select: {
      slotStartTime: true,
      slotEndTime: true,
    },
  });

  // 5. Generate candidate slots
  const availableSlots: AvailableSlot[] = [];
  let currentSlotStart = new Date(workStartUtc);

  while (true) {
    const currentSlotEnd = addMinutes(currentSlotStart, duration);

    // If slot exceeds working hours, stop
    if (isAfter(currentSlotEnd, workEndUtc)) {
      break;
    }

    // Must be in the future (at least 2 hours notice)
    const minAdvanceNotice = addMinutes(now, 120);
    const isInPast = isBefore(currentSlotStart, minAdvanceNotice);

    // Check overlap with break time
    let inBreak = false;
    if (breakStartUtc && breakEndUtc) {
      if (
        (isBefore(currentSlotStart, breakEndUtc) && isAfter(currentSlotEnd, breakStartUtc))
      ) {
        inBreak = true;
      }
    }

    // Check overlap with BlockedSlots
    let isBlocked = false;
    for (const b of blockedSlots) {
      if (
        isBefore(currentSlotStart, b.endDateTime) &&
        isAfter(currentSlotEnd, b.startDateTime)
      ) {
        isBlocked = true;
        break;
      }
    }

    // Check overlap with existing bookings
    let isBooked = false;
    for (const b of existingBookings) {
      if (
        isBefore(currentSlotStart, b.slotEndTime) &&
        isAfter(currentSlotEnd, b.slotStartTime)
      ) {
        isBooked = true;
        break;
      }
    }

    // If valid, add to available slots
    if (!isInPast && !inBreak && !isBlocked && !isBooked) {
      // Format in client's requested timezone
      const localStart = toZonedTime(currentSlotStart, clientTimezone);
      const localEnd = toZonedTime(currentSlotEnd, clientTimezone);

      availableSlots.push({
        startTimeUtc: currentSlotStart.toISOString(),
        endTimeUtc: currentSlotEnd.toISOString(),
        localStartTime: format(localStart, 'HH:mm'),
        localEndTime: format(localEnd, 'HH:mm'),
      });
    }

    // Advance by slot duration (or 30 mins interval for flexible scheduling)
    currentSlotStart = addMinutes(currentSlotStart, duration >= 30 ? 30 : 15);
  }

  return availableSlots;
}

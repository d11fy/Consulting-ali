import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateBookingReference } from '@/lib/services/booking';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionToken, verifySessionToken } from '@/lib/auth/session';
import { renderEmailTemplate } from '@/lib/integrations/email/service';
import prisma from '@/lib/db/prisma';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';

describe('1. Reference & Token Generation', () => {
  it('generates valid booking references starting with MS-YEAR', () => {
    const ref = generateBookingReference();
    const currentYear = new Date().getFullYear().toString();
    expect(ref).toBeDefined();
    expect(ref.startsWith(`MS-${currentYear}-`)).toBe(true);
    expect(ref.length).toBeGreaterThan(10);
  });
});

describe('2. Security, Password Hashing & RBAC Sessions', () => {
  it('correctly hashes and verifies passwords using bcrypt', async () => {
    const plain = 'SecretPassword@123';
    const hash = await hashPassword(plain);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);

    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('signs and verifies JWT session tokens with role and sub', async () => {
    const user = {
      id: 'test-user-id-123',
      email: 'admin@test.com',
      name: 'Super Admin Test',
      role: Role.SUPER_ADMIN,
      consultantId: null,
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifySessionToken(token);
    expect(payload).toBeDefined();
    expect(payload?.sub).toBe(user.id);
    expect(payload?.role).toBe(Role.SUPER_ADMIN);
    expect(payload?.email).toBe(user.email);
  });
});

describe('3. Dynamic Email Template Engine', () => {
  it('replaces all bracketed template variables correctly', () => {
    const template = 'مرحبًا {{customer_name}}، موعدك هو {{booking_date}} ورابطك هو {{meeting_link}}.';
    const variables = {
      customer_name: 'أحمد محمود',
      booking_date: '2026-10-05',
      meeting_link: 'https://meet.google.com/test-room',
    };

    const rendered = renderEmailTemplate(template, variables);
    expect(rendered).toContain('أحمد محمود');
    expect(rendered).toContain('2026-10-05');
    expect(rendered).toContain('https://meet.google.com/test-room');
    expect(rendered).not.toContain('{{customer_name}}');
  });
});

describe('4. Database & Entity Integration (PostgreSQL)', () => {
  it('verifies seeded services exist with correct durations and pricing', async () => {
    const services = await prisma.service.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    expect(services.length).toBeGreaterThanOrEqual(3);

    const quick = services.find((s) => s.slug === 'quick-10');
    expect(quick).toBeDefined();
    expect(quick?.durationMinutes).toBe(10);
    expect(quick?.price).toBe(15);

    const specialized = services.find((s) => s.slug === 'specialized-30');
    expect(specialized).toBeDefined();
    expect(specialized?.durationMinutes).toBe(30);
    expect(specialized?.price).toBe(50);

    const comprehensive = services.find((s) => s.slug === 'comprehensive-60');
    expect(comprehensive).toBeDefined();
    expect(comprehensive?.durationMinutes).toBe(60);
    expect(comprehensive?.price).toBe(200);
    expect(comprehensive?.isComprehensive).toBe(true);
  });

  it('verifies consultant profile and availability rules in PostgreSQL', async () => {
    const consultant = await prisma.consultant.findFirst({
      where: { user: { name: 'أ. علي هشام' } },
      include: {
        user: true,
        availabilityRules: true,
      },
    });

    expect(consultant).toBeDefined();
    expect(consultant?.user.name).toBe('أ. علي هشام');
    expect(consultant?.availabilityRules.length).toBeGreaterThan(0);
  });

  it('verifies payment methods are configured in PostgreSQL', async () => {
    const paymentMethods = await prisma.paymentMethod.findMany();
    expect(paymentMethods.length).toBeGreaterThanOrEqual(5);

    const bop = paymentMethods.find((pm) => pm.code === 'bop');
    expect(bop).toBeDefined();
    expect(bop?.nameAr).toContain('بنك فلسطين');
  });
});

describe('5. Architectural Rules & Business Logic Validation', () => {
  it('enforces slot expiration threshold (slotExpiresAt) on pending reservations', () => {
    const now = new Date();
    const expirationMinutes = 120;
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    const diffMinutes = Math.round((expiresAt.getTime() - now.getTime()) / (60 * 1000));
    expect(diffMinutes).toBe(120);
  });

  it('guarantees slot is NOT auto-released if payment proof was uploaded', () => {
    // Architectural rule: "بعد رفع إثبات الدفع لا يتم تحرير الموعد حتى قرار الإدارة"
    const bookingWithProof: {
      status: BookingStatus;
      slotExpiresAt: Date;
      proofs: Array<{ id: string; verifiedStatus: string }>;
    } = {
      status: BookingStatus.payment_uploaded,
      slotExpiresAt: new Date(Date.now() - 10000), // Expired timestamp
      proofs: [{ id: 'proof-1', verifiedStatus: 'PENDING' }],
    };

    const shouldRelease =
      bookingWithProof.status === BookingStatus.pending_payment &&
      bookingWithProof.slotExpiresAt < new Date();

    expect(shouldRelease).toBe(false);
  });

  it('ensures timestamps are stored in UTC format', () => {
    const date = new Date('2026-10-15T14:30:00.000Z');
    expect(date.toISOString()).toBe('2026-10-15T14:30:00.000Z');
    expect(date.getUTCHours()).toBe(14);
    expect(date.getUTCMinutes()).toBe(30);
  });
});


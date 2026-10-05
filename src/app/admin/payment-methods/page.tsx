import React from 'react';
import prisma from '@/lib/db/prisma';
import { PaymentMethodsManager } from '@/components/admin/PaymentMethodsManager';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentMethodsPage() {
  const paymentMethods = await prisma.paymentMethod.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      payments: {
        select: { id: true },
      },
    },
  });

  return <PaymentMethodsManager initialPaymentMethods={paymentMethods as any} />;
}

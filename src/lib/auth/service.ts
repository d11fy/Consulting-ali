import prisma from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie, clearSessionCookie, getCurrentSession, SessionUser } from '@/lib/auth/session';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: SessionUser;
  token?: string;
  redirectTo?: string;
}

export async function loginUser(
  email: string,
  password: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<LoginResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        consultantProfile: {
          select: { id: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return {
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير مفعل.',
      };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      consultantId: user.consultantProfile?.id || null,
    };

    const token = await setSessionCookie(sessionUser);

    // Record Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log on login:', err);
    }

    const redirectTo =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? '/admin' : '/consultant';

    return {
      success: true,
      user: sessionUser,
      token,
      redirectTo,
    };
  } catch (error: any) {
    console.error('Error in loginUser:', error);
    return {
      success: false,
      error: error?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.',
    };
  }
}

export async function logoutUser(metadata?: { ipAddress?: string; userAgent?: string }): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'USER_LOGOUT',
          entity: 'User',
          entityId: session.id,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log on logout:', err);
    }
  }
  await clearSessionCookie();
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم تحديد أي صورة' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. يرجى رفع صورة من نوع JPG أو PNG أو WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة يتجاوز الحد المسموح (5 ميغابايت).' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let ext = path.extname(file.name).toLowerCase();
    if (!ext || ext === '.') {
      if (file.type === 'image/jpeg') ext = '.jpg';
      else if (file.type === 'image/png') ext = '.png';
      else if (file.type === 'image/webp') ext = '.webp';
      else ext = '.png';
    }

    const mimeType = file.type || 'image/png';
    const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;
    let publicUrl = base64Url;

    try {
      const safeBaseName = crypto.randomBytes(12).toString('hex');
      const fileName = `consultant_${Date.now()}_${safeBaseName}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'consultants');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/consultants/${fileName}`;
    } catch {
      // Fallback to data URL on read-only serverless platforms like Vercel
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'تم رفع الصورة بنجاح',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Consultant image upload error:', err);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء رفع الصورة' }, { status: 500 });
  }
}

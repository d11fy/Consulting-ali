import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'other';

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم تحديد أي ملف' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'حجم الملف يتجاوز الحد المسموح به (15 ميغابايت)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. يرجى رفع ملفات PDF أو صور أو مستندات Word.' },
        { status: 400 }
      );
    }

    // Generate random secure filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    const ext = path.extname(file.name) || '.bin';
    const safeBaseName = crypto.randomBytes(16).toString('hex');
    const storedFileName = `${safeBaseName}${ext}`;

    // Target directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });

    const targetFilePath = path.join(uploadDir, storedFileName);
    await fs.writeFile(targetFilePath, buffer);

    // Save Document in DB
    const doc = await prisma.document.create({
      data: {
        originalName: file.name,
        storedFileName,
        filePath: targetFilePath,
        mimeType: file.type,
        sizeBytes: file.size,
        hash,
        category,
        isConfidential: true,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        originalName: doc.originalName,
        sizeBytes: doc.sizeBytes,
        mimeType: doc.mimeType,
        category: doc.category,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء رفع الملف' },
      { status: 500 }
    );
  }
}

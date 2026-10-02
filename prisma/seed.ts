import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Password hash
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const consultantPasswordHash = await bcrypt.hash('Consultant@123456', salt);

  // 2. Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@alihisham.com' },
    update: {},
    create: {
      email: 'admin@alihisham.com',
      passwordHash: adminPasswordHash,
      name: 'مدير المنصة العام',
      role: Role.SUPER_ADMIN,
      phone: '+970599000000',
    },
  });
  console.log('✅ Admin user created/verified:', adminUser.email);

  // 3. Consultant User & Profile: د. علاء الدين الزطمة
  const consultantUser1 = await prisma.user.upsert({
    where: { email: 'alaa@alihisham.com' },
    update: {
      name: 'د. علاء الدين الزطمة',
    },
    create: {
      email: 'alaa@alihisham.com',
      passwordHash: consultantPasswordHash,
      name: 'د. علاء الدين الزطمة',
      role: Role.CONSULTANT,
      phone: '+970599222333',
    },
  });

  const consultantProfile1 = await prisma.consultant.upsert({
    where: { userId: consultantUser1.id },
    update: {
      slug: 'alaa-alzatma',
      initials: 'دع',
      title: 'مستشار المنح والقبولات واختبارات اللغة',
      shortBio: 'محاضر جامعي ومترجم معتمد بخبرة تزيد عن 10 سنوات، ساعد أكثر من 30 طالبًا في الحصول على منح وقبولات جامعية، ويرافق الطالب من اختيار الجامعة والبرنامج إلى التحضير للمقابلة واختبارات IELTS وTOEFL ودولينجو.',
      bio: 'محاضر جامعي ومترجم معتمد بخبرة تزيد عن 10 سنوات، درّس في ثلاث جامعات في غزة ويعمل مع وكالة الأونروا. ساعد أكثر من 30 طالبًا في الحصول على منح وقبولات جامعية، ويرافق الطالب من اختيار الجامعة والبرنامج إلى التحضير للمقابلة واختبارات IELTS وTOEFL ودولينجو. حاصل على شهادتي CELTA وDELTA من جامعة كامبريدج، وماجستير في اللغويات التطبيقية والترجمة، وعلى IELTS 7.5 وTOEFL 101. حصل خلال دراسته على منحة تفوق، وقبول في برنامج تبادل من جامعة غلاسكو البريطانية، وعرض تبادل من جامعة غرناطة الإسبانية.',
      tags: ['المنح الدراسية', 'القبولات الجامعية', 'التحضير لـ IELTS وTOEFL', 'التحضير لاختبار دولينجو', 'التحضير للمقابلات'],
      languages: ['العربية', 'الإنجليزية'],
      yearsOfExperience: 10,
      hourlyRate: 50.0,
      timezone: 'Asia/Gaza',
      isActive: true,
      isAutoAssignEligible: true,
    },
    create: {
      userId: consultantUser1.id,
      slug: 'alaa-alzatma',
      initials: 'دع',
      title: 'مستشار المنح والقبولات واختبارات اللغة',
      shortBio: 'محاضر جامعي ومترجم معتمد بخبرة تزيد عن 10 سنوات، ساعد أكثر من 30 طالبًا في الحصول على منح وقبولات جامعية، ويرافق الطالب من اختيار الجامعة والبرنامج إلى التحضير للمقابلة واختبارات IELTS وTOEFL ودولينجو.',
      bio: 'محاضر جامعي ومترجم معتمد بخبرة تزيد عن 10 سنوات، درّس في ثلاث جامعات في غزة ويعمل مع وكالة الأونروا. ساعد أكثر من 30 طالبًا في الحصول على منح وقبولات جامعية، ويرافق الطالب من اختيار الجامعة والبرنامج إلى التحضير للمقابلة واختبارات IELTS وTOEFL ودولينجو. حاصل على شهادتي CELTA وDELTA من جامعة كامبريدج، وماجستير في اللغويات التطبيقية والترجمة، وعلى IELTS 7.5 وTOEFL 101. حصل خلال دراسته على منحة تفوق، وقبول في برنامج تبادل من جامعة غلاسكو البريطانية، وعرض تبادل من جامعة غرناطة الإسبانية.',
      tags: ['المنح الدراسية', 'القبولات الجامعية', 'التحضير لـ IELTS وTOEFL', 'التحضير لاختبار دولينجو', 'التحضير للمقابلات'],
      languages: ['العربية', 'الإنجليزية'],
      yearsOfExperience: 10,
      hourlyRate: 50.0,
      timezone: 'Asia/Gaza',
      isActive: true,
      isAutoAssignEligible: true,
    },
  });

  // Consultant User & Profile: أ. علي هشام
  const consultantUser2 = await prisma.user.upsert({
    where: { email: 'ali@alihisham.com' },
    update: {
      name: 'أ. علي هشام',
    },
    create: {
      email: 'ali@alihisham.com',
      passwordHash: consultantPasswordHash,
      name: 'أ. علي هشام',
      role: Role.CONSULTANT,
      phone: '+970599123456',
    },
  });

  const consultantProfile2 = await prisma.consultant.upsert({
    where: { userId: consultantUser2.id },
    update: {
      slug: 'ali-hisham',
      initials: 'عه',
      title: 'مستشار المنح والقبولات والمعاملات الدولية',
      shortBio: 'يساعد الطلاب في الوصول إلى منح وقبولات جامعية حول العالم، ويتابع معهم الملف خطوة بخطوة من اختيار الجامعة والتقديم، إلى تجهيز الوثائق وترجمتها وتصديقها ومتابعة إجراءات السفارة.',
      bio: 'يساعد الطلاب في الوصول إلى منح وقبولات جامعية مناسبة لهم حول العالم، ويتابع معهم الملف خطوة بخطوة: من اختيار الجامعة والبرنامج والتقديم، إلى مراجعة الوثائق والتواصل مع الجامعات. كما يقدّم خدمات مساندة للملف تشمل استخراج الوثائق الرسمية وتصديقها من الجهات المختصة، والترجمة المعتمدة للشهادات والوثائق، ومتابعة إجراءات معادلة الشهادات، وتنظيم أوراق السفارات ومتابعة طلبات التأشيرة والمعاملات القنصلية. الهدف أن يقدّم الطالب ملفًا مرتبًا وكاملًا دون أن يخسر فرصة بسبب خطأ بسيط.',
      tags: ['المنح الدراسية', 'القبولات الجامعية', 'معاملات السفارات', 'استخراج وتصديق الوثائق', 'الترجمة المعتمدة', 'معادلة الشهادات'],
      languages: ['العربية', 'الإنجليزية'],
      yearsOfExperience: 2,
      hourlyRate: 50.0,
      timezone: 'Asia/Gaza',
      isActive: true,
      isAutoAssignEligible: true,
    },
    create: {
      userId: consultantUser2.id,
      slug: 'ali-hisham',
      initials: 'عه',
      title: 'مستشار المنح والقبولات والمعاملات الدولية',
      shortBio: 'يساعد الطلاب في الوصول إلى منح وقبولات جامعية حول العالم، ويتابع معهم الملف خطوة بخطوة من اختيار الجامعة والتقديم، إلى تجهيز الوثائق وترجمتها وتصديقها ومتابعة إجراءات السفارة.',
      bio: 'يساعد الطلاب في الوصول إلى منح وقبولات جامعية مناسبة لهم حول العالم، ويتابع معهم الملف خطوة بخطوة: من اختيار الجامعة والبرنامج والتقديم، إلى مراجعة الوثائق والتواصل مع الجامعات. كما يقدّم خدمات مساندة للملف تشمل استخراج الوثائق الرسمية وتصديقها من الجهات المختصة، والترجمة المعتمدة للشهادات والوثائق، ومتابعة إجراءات معادلة الشهادات، وتنظيم أوراق السفارات ومتابعة طلبات التأشيرة والمعاملات القنصلية. الهدف أن يقدّم الطالب ملفًا مرتبًا وكاملًا دون أن يخسر فرصة بسبب خطأ بسيط.',
      tags: ['المنح الدراسية', 'القبولات الجامعية', 'معاملات السفارات', 'استخراج وتصديق الوثائق', 'الترجمة المعتمدة', 'معادلة الشهادات'],
      languages: ['العربية', 'الإنجليزية'],
      yearsOfExperience: 2,
      hourlyRate: 50.0,
      timezone: 'Asia/Gaza',
      isActive: true,
      isAutoAssignEligible: true,
    },
  });

  const consultantProfile = consultantProfile2;
  console.log('✅ Consultant profiles created/verified:', consultantProfile1.title, consultantProfile2.title);

  // 4. Specialties
  const specialtiesData = [
    {
      slug: 'education',
      nameAr: 'التعليم والقبولات',
      nameEn: 'Education & Admissions',
      description: 'القبولات الجامعية، اختيار التخصص، اختيار الجامعة، الدراسة بالخارج، المنح، وتجهيز الملف الأكاديمي المتكامل.',
      icon: 'GraduationCap',
      orderIndex: 1,
    },
    {
      slug: 'immigration',
      nameAr: 'الهجرة والمسارات القانونية',
      nameEn: 'Immigration & Pathways',
      description: 'دراسة مسارات الهجرة النظامية، فهم الإجراءات والمتطلبات، مراجعة الوثائق، وتوجيه متخصص حسب الدولة والحالة.',
      icon: 'Compass',
      orderIndex: 2,
    },
    {
      slug: 'family-reunification',
      nameAr: 'لمّ الشمل العائلي',
      nameEn: 'Family Reunification',
      description: 'دراسة الحالة العائلية الخاصة، تدقيق الوثائق الثبوتية، فهم الشروط القانونية، وتحديد الخيارات الواقعية المتاحة.',
      icon: 'Users',
      orderIndex: 3,
    },
    {
      slug: 'visas-travel',
      nameAr: 'السفر والتأشيرات',
      nameEn: 'Travel & Visas',
      description: 'دراسة خيارات السفر، المتطلبات القنصلية، تجهيز ملف التأشيرة باحترافية، وتفادي أسباب الرفض المتكررة.',
      icon: 'Plane',
      orderIndex: 4,
    },
    {
      slug: 'documents-review',
      nameAr: 'الملفات ومراجعة الوثائق',
      nameEn: 'Documents & File Review',
      description: 'المراجعة الدقيقة لملفات التقديم، اكتشاف النواقص، ترتيب وتنسيق المستندات، والتأكد من مطابقتها للمعايير المطلوبة.',
      icon: 'FileCheck',
      orderIndex: 5,
    },
    {
      slug: 'international-opportunities',
      nameAr: 'الفرص الدولية والإنسانية',
      nameEn: 'International & Humanitarian Opportunities',
      description: 'البرامج الدولية، المبادرات العالمية، التبادل الثقافي، والمسارات الإنسانية المخصصة للفئات المؤهلة.',
      icon: 'Globe',
      orderIndex: 6,
    },
  ];

  for (const s of specialtiesData) {
    const specialty = await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: {
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        description: s.description,
        icon: s.icon,
        orderIndex: s.orderIndex,
      },
      create: s,
    });

    // Link with default consultant
    await prisma.consultantSpecialty.upsert({
      where: {
        consultantId_specialtyId: {
          consultantId: consultantProfile.id,
          specialtyId: specialty.id,
        },
      },
      update: {},
      create: {
        consultantId: consultantProfile.id,
        specialtyId: specialty.id,
      },
    });
  }
  console.log('✅ Specialties created and linked.');

  // 5. Services
  const servicesData = [
    {
      slug: 'quick-10',
      nameAr: 'الاستشارة السريعة',
      nameEn: 'Quick Consultation',
      descriptionAr: 'جلسة سريعة ومركزة مدتها 10 دقائق، مناسبة لسؤال مباشر ومحدد واستيضاح خطوة عاجلة.',
      durationMinutes: 10,
      price: 15.0,
      currency: 'USD',
      isPopular: false,
      isComprehensive: false,
      orderIndex: 1,
      features: [
        'فهم السؤال المحدد مباشرة',
        'إجابة واضحة ومباشرة بدون تعقيد',
        'توضيح الخيارات الأساسية المتاحة',
        'تحديد الخطوة التالية الواجب اتخاذها',
      ],
    },
    {
      slug: 'specialized-30',
      nameAr: 'الاستشارة المتخصصة',
      nameEn: 'Specialized Consultation',
      descriptionAr: 'جلسة معمقة مدتها 30 دقيقة لدراسة حالتك بالتفصيل ومناقشة الخيارات العملية والمتطلبات.',
      durationMinutes: 30,
      price: 50.0,
      currency: 'USD',
      isPopular: true,
      isComprehensive: false,
      orderIndex: 2,
      features: [
        'دراسة متأنية لظروف الحالة',
        'مناقشة كافة الخيارات والبدائل الممكنة',
        'توضيح المتطلبات الإجرائية والمستندات',
        'كشف المشاكل والنواقص في الملف لتلافيها',
        'خطة عمل وخطوات تنفيذية محددة',
      ],
    },
    {
      slug: 'comprehensive-60',
      nameAr: 'الاستشارة الشاملة وخارطة الطريق',
      nameEn: 'Comprehensive Consultation & Personal Roadmap',
      descriptionAr: 'دراسة حالة كاملة + تحليل دقيق للخيارات + جلسة شخصية مباشرة 60 دقيقة + ملف خارطة طريق مخصص Personal Case Study & Roadmap.',
      durationMinutes: 60,
      price: 200.0,
      currency: 'USD',
      isPopular: false,
      isComprehensive: true,
      orderIndex: 3,
      features: [
        'قبل الجلسة: مراجعة كافة الوثائق والبيانات وتحليل الحالة ونقاط القوة والنواقص مسبقًا',
        'أثناء الجلسة: لقاء استشاري مباشر لمدة 60 دقيقة ومناقشة مفصلة',
        'بعد الجلسة: إعداد وتسليم ملف توثيقي مخصص Personal Case Study & Roadmap',
        'يتضمن الملف: ملخص الحالة، تحليل الفرص، المسارات الأنسب، أولويات العمل، وجدول زمني للتقديم',
        'رابط تنزيل آمن وخاص بالعميل',
      ],
    },
  ];

  for (const s of servicesData) {
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        descriptionAr: s.descriptionAr,
        durationMinutes: s.durationMinutes,
        price: s.price,
        isPopular: s.isPopular,
        isComprehensive: s.isComprehensive,
        features: s.features,
        orderIndex: s.orderIndex,
      },
      create: s,
    });

    // Link with default consultant
    await prisma.consultantService.upsert({
      where: {
        consultantId_serviceId: {
          consultantId: consultantProfile.id,
          serviceId: service.id,
        },
      },
      update: {},
      create: {
        consultantId: consultantProfile.id,
        serviceId: service.id,
      },
    });
  }
  console.log('✅ Services created and linked.');

  // 6. Availability Rules (Sunday to Thursday, 10:00 - 18:00, break 13:00 - 14:00)
  for (let day = 0; day <= 4; day++) {
    // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu
    await prisma.availabilityRule.upsert({
      where: {
        consultantId_dayOfWeek: {
          consultantId: consultantProfile.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        consultantId: consultantProfile.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        isActive: true,
      },
    });
  }
  console.log('✅ Availability rules created.');

  // 7. Payment Methods
  const paymentMethodsData = [
    {
      code: 'bop',
      nameAr: 'بنك فلسطين (Bank of Palestine)',
      nameEn: 'Bank of Palestine',
      instructionsAr: 'يمكنك التحويل المباشر لحسابنا عبر تطبيق بنكي أو الإيداع النقدي، مع إرفاق إشعار التحويل وصورة العملية.',
      accountDetails: {
        accountName: 'علي هشام محمد',
        accountNumber: '1234567',
        branch: 'فرع الرمال - غزة',
        iban: 'PS98PALS000000000000123456701',
        currency: 'USD / ILS',
      },
      orderIndex: 1,
    },
    {
      code: 'aib',
      nameAr: 'البنك الإسلامي الفلسطيني (Palestine Islamic Bank)',
      nameEn: 'Palestine Islamic Bank',
      instructionsAr: 'التحويل المالي المباشر عبر الحساب أو الخدمات الإلكترونية للبنك الإسلامي الفلسطيني.',
      accountDetails: {
        accountName: 'علي هشام محمد',
        accountNumber: '7654321',
        branch: 'فرع غزة الرئيسي',
        iban: 'PS12PIBC000000000000765432101',
      },
      orderIndex: 2,
    },
    {
      code: 'palpay',
      nameAr: 'محفظة PalPay الإلكترونية',
      nameEn: 'PalPay Wallet',
      instructionsAr: 'التحويل الفوري عبر تطبيق محفظة PalPay إلى رقم المحفظة المعتمد.',
      accountDetails: {
        walletNumber: '+970599123456',
        walletName: 'Ali Hisham Consultations',
      },
      orderIndex: 3,
    },
    {
      code: 'jawwal_pay',
      nameAr: 'محفظة جوال باي (Jawwal Pay)',
      nameEn: 'Jawwal Pay',
      instructionsAr: 'التحويل السريع عبر تطبيق جوال باي إلى رقم المحفظة.',
      accountDetails: {
        walletNumber: '0599123456',
        walletName: 'علي هشام',
      },
      orderIndex: 4,
    },
    {
      code: 'crypto',
      nameAr: 'العملات الرقمية (Crypto USDT - TRC20)',
      nameEn: 'Cryptocurrency (USDT TRC20)',
      instructionsAr: 'التحويل الفوري باستخدام عملة USDT عبر شبكة Tron (TRC-20) فقط. يرجى التأكد من اختيار الشبكة الصحيحة قبل الإرسال.',
      accountDetails: {
        network: 'Tron (TRC20)',
        walletAddress: 'TYDzsxdkjB58DsdmAkp90sKJLmzX9876543',
        token: 'USDT',
      },
      orderIndex: 5,
    },
    {
      code: 'cash_gaza',
      nameAr: 'الدفع نقداً داخل قطاع غزة (Cash)',
      nameEn: 'Cash inside Gaza',
      instructionsAr: 'تسليم المبلغ نقدًا عبر منسقنا في غزة بالتنسيق المسبق مع خدمة العملاء.',
      accountDetails: {
        location: 'غزة - بالتنسيق المباشر عبر واتساب',
        contactPhone: '+970599123456',
      },
      orderIndex: 6,
    },
    {
      code: 'international',
      nameAr: 'حوالات دولية (Western Union / MoneyGram / Wire)',
      nameEn: 'International Transfer',
      instructionsAr: 'للعملاء من خارج فلسطين: يمكن إرسال المبلغ عبر ويسترن يونيون أو موني غرام أو تحويل بنكي دولي.',
      accountDetails: {
        receiverName: 'Ali Hisham',
        city: 'Gaza / Palestine',
        note: 'يرجى إرسال رقم الحوالة (MTCN) وصورة الإيصال مباشرة فور التحويل',
      },
      orderIndex: 7,
    },
  ];

  for (const pm of paymentMethodsData) {
    await prisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: {
        nameAr: pm.nameAr,
        nameEn: pm.nameEn,
        instructionsAr: pm.instructionsAr,
        accountDetails: pm.accountDetails,
        orderIndex: pm.orderIndex,
        isActive: true,
      },
      create: pm,
    });
  }
  console.log('✅ Payment methods created.');

  // 8. Initial FAQs
  const faqsData = [
    {
      questionAr: 'هل الاستشارة متاحة من خارج فلسطين؟',
      answerAr: 'نعم، الاستشارات أونلاين بالكامل عبر Google Meet، ومتاحة للطلاب من أي دولة. وبنوفر طرق دفع متعددة تشمل الحوالات الدولية والعملات الرقمية (USDT).',
      orderIndex: 1,
    },
    {
      questionAr: 'هل يجب أن أحجز مع أ. علي هشام بالتحديد؟',
      answerAr: 'لا، تقدر تختار المستشار الأنسب لموضوعك من المستشارين المتاحين على المنصة. إذا كان سؤالك عن المنح والقبولات الجامعية أو تجهيز ملف التقديم، فالحجز مع أ. علي هشام مناسب لهاي المواضيع.',
      orderIndex: 2,
    },
    {
      questionAr: 'هل يمكن إرسال الملفات والوثائق قبل الموعد؟',
      answerAr: 'نعم، وننصح فيها. بعد تأكيد الحجز تقدر تبعت شهاداتك وسيرتك الذاتية وأي وثائق متعلقة بطلبك، عشان المستشار يراجعها قبل الجلسة ونستغل وقت الاستشارة بأفضل شكل.',
      orderIndex: 3,
    },
    {
      questionAr: 'هل الاستشارة تضمن الحصول على تأشيرة أو قبول أو منحة؟',
      answerAr: 'لا. الاستشارة بتساعدك تختار الفرص المناسبة وتجهز ملفك بشكل صحيح وتتجنب الأخطاء الشائعة، لكن قرار القبول أو المنحة بيرجع للجامعة أو الجهة المانحة، وقرار التأشيرة بيرجع للسفارة. أي جهة بتوعدك بضمان، انتبه منها.',
      orderIndex: 4,
    },
    {
      questionAr: 'هل يمكن إلغاء الموعد أو إعادة جدولته؟',
      answerAr: 'نعم، تقدر تلغي الموعد أو تغيّره قبل 24 ساعة على الأقل من وقته، ومن غير أي رسوم. إذا كان الإلغاء خلال آخر 24 ساعة أو ما حضرت الجلسة، ممكن ما ينسترد المبلغ.',
      orderIndex: 5,
    },
  ];

  for (const f of faqsData) {
    const existing = await prisma.fAQ.findFirst({
      where: { questionAr: f.questionAr },
    });
    if (existing) {
      await prisma.fAQ.update({
        where: { id: existing.id },
        data: {
          answerAr: f.answerAr,
          orderIndex: f.orderIndex,
          isActive: true,
        },
      });
    } else {
      await prisma.fAQ.create({
        data: f,
      });
    }
  }
  console.log('✅ FAQs created and updated.');

  // 9. Site Settings
  const settingsData = [
    { key: 'site_name', value: 'أ. علي هشام — استشارات متخصصة في التعليم والهجرة والفرص الدولية', category: 'brand' },
    { key: 'hero_title', value: 'عندك حالة ومش عارف من وين تبدأ؟', category: 'general' },
    { key: 'hero_subtitle', value: 'احجز استشارة مع المستشار المناسب لحالتك، وافهم خياراتك والخطوات التي تحتاجها بشكل واضح ومدروس.', category: 'general' },
    { key: 'whatsapp_number', value: '+970599123456', category: 'whatsapp' },
    { key: 'whatsapp_default_message', value: 'مرحبًا، أريد الاستفسار عن الاستشارة المناسبة لحالتي.', category: 'whatsapp' },
    { key: 'instagram_ali_hisham', value: 'https://instagram.com/ali_hisham', category: 'instagram' },
    { key: 'instagram_masarat_study', value: 'https://instagram.com/masarat_study', category: 'instagram' },
    { key: 'legal_disclaimer', value: 'الاستشارة خدمة توجيهية مبنية على المعلومات والوثائق التي يقدمها العميل، ولا تمثل ضمانًا للحصول على قبول أو تأشيرة أو منحة أو لمّ شمل أو موافقة من أي جهة. وفي الحالات التي تحتاج لاستشارة قانونية رسمية يتم توجيه العميل لمحامٍ أو مستشار مرخص حسب الدولة والاختصاص.', category: 'general' },
    { key: 'booking_expiration_minutes', value: '120', category: 'booking' }, // 2 hours to upload payment proof before slot is released
  ];

  for (const s of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: s,
    });
  }
  console.log('✅ Site settings created.');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

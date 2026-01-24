export interface LandingPageData {
  slug: string;
  // Hero
  heroTitle: string;
  heroTitleEn: string;
  // Problem
  problemTitle: string;
  problemTitleEn: string;
  problemDescription: string;
  problemDescriptionEn: string;
  // Solution
  solutionTitle: string;
  solutionTitleEn: string;
  solutionPoints: string[];
  solutionPointsEn: string[];
  // Example (Before/After)
  exampleBefore: string;
  exampleBeforeEn: string;
  exampleAfter: string;
  exampleAfterEn: string;
  // CTA
  ctaText: string;
  ctaTextEn: string;
  ctaSubtext: string;
  ctaSubtextEn: string;
}

export const landingPagesData: LandingPageData[] = [
  // Core Use Cases
  {
    slug: 'travel',
    heroTitle: 'كيف تقسم مصاريف السفر بدون إحراج؟',
    heroTitleEn: 'How to split travel expenses without awkwardness?',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'كل واحد دفع شي... وبالنهاية ما أحد يعرف مين عليه كم. وتصير خلافات بعد الرحلة.',
    problemDescriptionEn: 'Everyone paid something... and in the end, no one knows who owes what. Conflicts arise after the trip.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'سجّل أي مصروف لحظة ما يصير',
      'التطبيق يحسب تلقائي كل شخص عليه كم',
      'بالنهاية كل واحد يعرف رصيده بالضبط'
    ],
    solutionPointsEn: [
      'Record any expense the moment it happens',
      'The app automatically calculates what each person owes',
      'In the end, everyone knows their exact balance'
    ],
    exampleBefore: 'أحمد دفع الفندق، سعد دفع الأكل، خالد دفع المواصلات... من يحاسب من؟',
    exampleBeforeEn: 'Ahmed paid for the hotel, Saad paid for food, Khalid paid for transport... who pays who?',
    exampleAfter: 'Diviso يقول: أحمد له 450 ر.س، سعد عليه 200 ر.س، خالد عليه 250 ر.س',
    exampleAfterEn: 'Diviso says: Ahmed is owed 450 SAR, Saad owes 200 SAR, Khalid owes 250 SAR',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  {
    slug: 'friends',
    heroTitle: 'طلعة مع الأصدقاء؟ خلّ الحسبة علينا',
    heroTitleEn: 'Outing with friends? Let us handle the math',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'كل مرة نطلع، واحد يدفع أكثر والباقي ينسون. وتضيع الفلوس بين الطلعات.',
    problemDescriptionEn: 'Every time we go out, one person pays more and the rest forget. Money gets lost between outings.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'أنشئ قروب لأصدقائك مرة وحدة',
      'كل واحد يسجل اللي دفعه',
      'التطبيق يحسب الباقي'
    ],
    solutionPointsEn: [
      'Create a group for your friends once',
      'Everyone records what they paid',
      'The app calculates the rest'
    ],
    exampleBefore: 'محمد دايم يدفع للمطعم... وما يقدر يطلب فلوسه من الباقين',
    exampleBeforeEn: 'Mohammed always pays at restaurants... and can\'t ask for his money back',
    exampleAfter: 'الكل يشوف الأرقام بوضوح، ولا أحد يحتاج يطلب شي',
    exampleAfterEn: 'Everyone sees the numbers clearly, no one needs to ask for anything',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  {
    slug: 'shared-housing',
    heroTitle: 'سكن مشترك؟ خلّ الفواتير تنحسب لحالها',
    heroTitleEn: 'Shared housing? Let the bills calculate themselves',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'الكهرباء، الماء، الإنترنت، الإيجار... كل شهر نفس النقاش: من دفع ومن ما دفع؟',
    problemDescriptionEn: 'Electricity, water, internet, rent... every month the same discussion: who paid and who didn\'t?',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'سجّل كل فاتورة بمجرد دفعها',
      'التطبيق يقسمها على الجميع تلقائي',
      'كل واحد يعرف نصيبه بالضبط'
    ],
    solutionPointsEn: [
      'Record each bill as soon as it\'s paid',
      'The app splits it among everyone automatically',
      'Everyone knows their exact share'
    ],
    exampleBefore: 'فهد دفع الكهرباء 3 شهور متتالية... والباقين "بنحولها لك"',
    exampleBeforeEn: 'Fahad paid electricity for 3 months straight... and others say "we\'ll transfer it"',
    exampleAfter: 'كل شخص يشوف رصيده الشهري ويعرف متى يسدد',
    exampleAfterEn: 'Everyone sees their monthly balance and knows when to pay',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  // Behavioral Use Cases
  {
    slug: 'activities',
    heroTitle: 'تنظّم نشاط أو فعالية؟ خلّ المصاريف منظمة',
    heroTitleEn: 'Organizing an activity or event? Keep expenses organized',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'المخيمات، الفعاليات، الأنشطة الجماعية... كل واحد يصرف ولا أحد يعرف الإجمالي.',
    problemDescriptionEn: 'Camps, events, group activities... everyone spends and no one knows the total.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'سجّل مصاريف النشاط لحظياً',
      'شوف الإجمالي في أي وقت',
      'قسّم على المشاركين بعدالة'
    ],
    solutionPointsEn: [
      'Record activity expenses in real-time',
      'See the total at any time',
      'Split fairly among participants'
    ],
    exampleBefore: 'مخيم 20 شخص... ضاعت الفواتير وما أحد يعرف كم صرفنا',
    exampleBeforeEn: 'Camp with 20 people... receipts got lost and no one knows how much we spent',
    exampleAfter: 'كل المصاريف مسجلة، والتقسيم جاهز بضغطة زر',
    exampleAfterEn: 'All expenses recorded, and the split is ready with one click',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  {
    slug: 'groups',
    heroTitle: 'رحلة جماعية؟ خلّ كل واحد يعرف حسابه',
    heroTitleEn: 'Group trip? Let everyone know their account',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'القروبات الكبيرة فيها مصاريف كثيرة... وصعب تتبع من دفع إيش.',
    problemDescriptionEn: 'Large groups have many expenses... and it\'s hard to track who paid for what.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'قروب واحد لكل أعضاء الرحلة',
      'كل واحد يسجّل مصاريفه',
      'التقسيم العادل تلقائي'
    ],
    solutionPointsEn: [
      'One group for all trip members',
      'Everyone records their expenses',
      'Fair splitting is automatic'
    ],
    exampleBefore: 'رحلة 15 شخص... في النهاية كل واحد يقول "أنا دفعت أكثر"',
    exampleBeforeEn: 'Trip with 15 people... in the end everyone says "I paid more"',
    exampleAfter: 'الأرقام واضحة للجميع، لا مجال للجدل',
    exampleAfterEn: 'Numbers are clear for everyone, no room for debate',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  {
    slug: 'who-paid-more',
    heroTitle: 'مين دفع أكثر؟ Diviso يجاوبك',
    heroTitleEn: 'Who paid more? Diviso answers you',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'النقاش المتكرر: "أنا دافع أكثر!" - "لا أنا!" - بدون دليل واضح.',
    problemDescriptionEn: 'The recurring debate: "I paid more!" - "No, I did!" - without clear proof.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'كل مصروف مسجّل بالتاريخ والمبلغ',
      'تقرير واضح لكل شخص',
      'الأرقام تتكلم بدل الجدال'
    ],
    solutionPointsEn: [
      'Every expense recorded with date and amount',
      'Clear report for each person',
      'Numbers speak instead of arguments'
    ],
    exampleBefore: '"أنا دايم أدفع للأكل!" - "وأنا أدفع للبنزين!"',
    exampleBeforeEn: '"I always pay for food!" - "And I pay for gas!"',
    exampleAfter: 'التقرير يقول: سعيد دفع 2,340 ر.س، محمد دفع 1,890 ر.س',
    exampleAfterEn: 'Report says: Saeed paid 2,340 SAR, Mohammed paid 1,890 SAR',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  // Pain-Driven
  {
    slug: 'awkward-money',
    heroTitle: 'تحس بإحراج لما تطلب فلوسك؟',
    heroTitleEn: 'Feel awkward asking for your money back?',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'دفعت عن الكل... وما تقدر تطلب فلوسك لأنه موقف محرج. والباقين نسوا.',
    problemDescriptionEn: 'You paid for everyone... and can\'t ask for your money because it\'s awkward. Others forgot.',
    solutionTitle: 'الحل مع Diviso',
    solutionTitleEn: 'The Solution with Diviso',
    solutionPoints: [
      'التطبيق يُذكّر الجميع تلقائياً',
      'لا تحتاج تطلب من أحد',
      'كل شخص يشوف رصيده ويسدد'
    ],
    solutionPointsEn: [
      'The app reminds everyone automatically',
      'You don\'t need to ask anyone',
      'Everyone sees their balance and pays'
    ],
    exampleBefore: 'دفعت 500 ريال للعشاء... ومرت 3 أسابيع ولا أحد رجّع لي شي',
    exampleBeforeEn: 'Paid 500 SAR for dinner... 3 weeks passed and no one paid me back',
    exampleAfter: 'الكل يشوف إنه عليهم 100 ريال لك، ويسددون بدون ما تتكلم',
    exampleAfterEn: 'Everyone sees they owe you 100 SAR, and pays without you saying a word',
    ctaText: 'سجّل الآن',
    ctaTextEn: 'Sign Up Now',
    ctaSubtext: 'آمن ومجاني - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Safe and free - no credit card required'
  },
  // Educational
  {
    slug: 'how-it-works-lp',
    heroTitle: 'كيف يعمل Diviso؟ ببساطة شديدة',
    heroTitleEn: 'How does Diviso work? Very simply',
    problemTitle: 'المشكلة',
    problemTitleEn: 'The Problem',
    problemDescription: 'تقسيم المصاريف يدوياً يأخذ وقت، والحسابات تضيع، والخلافات تصير.',
    problemDescriptionEn: 'Splitting expenses manually takes time, calculations get lost, and conflicts happen.',
    solutionTitle: '3 خطوات فقط',
    solutionTitleEn: 'Just 3 Steps',
    solutionPoints: [
      'أنشئ قروب وأضف أصدقاءك',
      'سجّل أي مصروف بضغطة واحدة',
      'شوف من عليه كم - بالأرقام'
    ],
    solutionPointsEn: [
      'Create a group and add your friends',
      'Record any expense with one tap',
      'See who owes what - in numbers'
    ],
    exampleBefore: 'ورقة وقلم، واتساب، نوتة الجوال... كلها طرق قديمة وتضيع',
    exampleBeforeEn: 'Paper and pen, WhatsApp, phone notes... all old methods that get lost',
    exampleAfter: 'تطبيق واحد، كل شي مسجل، والحسابات تلقائية',
    exampleAfterEn: 'One app, everything recorded, and calculations are automatic',
    ctaText: 'جرّب الآن',
    ctaTextEn: 'Try Now',
    ctaSubtext: 'مجاني بالكامل - سجّل في 30 ثانية',
    ctaSubtextEn: 'Completely free - sign up in 30 seconds'
  },
  {
    slug: 'vs-notes-whatsapp',
    heroTitle: 'ليش Diviso أفضل من الواتساب والنوتة؟',
    heroTitleEn: 'Why is Diviso better than WhatsApp and notes?',
    problemTitle: 'الطرق القديمة',
    problemTitleEn: 'Old Methods',
    problemDescription: 'الواتساب: الرسائل تضيع. النوتة: تنسى تحدّثها. الورقة: تضيع أو تتلف.',
    problemDescriptionEn: 'WhatsApp: messages get lost. Notes: you forget to update. Paper: gets lost or damaged.',
    solutionTitle: 'مميزات Diviso',
    solutionTitleEn: 'Diviso Features',
    solutionPoints: [
      'كل شي محفوظ في السحابة - ما يضيع',
      'الحسابات تلقائية - ما في أخطاء',
      'الكل يشوف نفس الأرقام - ما في جدال'
    ],
    solutionPointsEn: [
      'Everything saved in the cloud - never lost',
      'Calculations are automatic - no errors',
      'Everyone sees the same numbers - no debate'
    ],
    exampleBefore: 'رسالة في واتساب: "أحمد عليه 200، سعد عليه 150..." - مين يتذكر هذا بعد أسبوع؟',
    exampleBeforeEn: 'WhatsApp message: "Ahmed owes 200, Saad owes 150..." - who remembers this after a week?',
    exampleAfter: 'كل شخص يفتح Diviso ويشوف رصيده الحالي فوراً',
    exampleAfterEn: 'Everyone opens Diviso and sees their current balance instantly',
    ctaText: 'جرّب الفرق',
    ctaTextEn: 'Try the Difference',
    ctaSubtext: 'مجاني بالكامل - بدون بطاقة ائتمان',
    ctaSubtextEn: 'Completely free - no credit card required'
  }
];

export const getLandingPageBySlug = (slug: string): LandingPageData | undefined => {
  return landingPagesData.find(page => page.slug === slug);
};

export const getAllLandingSlugs = (): string[] => {
  return landingPagesData.map(page => page.slug);
};

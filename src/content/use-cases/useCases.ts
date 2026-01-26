import { Plane, Home, Users, PartyPopper, Mountain, HandCoins } from 'lucide-react';

export interface UseCaseStep {
  title: string;
  description: string;
}

export interface UseCaseFAQ {
  question: string;
  answer: string;
}

export interface UseCase {
  slug: string;
  title: string;
  titleEn: string;
  question: string;
  questionEn: string;
  intro: string;
  introEn: string;
  problems: string[];
  problemsEn: string[];
  solutions: string[];
  solutionsEn: string[];
  steps: UseCaseStep[];
  stepsEn: UseCaseStep[];
  faqs: UseCaseFAQ[];
  faqsEn: UseCaseFAQ[];
  keywords: string[];
  keywordsEn: string[];
  icon: string;
}

export const useCases: UseCase[] = [
  {
    slug: 'travel',
    icon: 'Plane',
    title: 'مصاريف السفر مع الأصدقاء',
    titleEn: 'Travel Expenses with Friends',
    question: 'كيف تقسم مصاريف السفر بين الأصدقاء بدون إحراج؟',
    questionEn: 'How to split travel expenses between friends without awkwardness?',
    intro: 'Diviso يساعد على تقسيم مصاريف السفر تلقائيًا بين المسافرين. يُستخدم لتتبع من دفع ماذا ومعرفة المبالغ المستحقة لكل شخص فورًا.',
    introEn: 'Diviso helps automatically split travel expenses between travelers. It is used to track who paid what and instantly know the amounts owed to each person.',
    problems: [
      'تعدد الدافعين خلال الرحلة',
      'نسيان المصاريف الصغيرة',
      'صعوبة حساب المبالغ النهائية',
      'خلافات بعد انتهاء الرحلة'
    ],
    problemsEn: [
      'Multiple payers during the trip',
      'Forgetting small expenses',
      'Difficulty calculating final amounts',
      'Disputes after the trip ends'
    ],
    solutions: [
      'إضافة المصروف فور حدوثه',
      'تقسيم تلقائي بين جميع المسافرين',
      'معرفة الرصيد لكل شخص لحظيًا',
      'تسوية سهلة في نهاية الرحلة'
    ],
    solutionsEn: [
      'Add expenses as they happen',
      'Automatic split between all travelers',
      'Know each person\'s balance instantly',
      'Easy settlement at trip end'
    ],
    steps: [
      { title: 'أنشئ مجموعة', description: 'أنشئ مجموعة جديدة باسم رحلتك' },
      { title: 'أضف الأعضاء', description: 'أضف جميع المسافرين للمجموعة' },
      { title: 'سجل المصروف', description: 'سجل كل مصروف مع تحديد من دفع' },
      { title: 'شاهد النتيجة', description: 'تعرف على من يدين لمن فورًا' }
    ],
    stepsEn: [
      { title: 'Create a group', description: 'Create a new group with your trip name' },
      { title: 'Add members', description: 'Add all travelers to the group' },
      { title: 'Record expense', description: 'Record each expense with who paid' },
      { title: 'See the result', description: 'Know who owes whom instantly' }
    ],
    faqs: [
      { question: 'هل يحتاج الجميع حساب في Diviso؟', answer: 'لا، يمكنك إضافة أعضاء بدون حساب ومشاركة رابط المجموعة معهم.' },
      { question: 'هل يدعم Diviso عملات متعددة؟', answer: 'نعم، يدعم Diviso أكثر من 30 عملة مع تحويل تلقائي.' },
      { question: 'ماذا لو دفع شخص واحد كل المصاريف؟', answer: 'سيظهر الرصيد المستحق له من كل عضو تلقائيًا.' }
    ],
    faqsEn: [
      { question: 'Does everyone need a Diviso account?', answer: 'No, you can add members without an account and share the group link with them.' },
      { question: 'Does Diviso support multiple currencies?', answer: 'Yes, Diviso supports over 30 currencies with automatic conversion.' },
      { question: 'What if one person paid all expenses?', answer: 'The amount owed to them from each member will be shown automatically.' }
    ],
    keywords: ['تقسيم مصاريف السفر', 'مصاريف الرحلات', 'حساب تكاليف السفر', 'تقسيم فاتورة السفر'],
    keywordsEn: ['split travel expenses', 'trip expenses', 'travel cost calculator', 'travel bill splitting']
  },
  {
    slug: 'shared-housing',
    icon: 'Home',
    title: 'مصاريف السكن المشترك',
    titleEn: 'Shared Housing Expenses',
    question: 'كيف تنظم مصاريف السكن المشترك بين الشركاء؟',
    questionEn: 'How to organize shared housing expenses between roommates?',
    intro: 'Diviso يُستخدم لتنظيم مصاريف السكن المشترك شهريًا. يساعد على تتبع الإيجار والفواتير والمشتريات المشتركة بين الشركاء.',
    introEn: 'Diviso is used to organize shared housing expenses monthly. It helps track rent, bills, and shared purchases between roommates.',
    problems: [
      'نسيان من دفع فاتورة الكهرباء',
      'خلط المصاريف الشخصية بالمشتركة',
      'صعوبة تتبع المشتريات المنزلية',
      'عدم وضوح من يدين لمن'
    ],
    problemsEn: [
      'Forgetting who paid the electricity bill',
      'Mixing personal and shared expenses',
      'Difficulty tracking household purchases',
      'Unclear who owes whom'
    ],
    solutions: [
      'تصنيف المصاريف (إيجار، فواتير، مشتريات)',
      'تقسيم تلقائي أو مخصص',
      'سجل شهري واضح',
      'تسوية دورية سهلة'
    ],
    solutionsEn: [
      'Categorize expenses (rent, bills, purchases)',
      'Automatic or custom split',
      'Clear monthly record',
      'Easy periodic settlement'
    ],
    steps: [
      { title: 'أنشئ مجموعة السكن', description: 'أنشئ مجموعة لشركاء السكن' },
      { title: 'أضف شركاءك', description: 'أضف جميع ساكني الشقة' },
      { title: 'سجل المصاريف', description: 'سجل الإيجار والفواتير والمشتريات' },
      { title: 'تابع الرصيد', description: 'اعرف رصيد كل شخص نهاية الشهر' }
    ],
    stepsEn: [
      { title: 'Create housing group', description: 'Create a group for roommates' },
      { title: 'Add roommates', description: 'Add all apartment residents' },
      { title: 'Record expenses', description: 'Record rent, bills, and purchases' },
      { title: 'Track balance', description: 'Know each person\'s balance at month end' }
    ],
    faqs: [
      { question: 'هل يمكن تقسيم الإيجار بنسب مختلفة؟', answer: 'نعم، يمكنك تحديد نسبة مخصصة لكل عضو حسب حجم الغرفة.' },
      { question: 'كيف أتعامل مع المصاريف المتكررة؟', answer: 'يمكنك إضافة المصروف مرة واحدة وتكراره شهريًا.' },
      { question: 'هل يمكن استثناء عضو من مصروف معين؟', answer: 'نعم، عند إضافة المصروف اختر الأعضاء المشاركين فقط.' }
    ],
    faqsEn: [
      { question: 'Can rent be split in different ratios?', answer: 'Yes, you can set a custom ratio for each member based on room size.' },
      { question: 'How do I handle recurring expenses?', answer: 'You can add the expense once and repeat it monthly.' },
      { question: 'Can I exclude a member from a specific expense?', answer: 'Yes, when adding the expense, choose only participating members.' }
    ],
    keywords: ['مصاريف السكن المشترك', 'تقسيم الإيجار', 'شركاء السكن', 'فواتير الشقة'],
    keywordsEn: ['shared housing expenses', 'split rent', 'roommate expenses', 'apartment bills']
  },
  {
    slug: 'friends-expenses',
    icon: 'Users',
    title: 'مصاريف الطلعات والمطاعم',
    titleEn: 'Friends Outings & Restaurant Bills',
    question: 'كيف تقسم فاتورة المطعم بين الأصدقاء بسهولة؟',
    questionEn: 'How to easily split restaurant bills between friends?',
    intro: 'Diviso يُستخدم لتقسيم فواتير المطاعم والطلعات مع الأصدقاء. يساعد على تجنب الإحراج وحساب المبالغ بدقة.',
    introEn: 'Diviso is used to split restaurant bills and outings with friends. It helps avoid awkwardness and calculate amounts accurately.',
    problems: [
      'إحراج طلب المال من الأصدقاء',
      'نسيان من دفع المرة السابقة',
      'صعوبة تقسيم الفاتورة حسب الطلبات',
      'تراكم الديون الصغيرة'
    ],
    problemsEn: [
      'Awkwardness asking friends for money',
      'Forgetting who paid last time',
      'Difficulty splitting bill by orders',
      'Accumulation of small debts'
    ],
    solutions: [
      'تسجيل سريع للفاتورة',
      'تقسيم بالتساوي أو حسب الطلب',
      'سجل واضح لكل الطلعات',
      'تسوية عند الوصول لمبلغ معين'
    ],
    solutionsEn: [
      'Quick bill recording',
      'Split equally or by order',
      'Clear record of all outings',
      'Settle when reaching a certain amount'
    ],
    steps: [
      { title: 'أنشئ مجموعة الشلة', description: 'أنشئ مجموعة لأصدقائك المقربين' },
      { title: 'أضف الأصدقاء', description: 'أضف أصدقاءك للمجموعة' },
      { title: 'سجل الفاتورة', description: 'سجل فاتورة المطعم فور الدفع' },
      { title: 'اعرف الرصيد', description: 'تعرف على من يدين لك ومن تدين له' }
    ],
    stepsEn: [
      { title: 'Create friend group', description: 'Create a group for your close friends' },
      { title: 'Add friends', description: 'Add your friends to the group' },
      { title: 'Record the bill', description: 'Record the restaurant bill after payment' },
      { title: 'Know the balance', description: 'Know who owes you and who you owe' }
    ],
    faqs: [
      { question: 'هل يمكن تقسيم الفاتورة بشكل غير متساوٍ؟', answer: 'نعم، يمكنك تحديد مبلغ مخصص لكل شخص حسب طلبه.' },
      { question: 'كيف أتعامل مع من لم يأكل؟', answer: 'استثنِه من المصروف عند الإضافة.' },
      { question: 'هل يمكن تصوير الفاتورة؟', answer: 'نعم، يمكنك إرفاق صورة الفاتورة كإثبات.' }
    ],
    faqsEn: [
      { question: 'Can the bill be split unequally?', answer: 'Yes, you can set a custom amount for each person based on their order.' },
      { question: 'How to handle someone who didn\'t eat?', answer: 'Exclude them from the expense when adding.' },
      { question: 'Can I take a photo of the receipt?', answer: 'Yes, you can attach a receipt photo as proof.' }
    ],
    keywords: ['تقسيم فاتورة المطعم', 'مصاريف الطلعات', 'حساب الشلة', 'تقسيم الحساب'],
    keywordsEn: ['split restaurant bill', 'outing expenses', 'friend group expenses', 'bill splitting']
  },
  {
    slug: 'events',
    icon: 'PartyPopper',
    title: 'تقسيم تكاليف الفعاليات',
    titleEn: 'Event Costs Splitting',
    question: 'كيف تقسم تكاليف حفلة أو فعالية بين المنظمين؟',
    questionEn: 'How to split party or event costs between organizers?',
    intro: 'Diviso يُستخدم لتنظيم تكاليف الفعاليات والحفلات. يساعد المنظمين على تتبع المصاريف وتقسيمها بعدالة.',
    introEn: 'Diviso is used to organize event and party costs. It helps organizers track expenses and split them fairly.',
    problems: [
      'تعدد بنود المصاريف',
      'اختلاف مساهمات المنظمين',
      'صعوبة تتبع المشتريات',
      'نسيان تفاصيل المصاريف'
    ],
    problemsEn: [
      'Multiple expense items',
      'Different organizer contributions',
      'Difficulty tracking purchases',
      'Forgetting expense details'
    ],
    solutions: [
      'تصنيف المصاريف (ديكور، طعام، إيجار)',
      'تتبع مساهمة كل منظم',
      'حساب تلقائي للمبالغ',
      'سجل كامل للفعالية'
    ],
    solutionsEn: [
      'Categorize expenses (decor, food, rental)',
      'Track each organizer\'s contribution',
      'Automatic amount calculation',
      'Complete event record'
    ],
    steps: [
      { title: 'أنشئ مجموعة الفعالية', description: 'أنشئ مجموعة باسم الفعالية' },
      { title: 'أضف المنظمين', description: 'أضف جميع المساهمين في التنظيم' },
      { title: 'سجل التكاليف', description: 'سجل كل مصروف مع تصنيفه' },
      { title: 'راجع الحساب النهائي', description: 'اعرف حصة كل منظم بعد الفعالية' }
    ],
    stepsEn: [
      { title: 'Create event group', description: 'Create a group with the event name' },
      { title: 'Add organizers', description: 'Add all contributors to organizing' },
      { title: 'Record costs', description: 'Record each expense with its category' },
      { title: 'Review final account', description: 'Know each organizer\'s share after the event' }
    ],
    faqs: [
      { question: 'كيف أتعامل مع الرعاة والتبرعات؟', answer: 'سجلها كدخل للمجموعة لتخفيض المبالغ المستحقة.' },
      { question: 'هل يمكن تحديد حصص مختلفة للمنظمين؟', answer: 'نعم، يمكنك تعيين نسب مخصصة لكل عضو.' },
      { question: 'كيف أتعامل مع المبالغ المستردة؟', answer: 'سجلها كمصروف سالب أو احذف المصروف الأصلي.' }
    ],
    faqsEn: [
      { question: 'How to handle sponsors and donations?', answer: 'Record them as group income to reduce amounts owed.' },
      { question: 'Can organizers have different shares?', answer: 'Yes, you can assign custom ratios to each member.' },
      { question: 'How to handle refunds?', answer: 'Record them as negative expense or delete the original expense.' }
    ],
    keywords: ['تقسيم تكاليف الفعاليات', 'مصاريف الحفلات', 'تنظيم الفعاليات', 'ميزانية الفعالية'],
    keywordsEn: ['event cost splitting', 'party expenses', 'event organizing', 'event budget']
  },
  {
    slug: 'group-trips',
    icon: 'Mountain',
    title: 'رحلات المجموعات والكشتات',
    titleEn: 'Group Trips & Camping',
    question: 'كيف تنظم ميزانية الكشتة أو رحلة المجموعة؟',
    questionEn: 'How to organize camping or group trip budget?',
    intro: 'Diviso يُستخدم لتنظيم ميزانية الكشتات ورحلات المجموعات. يساعد على تقسيم تكاليف المعدات والطعام والنقل بعدالة.',
    introEn: 'Diviso is used to organize camping and group trip budgets. It helps fairly split equipment, food, and transportation costs.',
    problems: [
      'تكاليف متنوعة (معدات، طعام، وقود)',
      'أعداد كبيرة من المشاركين',
      'مصاريف قبل وأثناء الرحلة',
      'صعوبة التسوية النهائية'
    ],
    problemsEn: [
      'Various costs (equipment, food, fuel)',
      'Large number of participants',
      'Expenses before and during the trip',
      'Difficulty with final settlement'
    ],
    solutions: [
      'تصنيف المصاريف حسب النوع',
      'إضافة أي عدد من المشاركين',
      'تتبع المصاريف من البداية',
      'تسوية واضحة وعادلة'
    ],
    solutionsEn: [
      'Categorize expenses by type',
      'Add any number of participants',
      'Track expenses from the start',
      'Clear and fair settlement'
    ],
    steps: [
      { title: 'أنشئ مجموعة الكشتة', description: 'أنشئ مجموعة لرحلتك القادمة' },
      { title: 'أضف المشاركين', description: 'أضف جميع المشاركين في الرحلة' },
      { title: 'سجل كل المصاريف', description: 'سجل المعدات والطعام والوقود' },
      { title: 'اعرف الحساب النهائي', description: 'تعرف على المبالغ المستحقة لكل شخص' }
    ],
    stepsEn: [
      { title: 'Create camping group', description: 'Create a group for your upcoming trip' },
      { title: 'Add participants', description: 'Add all trip participants' },
      { title: 'Record all expenses', description: 'Record equipment, food, and fuel' },
      { title: 'Know the final account', description: 'Know amounts owed to each person' }
    ],
    faqs: [
      { question: 'ماذا لو لم يشارك البعض في نشاط معين؟', answer: 'استثنِهم من ذلك المصروف فقط.' },
      { question: 'كيف أتعامل مع من جلب معداته الخاصة؟', answer: 'لا تدرجه في مصاريف المعدات المشتركة.' },
      { question: 'هل يمكن جمع مبلغ مقدم من الجميع؟', answer: 'نعم، سجله كدخل ثم اخصم منه المصاريف.' }
    ],
    faqsEn: [
      { question: 'What if some don\'t participate in a specific activity?', answer: 'Exclude them from that expense only.' },
      { question: 'How to handle someone who brought their own equipment?', answer: 'Don\'t include them in shared equipment expenses.' },
      { question: 'Can we collect an upfront amount from everyone?', answer: 'Yes, record it as income then deduct expenses from it.' }
    ],
    keywords: ['ميزانية الكشتة', 'مصاريف الرحلات الجماعية', 'تقسيم تكاليف الرحلة', 'حساب الكشتة'],
    keywordsEn: ['camping budget', 'group trip expenses', 'trip cost splitting', 'camping expenses']
  },
  {
    slug: 'awkward-money-situations',
    icon: 'HandCoins',
    title: 'التعامل مع مواقف الفلوس المحرجة',
    titleEn: 'Handling Awkward Money Situations',
    question: 'كيف تطلب فلوسك من صديقك بدون ما تخرب العلاقة؟',
    questionEn: 'How to ask your friend for money back without ruining the relationship?',
    intro: 'Diviso يحل مشكلة طلب الفلوس من الأصدقاء عن طريق نظام تلقائي يُظهر من يدين لمن بدون ما تحتاج تطلب بنفسك. كل شخص يشوف رصيده بوضوح في التطبيق، والتسوية تصير بضغطة زر عن طريق Apple Pay أو التحويل البنكي بدون إحراج أو خلافات.',
    introEn: 'Diviso solves the problem of asking friends for money through an automatic system that shows who owes whom without needing to ask directly. Everyone sees their balance clearly in the app, and settlement happens with one tap via Apple Pay or bank transfer without awkwardness or disputes.',
    problems: [
      'إحراج طلب الفلوس مباشرة من صديق',
      'نسيان المبالغ الصغيرة المتراكمة',
      'تأثير الديون على العلاقات الشخصية',
      'عدم وجود إثبات واضح للمصاريف',
      'الخوف من إفساد الصداقة بسبب المال'
    ],
    problemsEn: [
      'Awkwardness of directly asking a friend for money',
      'Forgetting small accumulated amounts',
      'Impact of debts on personal relationships',
      'No clear proof of expenses',
      'Fear of ruining friendship over money'
    ],
    solutions: [
      'التطبيق يُظهر الرصيد تلقائياً لكل شخص',
      'إشعارات ودية وغير مباشرة للتذكير',
      'سجل واضح ومفصل لكل المصاريف',
      'تسوية سهلة وسريعة بضغطة زر',
      'لا حاجة لطلب المال شخصياً'
    ],
    solutionsEn: [
      'App shows balance automatically to everyone',
      'Friendly and indirect reminder notifications',
      'Clear and detailed record of all expenses',
      'Easy and quick settlement with one tap',
      'No need to ask for money personally'
    ],
    steps: [
      { title: 'أنشئ مجموعة مشتركة', description: 'أنشئ مجموعة تضم أصدقائك أو زملائك' },
      { title: 'سجل المصاريف', description: 'كل شخص يسجل المصاريف اللي دفعها' },
      { title: 'شاهد الأرصدة', description: 'التطبيق يحسب ويعرض من يدين لمن تلقائياً' },
      { title: 'سوِّ بضغطة', description: 'اضغط على تسوية وحول المبلغ مباشرة' }
    ],
    stepsEn: [
      { title: 'Create a shared group', description: 'Create a group with your friends or colleagues' },
      { title: 'Record expenses', description: 'Everyone records the expenses they paid' },
      { title: 'View balances', description: 'App calculates and shows who owes whom automatically' },
      { title: 'Settle with one tap', description: 'Tap settle and transfer the amount directly' }
    ],
    faqs: [
      { question: 'هل يرسل التطبيق تذكير لصديقي؟', answer: 'نعم، يرسل إشعارات ودية وغير مباشرة تذكر بالرصيد المستحق بدون إحراج.' },
      { question: 'ماذا لو رفض صديقي الدفع؟', answer: 'السجل الواضح للمصاريف يساعد على توضيح الموقف، ويمكنك التفاوض على تقسيط المبلغ.' },
      { question: 'هل يمكن تقسيم المبلغ على دفعات؟', answer: 'نعم، يمكنك تسوية جزء من المبلغ وترك الباقي للوقت المناسب.' },
      { question: 'كيف أتجنب المواقف المحرجة من البداية؟', answer: 'استخدم Diviso من أول مصروف مشترك، والتطبيق يتولى الباقي تلقائياً.' }
    ],
    faqsEn: [
      { question: 'Does the app send a reminder to my friend?', answer: 'Yes, it sends friendly and indirect notifications about the owed balance without awkwardness.' },
      { question: 'What if my friend refuses to pay?', answer: 'The clear expense record helps clarify the situation, and you can negotiate installment payments.' },
      { question: 'Can the amount be split into installments?', answer: 'Yes, you can settle part of the amount and leave the rest for later.' },
      { question: 'How to avoid awkward situations from the start?', answer: 'Use Diviso from the first shared expense, and the app handles the rest automatically.' }
    ],
    keywords: ['طلب الفلوس من صديق', 'مواقف الفلوس المحرجة', 'تجنب الإحراج مع الأصدقاء', 'تسوية الديون بين الأصدقاء', 'كيف أطلب فلوسي'],
    keywordsEn: ['asking friend for money', 'awkward money situations', 'avoiding money embarrassment', 'settling debts between friends', 'how to ask for money back']
  }
];

export const getUseCaseBySlug = (slug: string): UseCase | undefined => {
  return useCases.find(uc => uc.slug === slug);
};

export const getOtherUseCases = (currentSlug: string): UseCase[] => {
  return useCases.filter(uc => uc.slug !== currentSlug);
};

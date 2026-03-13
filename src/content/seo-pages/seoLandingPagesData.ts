export interface SEOLandingPageData {
  slug: string;
  route: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  keywords: string;
  heroSubtitle: string;
  bodyContent: string[];
  features: { icon: string; title: string; description: string }[];
  useCases: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  ctaText: string;
  ctaSubtext: string;
  relatedBlogSlugs: string[];
  relatedPages: { label: string; href: string }[];
}

export const seoLandingPages: SEOLandingPageData[] = [
  {
    slug: 'split-expenses',
    route: '/split-expenses',
    seoTitle: 'Split Expenses with Friends — Free App | Diviso',
    metaDescription: 'Split expenses with friends, roommates, and travel groups instantly. Diviso tracks who paid what and calculates fair shares automatically. Free to use.',
    h1: 'Split Expenses with Friends — Fast, Fair, Free',
    keywords: 'split expenses, split expenses with friends, expense splitting app, share expenses, divide costs, expense sharing app free',
    heroSubtitle: 'Stop guessing who owes what. Diviso tracks every expense and calculates fair shares instantly — so you can focus on the fun, not the math.',
    bodyContent: [
      'Splitting expenses shouldn\'t be awkward. Whether you\'re sharing a dinner tab, splitting rent, or tracking costs on a group trip, Diviso makes it effortless. Just add an expense, select who\'s involved, and the app handles the rest.',
      'Unlike spreadsheets or mental math, Diviso gives everyone real-time visibility into group balances. No more "I\'ll pay you back later" conversations that never happen. Every transaction is tracked, every balance is transparent.',
      'Diviso supports multiple currencies, custom split ratios, and even tracks who paid for what across multiple groups simultaneously. It\'s the expense-splitting app designed for how people actually spend money together.',
    ],
    features: [
      { icon: '⚡', title: 'Instant Splitting', description: 'Add an expense and splits are calculated in real-time. Equal, percentage, or custom amounts.' },
      { icon: '👥', title: 'Unlimited Groups', description: 'Create groups for trips, roommates, couples, events — any situation where money is shared.' },
      { icon: '💰', title: 'Smart Balances', description: 'See exactly who owes whom at a glance. Minimized transactions mean fewer transfers.' },
      { icon: '🌍', title: 'Multi-Currency', description: 'Traveling internationally? Split expenses in any currency with automatic conversion.' },
      { icon: '📊', title: 'Expense Categories', description: 'Tag expenses by category — food, transport, accommodation — to see where the money goes.' },
      { icon: '🔔', title: 'Settlement Reminders', description: 'Gentle nudges so no one forgets to settle up. No more awkward follow-ups.' },
    ],
    useCases: [
      { title: 'Group Dinners', description: 'Split the restaurant bill fairly — even when everyone ordered differently.' },
      { title: 'Vacation with Friends', description: 'Track flights, hotels, activities, and meals across an entire trip.' },
      { title: 'Shared Apartments', description: 'Split rent, utilities, groceries, and household expenses month after month.' },
      { title: 'Couples', description: 'Track shared expenses transparently without uncomfortable conversations.' },
    ],
    faqs: [
      { question: 'Is Diviso free to use?', answer: 'Yes! Diviso is free for unlimited groups and expenses. Premium features are available for power users.' },
      { question: 'How does expense splitting work?', answer: 'Add an expense, select the group members involved, and choose how to split — equally, by percentage, or custom amounts. Diviso calculates balances automatically.' },
      { question: 'Can I split expenses in different currencies?', answer: 'Absolutely. Diviso supports multiple currencies and handles conversions so international trips are hassle-free.' },
      { question: 'Is my financial data secure?', answer: 'Yes. Diviso uses bank-level encryption and never stores payment card information. Your data stays private.' },
      { question: 'How is Diviso different from Splitwise?', answer: 'Diviso offers a cleaner interface, faster expense entry, multi-currency support, and smart settlement suggestions — all for free.' },
    ],
    ctaText: 'Start Splitting — It\'s Free',
    ctaSubtext: 'No credit card required. Works on any device.',
    relatedBlogSlugs: ['how-to-split-expenses-with-friends', 'best-apps-to-split-bills', 'best-splitwise-alternatives'],
    relatedPages: [
      { label: 'Split Bills', href: '/split-bills' },
      { label: 'Travel Expense Splitter', href: '/travel-expense-splitter' },
      { label: 'Roommate Tracker', href: '/roommate-expense-tracker' },
    ],
  },
  {
    slug: 'split-bills',
    route: '/split-bills',
    seoTitle: 'Split Bills Instantly — Free Bill Splitting App | Diviso',
    metaDescription: 'Split bills with friends and groups in seconds. Restaurant checks, utilities, subscriptions — Diviso calculates fair shares automatically.',
    h1: 'Split Bills Instantly with Your Group',
    keywords: 'split bills, bill splitting app, split the bill, divide bill, share bill with friends, restaurant bill splitter',
    heroSubtitle: 'Restaurant check? Utility bill? Subscription? Add it to Diviso and everyone knows their share in seconds.',
    bodyContent: [
      'Bill splitting is one of life\'s small but persistent annoyances. Someone always ends up paying more, someone forgets to pay back, and the mental math is never quite right. Diviso eliminates all of that.',
      'Whether it\'s a dinner bill where everyone ordered different things, a monthly utility bill split between roommates, or a shared subscription, Diviso handles every scenario. Just snap a photo of the receipt or enter the amount manually.',
      'The app keeps a running tab of all shared bills, so settling up is as simple as checking your balance and making one transfer instead of many.',
    ],
    features: [
      { icon: '🧾', title: 'Any Bill Type', description: 'Restaurant checks, utility bills, subscriptions, groceries — split anything.' },
      { icon: '📱', title: 'Receipt Scanning', description: 'Take a photo of the bill and Diviso auto-detects the amount.' },
      { icon: '⚖️', title: 'Flexible Splits', description: 'Equal splits, percentage-based, or custom amounts per person.' },
      { icon: '🔄', title: 'Recurring Bills', description: 'Set up monthly bills that auto-split — perfect for rent and utilities.' },
      { icon: '📈', title: 'Spending Insights', description: 'See how much you spend per category and month across all groups.' },
      { icon: '✅', title: 'One-Tap Settlement', description: 'Mark payments as settled with one tap. No more back-and-forth.' },
    ],
    useCases: [
      { title: 'Restaurant Bills', description: 'Split the check instantly — no awkward calculator moments at the table.' },
      { title: 'Utility Bills', description: 'Divide electricity, water, internet, and gas bills between housemates.' },
      { title: 'Shared Subscriptions', description: 'Split Netflix, Spotify, or any shared subscription fairly.' },
      { title: 'Group Groceries', description: 'Track shared grocery runs and split costs automatically.' },
    ],
    faqs: [
      { question: 'Can I split a bill unevenly?', answer: 'Yes. Diviso supports equal splits, percentage splits, and fully custom amounts per person.' },
      { question: 'Does Diviso work for recurring bills?', answer: 'Absolutely. You can set up recurring expenses for rent, utilities, or subscriptions that auto-split each month.' },
      { question: 'Can I add bills without an internet connection?', answer: 'Yes. Diviso works offline and syncs when you\'re back online.' },
      { question: 'How many people can split a bill?', answer: 'There\'s no limit. You can split a bill with 2 people or 200.' },
    ],
    ctaText: 'Split Your First Bill — Free',
    ctaSubtext: 'Takes 30 seconds. No signup fee.',
    relatedBlogSlugs: ['best-apps-to-split-bills', 'how-to-split-expenses-with-friends'],
    relatedPages: [
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Split Dinner Bill', href: '/split-dinner-bill' },
      { label: 'Group Tracker', href: '/group-expense-tracker' },
    ],
  },
  {
    slug: 'travel-expense-splitter',
    route: '/travel-expense-splitter',
    seoTitle: 'Travel Expense Splitter — Track Group Trip Costs | Diviso',
    metaDescription: 'The best travel expense splitter for group trips. Track flights, hotels, meals, and activities. Split costs fairly with friends. Free app.',
    h1: 'Travel Expense Splitter for Group Trips',
    keywords: 'travel expense splitter, split travel expenses, group trip expense tracker, travel cost splitter, vacation expense sharing, trip budget app',
    heroSubtitle: 'From flights to food to fun — track every travel expense and split costs fairly so the only thing you remember is the adventure.',
    bodyContent: [
      'Group trips are incredible — until someone pulls out a spreadsheet to figure out who owes what. Flights, hotels, restaurants, activities, taxis, tips... the expenses pile up fast, and keeping track manually is a nightmare.',
      'Diviso was built for exactly this. Create a trip group, add members, and start logging expenses as they happen. Paid for the Airbnb? Add it. Bought lunch for everyone? Log it. Diviso tracks every payment and calculates each person\'s running balance in real-time.',
      'At the end of the trip, instead of an awkward group chat about money, everyone sees exactly what they owe or are owed. One simple settlement and you\'re done.',
    ],
    features: [
      { icon: '✈️', title: 'Trip Groups', description: 'Create a dedicated group for each trip with all travelers included.' },
      { icon: '💱', title: 'Multi-Currency', description: 'Traveling abroad? Log expenses in local currency with auto-conversion.' },
      { icon: '📍', title: 'Expense Timeline', description: 'See all expenses chronologically — a complete financial diary of your trip.' },
      { icon: '🏨', title: 'Category Tracking', description: 'Tag expenses as flights, hotels, food, activities, or transport.' },
      { icon: '📊', title: 'Trip Summary', description: 'Get a complete breakdown of trip costs by person and category.' },
      { icon: '🤝', title: 'Smart Settlements', description: 'Minimized transactions — if A owes B and B owes C, Diviso simplifies.' },
    ],
    useCases: [
      { title: 'Weekend Getaways', description: 'Track a short trip\'s expenses from departure to return.' },
      { title: 'International Vacations', description: 'Multi-currency support handles exchange rates automatically.' },
      { title: 'Road Trips', description: 'Split gas, tolls, snacks, and accommodation along the way.' },
      { title: 'Bachelor/Bachelorette Parties', description: 'One person plans, everyone splits — no surprises.' },
    ],
    faqs: [
      { question: 'Can I track expenses in multiple currencies on one trip?', answer: 'Yes. Diviso handles multi-currency trips seamlessly with automatic exchange rate conversion.' },
      { question: 'What if someone didn\'t participate in a specific expense?', answer: 'No problem. When adding an expense, you select exactly who was involved. Only those people are included in the split.' },
      { question: 'Can I see a breakdown of trip costs by category?', answer: 'Absolutely. Diviso provides category-level summaries so you can see how much was spent on food vs. accommodation vs. activities.' },
      { question: 'Is there a limit to the number of expenses per trip?', answer: 'No. Log as many expenses as you need — Diviso handles it all.' },
    ],
    ctaText: 'Plan Your Next Trip with Diviso',
    ctaSubtext: 'Free forever. No hidden fees.',
    relatedBlogSlugs: ['how-to-split-travel-expenses', 'how-to-split-expenses-with-friends'],
    relatedPages: [
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Group Tracker', href: '/group-expense-tracker' },
      { label: 'Split Dinner Bill', href: '/split-dinner-bill' },
    ],
  },
  {
    slug: 'roommate-expense-tracker',
    route: '/roommate-expense-tracker',
    seoTitle: 'Roommate Expense Tracker — Split Rent & Bills | Diviso',
    metaDescription: 'Track and split rent, utilities, groceries, and household expenses with roommates. Diviso keeps everyone\'s balance clear. Free app.',
    h1: 'Roommate Expense Tracker — Split Rent & Bills Fairly',
    keywords: 'roommate expense tracker, split rent with roommates, roommate bill splitter, shared apartment expenses, housemate expense app, split utilities roommates',
    heroSubtitle: 'Rent, utilities, groceries, WiFi — living together means sharing costs. Diviso makes sure everyone pays their fair share, every month.',
    bodyContent: [
      'Living with roommates is great for the wallet and the social life — but splitting expenses can quickly become a source of tension. Who paid the electricity bill? Did everyone chip in for groceries? Is the rent split fair given the room sizes?',
      'Diviso solves all of this. Set up a roommate group, add recurring bills like rent and utilities, and log shared purchases like groceries and cleaning supplies. Everyone can see the running balance at any time.',
      'No more passive-aggressive sticky notes on the fridge. No more "Can you send me your share?" texts. Just clear, transparent expense tracking that keeps the peace.',
    ],
    features: [
      { icon: '🏠', title: 'Household Groups', description: 'One permanent group for all shared living expenses.' },
      { icon: '🔁', title: 'Recurring Expenses', description: 'Set up rent and utilities to auto-split every month.' },
      { icon: '🛒', title: 'Quick Expense Add', description: 'Bought groceries? Log it in 5 seconds from your phone.' },
      { icon: '⚖️', title: 'Custom Split Ratios', description: 'Bigger room? Adjust splits to reflect fair shares.' },
      { icon: '📅', title: 'Monthly Summary', description: 'See total household spending and each person\'s share by month.' },
      { icon: '💬', title: 'No Awkward Conversations', description: 'The app does the talking. Everyone sees their balance.' },
    ],
    useCases: [
      { title: 'Rent Splitting', description: 'Split rent equally or by room size — the choice is yours.' },
      { title: 'Utility Bills', description: 'Electricity, water, gas, internet — all tracked and split automatically.' },
      { title: 'Shared Groceries', description: 'Keep a running tab of grocery runs and household purchases.' },
      { title: 'New Roommate Onboarding', description: 'Add new roommates mid-month and Diviso adjusts balances.' },
    ],
    faqs: [
      { question: 'Can I split rent unevenly based on room size?', answer: 'Yes. Diviso supports custom split ratios so you can assign different percentages or amounts to each roommate.' },
      { question: 'What happens when a roommate moves out?', answer: 'Settle their balance, remove them from the group, and the splits adjust automatically for remaining members.' },
      { question: 'Can I track both rent and day-to-day expenses?', answer: 'Absolutely. Use one group for everything — rent, bills, groceries, and any other shared cost.' },
      { question: 'Does it work for couples living together?', answer: 'Yes! Diviso works great for couples tracking shared household expenses.' },
    ],
    ctaText: 'Track Roommate Expenses — Free',
    ctaSubtext: 'Set up in 60 seconds. No credit card needed.',
    relatedBlogSlugs: ['how-to-split-expenses-with-friends', 'how-to-track-group-expenses'],
    relatedPages: [
      { label: 'Split Bills', href: '/split-bills' },
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Group Tracker', href: '/group-expense-tracker' },
    ],
  },
  {
    slug: 'group-expense-tracker',
    route: '/group-expense-tracker',
    seoTitle: 'Group Expense Tracker — See Who Owes What | Diviso',
    metaDescription: 'Track group expenses and see who owes what in real-time. Perfect for friends, roommates, and travel groups. Free expense tracking app.',
    h1: 'Group Expense Tracker — See Who Owes What',
    keywords: 'group expense tracker, track group expenses, shared expense tracker, who owes what app, group money tracker, group cost tracker',
    heroSubtitle: 'Every group has expenses. Diviso makes sure everyone knows exactly who owes what — in real-time, without the spreadsheets.',
    bodyContent: [
      'Managing group expenses is one of those things everyone deals with but nobody enjoys. Whether it\'s a regular friend group that splits dinners, a team managing a shared budget, or a family pooling money for a gift — keeping track of who paid what and who owes whom is tedious.',
      'Diviso replaces the chaos with clarity. Create a group, add expenses as they happen, and let the app calculate running balances automatically. Everyone in the group can see the dashboard, so there\'s complete transparency.',
      'Smart settlement algorithms minimize the number of transactions needed to square up. Instead of 10 people making 20 transfers, Diviso tells you the optimal 5 transfers to settle all debts.',
    ],
    features: [
      { icon: '👁️', title: 'Real-Time Balances', description: 'Everyone sees updated balances the moment an expense is added.' },
      { icon: '🔗', title: 'Group Links', description: 'Invite members via link — no app download required to view.' },
      { icon: '📋', title: 'Activity Feed', description: 'See every expense and payment in a clear timeline.' },
      { icon: '🧮', title: 'Smart Settlements', description: 'Minimal transactions to settle all debts optimally.' },
      { icon: '🏷️', title: 'Tags & Categories', description: 'Organize expenses with custom tags and categories.' },
      { icon: '📤', title: 'Export Data', description: 'Export your group expenses as a report anytime.' },
    ],
    useCases: [
      { title: 'Friend Groups', description: 'Track ongoing expenses across regular meetups and activities.' },
      { title: 'Event Planning', description: 'Managing a party, wedding, or group gift? Track every contribution.' },
      { title: 'Sports Teams', description: 'Split league fees, equipment costs, and team meals.' },
      { title: 'Family Expenses', description: 'Track shared family costs like gifts, celebrations, or care expenses.' },
    ],
    faqs: [
      { question: 'How many groups can I create?', answer: 'Unlimited. Create as many groups as you need for different circles — friends, family, roommates, trips.' },
      { question: 'Can non-app users be added to a group?', answer: 'Yes. You can add people by name even if they don\'t have the app. They can join later to see their balances.' },
      { question: 'How does smart settlement work?', answer: 'Diviso\'s algorithm minimizes the number of transfers needed. Instead of everyone paying everyone, it calculates the fewest possible payments to settle all debts.' },
      { question: 'Can I delete or edit expenses?', answer: 'Yes. Expenses can be edited or deleted, and all balances update automatically.' },
    ],
    ctaText: 'Track Your Group Expenses — Free',
    ctaSubtext: 'Create your first group in 30 seconds.',
    relatedBlogSlugs: ['how-to-track-group-expenses', 'best-apps-to-split-bills'],
    relatedPages: [
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Roommate Tracker', href: '/roommate-expense-tracker' },
      { label: 'Splitwise Alternative', href: '/splitwise-alternative' },
    ],
  },
  {
    slug: 'split-dinner-bill',
    route: '/split-dinner-bill',
    seoTitle: 'Split Dinner Bill — Fair Restaurant Bill Splitter | Diviso',
    metaDescription: 'Split the dinner bill fairly in seconds. Equal splits, itemized splits, or custom amounts. Never argue over the check again. Free app.',
    h1: 'Split the Dinner Bill in Seconds',
    keywords: 'split dinner bill, restaurant bill splitter, split the check, divide dinner bill, split restaurant bill app, fair bill splitting',
    heroSubtitle: 'The check arrives. Everyone stares. Sound familiar? Diviso splits it fairly in seconds — whether equal or itemized.',
    bodyContent: [
      'We\'ve all been there. The waiter puts the check in the middle of the table and suddenly everyone\'s doing mental math. Someone had the steak, someone just had a salad, and someone\'s not sure if they should split equally or pay for what they ordered.',
      'Diviso takes the stress out of this universal moment. Open the app, add the bill total, and choose how to split. Equal split? Done in 2 taps. Want to be precise? Enter what each person ordered. Either way, the app calculates each share including tax and tip.',
      'No more calculator apps, no more "I only had water" debates. Just fair, transparent splitting that lets you get back to enjoying the evening.',
    ],
    features: [
      { icon: '🍽️', title: 'Quick Bill Split', description: 'Enter the total and split equally with one tap.' },
      { icon: '📝', title: 'Itemized Splitting', description: 'Assign specific items to specific people for precise splits.' },
      { icon: '💡', title: 'Tax & Tip Included', description: 'Automatically distributes tax and tip proportionally.' },
      { icon: '👥', title: 'Group Memory', description: 'In a regular dinner group? Balances carry over between meals.' },
      { icon: '⏱️', title: '10-Second Splits', description: 'From opening the app to having shares calculated — under 10 seconds.' },
      { icon: '🎯', title: 'No Arguments', description: 'Transparent calculations mean no more check debates.' },
    ],
    useCases: [
      { title: 'Restaurant Dinners', description: 'Split any restaurant check fairly, whether 2 people or 20.' },
      { title: 'Birthday Dinners', description: 'Split the bill while covering the birthday person\'s share.' },
      { title: 'Work Lunches', description: 'Track team lunches and who covered last time.' },
      { title: 'Date Nights', description: 'Couples who go Dutch can track shared meals effortlessly.' },
    ],
    faqs: [
      { question: 'Can I split a dinner bill if people ordered different things?', answer: 'Yes. You can do an equal split or assign specific amounts to each person based on what they ordered.' },
      { question: 'Does it handle tax and tip?', answer: 'Yes. Diviso distributes tax and tip proportionally across all diners.' },
      { question: 'What if someone didn\'t eat but wants to chip in?', answer: 'You can add or remove anyone from the split and assign custom amounts.' },
      { question: 'Can I cover someone else\'s share?', answer: 'Absolutely. Just add the full amount as your expense and exclude the other person from the split.' },
    ],
    ctaText: 'Split Your Next Dinner Bill — Free',
    ctaSubtext: 'Download Diviso. Never argue over the check again.',
    relatedBlogSlugs: ['best-apps-to-split-bills', 'how-to-split-expenses-with-friends'],
    relatedPages: [
      { label: 'Split Bills', href: '/split-bills' },
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Group Tracker', href: '/group-expense-tracker' },
    ],
  },
  {
    slug: 'splitwise-alternative',
    route: '/splitwise-alternative',
    seoTitle: 'Best Free Splitwise Alternative 2026 | Diviso',
    metaDescription: 'Looking for a Splitwise alternative? Diviso is free, fast, and feature-rich. Split expenses, track group costs, and settle up without limits.',
    h1: 'The Best Free Splitwise Alternative',
    keywords: 'splitwise alternative, apps like splitwise, splitwise alternative free, better than splitwise, splitwise competitor, diviso vs splitwise',
    heroSubtitle: 'Love the idea of Splitwise but want something faster, cleaner, and actually free? Meet Diviso.',
    bodyContent: [
      'Splitwise pioneered expense splitting, but many users find it cluttered, slow, and increasingly paywalled. If you\'ve been looking for a Splitwise alternative that\'s genuinely free and enjoyable to use, Diviso is your answer.',
      'Diviso does everything Splitwise does — group expenses, balance tracking, multi-currency support, smart settlements — but with a cleaner interface, faster performance, and no paywall for essential features. Inline expense entry, real-time syncing, and smart notifications make the experience seamless.',
      'Whether you\'re switching from Splitwise or trying expense-splitting for the first time, Diviso makes it easy. Import your groups, invite your friends, and start splitting in minutes.',
    ],
    features: [
      { icon: '🆓', title: 'Actually Free', description: 'No paywall for core features. Unlimited groups, unlimited expenses.' },
      { icon: '⚡', title: 'Faster Experience', description: 'Snappier interface, instant calculations, no loading screens.' },
      { icon: '🎨', title: 'Cleaner Design', description: 'Modern, uncluttered UI that\'s a joy to use.' },
      { icon: '🔄', title: 'Easy Migration', description: 'Switching from Splitwise? Import your data in minutes.' },
      { icon: '🌐', title: 'Multi-Currency', description: 'Full multi-currency support included free — not behind a paywall.' },
      { icon: '📱', title: 'Works Everywhere', description: 'Web app that works on any device — phone, tablet, or desktop.' },
    ],
    useCases: [
      { title: 'Splitwise Users', description: 'Switch to Diviso for a cleaner, faster, and free experience.' },
      { title: 'New to Expense Splitting', description: 'Start fresh with the most intuitive app on the market.' },
      { title: 'International Groups', description: 'Multi-currency support without a premium subscription.' },
      { title: 'Large Groups', description: 'No member limits, no expense limits, no hidden caps.' },
    ],
    faqs: [
      { question: 'Is Diviso really free?', answer: 'Yes. Core expense splitting — unlimited groups, expenses, and members — is completely free. We offer optional premium features for power users.' },
      { question: 'How is Diviso different from Splitwise?', answer: 'Diviso offers a cleaner interface, faster performance, free multi-currency support, and no paywall on essential features like itemized splits and expense categories.' },
      { question: 'Can I import my Splitwise data?', answer: 'We\'re working on direct import. In the meantime, you can quickly recreate your groups and start fresh.' },
      { question: 'Is Diviso available on iOS and Android?', answer: 'Diviso is a progressive web app that works on any device with a browser. Native apps are coming soon.' },
      { question: 'Does Diviso have ads?', answer: 'Diviso uses minimal, non-intrusive partner recommendations. Your experience is never interrupted by ads.' },
    ],
    ctaText: 'Switch to Diviso — Free',
    ctaSubtext: 'Join thousands who\'ve made the switch.',
    relatedBlogSlugs: ['best-splitwise-alternatives', 'best-apps-to-split-bills', 'how-to-split-expenses-with-friends'],
    relatedPages: [
      { label: 'Split Expenses', href: '/split-expenses' },
      { label: 'Group Tracker', href: '/group-expense-tracker' },
      { label: 'Travel Splitter', href: '/travel-expense-splitter' },
    ],
  },
];

export const getSEOPageBySlug = (slug: string): SEOLandingPageData | undefined => {
  return seoLandingPages.find(page => page.slug === slug);
};

export const getSEOPageByRoute = (route: string): SEOLandingPageData | undefined => {
  return seoLandingPages.find(page => page.route === route);
};

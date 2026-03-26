

# إعادة تصميم صفحة المجموعة — صفحة واحدة بدون تبويبات

## الملف المتأثر

| الملف | التغيير |
|---|---|
| `src/pages/GroupDetails.tsx` | إعادة هيكلة كاملة — إزالة Tabs وتحويلها لصفحة واحدة متسلسلة |

## الهيكل الجديد

```text
┌─────────────────────────────────┐
│  Header (كما هو — اسم + ⋮)     │
├─────────────────────────────────┤
│  1. Summary Grid (3 أعمدة)      │
│     أعضاء | مصاريف | رصيدك      │
│     + سطر حالة: متوازن/عليك/لك  │
├─────────────────────────────────┤
│  2. Smart Action Bar            │
│     زر واحد ديناميكي حسب الحالة  │
├─────────────────────────────────┤
│  3. Smart Suggestion (اختياري)  │
│     اقتراح واحد فقط             │
├─────────────────────────────────┤
│  4. Secondary Actions           │
│     مصروف | تسوية | دعوة عضو    │
├─────────────────────────────────┤
│  5. Chat Timeline               │
│     دردشة + فلاتر (الكل|مالي)   │
├─────────────────────────────────┤
│  6. Expenses Preview (آخر 3)    │
│     + "عرض كل المصاريف"         │
├─────────────────────────────────┤
│  7. Settlement Card             │
│     حالة + زر سداد/تفاصيل       │
├─────────────────────────────────┤
│  8. Members Preview (أول 3)     │
│     + "عرض جميع الأعضاء" → Sheet │
├─────────────────────────────────┤
│  Dialogs (كلها تبقى)            │
└─────────────────────────────────┘
```

## التفاصيل

### 1. إزالة Tabs
- حذف `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`, `activeTab` state
- حذف كل مكونات الميزانية: `BudgetProgressCard`, `BudgetQuickActions`, `CreateBudgetDialog`, `EditBudgetDialog`, `DeleteBudgetDialog`, `useGroupBudgetTracking`, `useBudgets` والـ states المرتبطة (`createBudgetOpen`, `editBudgetOpen`, `deleteBudgetOpen`, `editingBudget`, `deletingBudget`, `budgetTotals`)
- حذف `GroupCompactSummary`, `GroupStatusBanner`, `SettlementProgressBar`, `RecommendationNotification`
- حذف زر "إضافة عضو" وزر "إضافة مصروف" المنفصلين (ينتقلان للـ Secondary Actions)

### 2. Summary Grid (نفس أسلوب Dashboard)
شبكة 3 أعمدة مطابقة للصفحة الرئيسية:
- **أعضاء** (Users) — `memberCount`
- **المصاريف** (Receipt) — `totals.approvedExpenses` + `currencyLabel`
- **رصيدك** (Wallet) — `myBalances.confirmed` (أخضر إذا موجب، أحمر إذا سالب)

تحتها سطر حالة:
- `> 0` → "لك X ريال" (أخضر)
- `< 0` → "عليك X ريال" (أحمر)
- `=== 0` → "متوازن ✓"

### 3. Smart Action Bar
شريط بارز بزر واحد فقط:
- **عليه مبلغ**: نص "عليك {amount}" + زر primary "سدد الآن" → `openSettlement()`
- **له مبلغ**: نص "لك {amount}" + زر outline "اطلب السداد" → `setRequestPaymentOpen(true)`
- **لا مصاريف**: نص "ابدأ بإضافة أول مصروف" + زر "إضافة مصروف"
- **متوازن**: نص "كل شيء تمام ✓" + زر خفيف "أضف مصروف"

### 4. Smart Suggestion (اختياري)
- يظهر فقط عند وجود حالة تستحق (مثلاً: عضو لم يسدد)
- اقتراح واحد فقط كـ inline text خفيف
- يعتمد على `debtors` و `balanceSummary` لتوليد الاقتراح

### 5. Secondary Actions
صف من 3 أزرار outline صغيرة متساوية:
- إضافة مصروف → `navigate(/add-expense?groupId=...)`
- تسوية → `openSettlement()`
- دعوة عضو → `setOpenInvite(true)`
- تظهر فقط إذا المجموعة نشطة (`canAddExpenses`)

### 6. Chat Timeline
- إبقاء `GroupChat` كما هو بالضبط (لديه فلاتر الكل/مالي/رسائل مدمجة)
- إزالة الـ wrapper header فوقه (الدردشة + badge متصل)

### 7. Expenses Preview
- عرض آخر 3 مصاريف فقط: `expenses.slice(0, 3)`
- نفس تصميم كارد المصروف الحالي (مع approve/reject إذا canApprove)
- زر "عرض كل المصاريف (X)" → ينتقل لصفحة `/my-expenses?group=${id}` أو يفتح Sheet
- Empty state: "لا توجد مصاريف بعد — ابدأ بإضافة أول مصروف"

### 8. Settlement Card
كارد واحد بسيط:
- إذا عليه مبلغ: "عليك X ريال" + زر "سدد الآن"
- إذا متوازن: "المجموعة متوازنة ✓"
- زر "عرض التفاصيل" يفتح `BalanceDashboard` في Sheet (بدل عرضه مباشرة)

### 9. Members Preview
- عرض أول 3 أعضاء مع رصيد كل واحد (اسم + مبلغ مبسط)
- زر "عرض جميع الأعضاء (X)" يفتح Sheet يحتوي القائمة الكاملة مع `MemberCard` و `PendingMemberCard`
- Empty state: "ادعُ أعضاء للمجموعة"

### 10. إبقاء جميع الـ Dialogs
كل الـ dialogs تبقى كما هي: Settlement, SettlementGuard, EditExpense, RejectExpense, ExpenseDetails, DeleteExpense, DeleteGroup, LeaveGroup, CloseGroup, FinishGroup, RequestPayment, TripSummary, PreviousBalance, Rating, ProfileCompletion, InviteManagement, GroupReport.

### 11. إزالة Budget Dialogs فقط
حذف: `CreateBudgetDialog`, `EditBudgetDialog`, `DeleteBudgetDialog` والـ states الخاصة بها.


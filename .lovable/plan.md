

# إزالة قسم التصويت من صفحة الخطة

## التغييرات

### `src/pages/PlanDetails.tsx`
1. حذف استيراد `PlanVotesTab`
2. حذف state الخاص بـ `voteFromSuggestion`
3. حذف دالة `handleConvertToVote`
4. حذف prop `onConvertToVote` من `PlanSuggestionsTab`
5. تحويل التبويبات من `grid-cols-5` إلى `grid-cols-4`
6. حذف `TabsTrigger` و `TabsContent` الخاصة بـ `votes`

### `src/components/plans/PlanSuggestionsTab.tsx`
- إزالة زر "تحويل إلى تصويت" من الاقتراحات (إزالة prop `onConvertToVote` واستخداماته)




# تبسيط تبويبات الدعوة إلى نوعين فقط

## التغيير
في `src/components/group/InviteManagementDialog.tsx`:
- تغيير `grid-cols-4` إلى `grid-cols-2`
- إزالة تبويب "رقم جوال" (phone) و "متابعة" (tracking) من TabsList و TabsContent
- إزالة imports غير مستخدمة: `PhoneInviteTab`, `usePendingGroupInvites`, `useGroupInviteActions`, `Phone`, `History`, `Clock`, `XCircle`, `Loader2`, `Badge`
- إزالة الـ state والـ logic المرتبطة بالتبويبات المحذوفة (`pendingInvites`, `cancelInvite`, `PendingInvitesList`)
- الإبقاء على تبويب "أشخاص" (known) و "رابط" (link) فقط

### الملف المتأثر
| الملف | التغيير |
|---|---|
| `src/components/group/InviteManagementDialog.tsx` | إزالة تبويبي phone و tracking، تبسيط لـ 2 تبويبات |


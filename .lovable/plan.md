

# FAB Context-Aware Actions

## التغيير
ملف واحد: `src/components/BottomNav.tsx` + ترجمات جديدة

### المنطق
استخدام `location.pathname` لتحديد 3 أفعال مختلفة حسب الصفحة:

| السياق | الشرط | الأفعال (بالترتيب) |
|---|---|---|
| **داخل مجموعة** | `/group/:id` | إضافة مصروف، تسوية، دعوة عضو |
| **مجموعاتي** | `/my-groups` | إنشاء مجموعة، الانضمام برابط، إنشاء خطة |
| **الرئيسية / أي صفحة أخرى** | fallback | إضافة مصروف، إنشاء مجموعة، إنشاء خطة |

### التعديلات

**`BottomNav.tsx`**:
- استبدال `fabActions` الثابت بدالة `getFabActions()` تعتمد على `location.pathname`
- للمجموعة: استخراج `groupId` من المسار وتمريره كـ query param (`/add-expense?group=ID`)
- إضافة أيقونات: `Handshake` للتسوية، `Link` للانضمام برابط، `UserPlus` للدعوة
- لا API calls — كل شيء static

**`ar/common.json` + `en/common.json`**:
إضافة مفاتيح جديدة:
```json
"fab": {
  "add_expense": "إضافة مصروف",
  "create_group": "إنشاء مجموعة",
  "create_plan": "إنشاء خطة",
  "settlement": "تسوية",
  "invite_member": "دعوة عضو",
  "join_by_link": "الانضمام برابط"
}
```

### الملفات

| الملف | التغيير |
|---|---|
| `src/components/BottomNav.tsx` | `getFabActions()` context-aware |
| `src/i18n/locales/ar/common.json` | 3 مفاتيح جديدة |
| `src/i18n/locales/en/common.json` | 3 مفاتيح جديدة |


import { z } from 'zod';

// ===================================
// SECURITY: Input Validation Schemas
// ===================================

/**
 * Message validation schema
 * Prevents XSS and DoS attacks via excessively long messages
 */
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'الرسالة لا يمكن أن تكون فارغة')
    .max(1000, 'الرسالة طويلة جداً (الحد الأقصى 1000 حرف)'),
  group_id: z.string()
    .uuid('معرف المجموعة غير صالح')
});

/**
 * Settlement validation schema
 * Prevents negative amounts and data integrity issues
 */
export const settlementSchema = z.object({
  from_user_id: z.string().uuid('معرف المستخدم المرسل غير صالح'),
  to_user_id: z.string().uuid('معرف المستخدم المستقبل غير صالح'),
  amount: z.number()
    .positive('المبلغ يجب أن يكون موجباً')
    .max(10000000, 'المبلغ كبير جداً')
    .refine(val => val > 0, 'المبلغ يجب أن يكون أكبر من صفر'),
  group_id: z.string().uuid('معرف المجموعة غير صالح'),
  note: z.string()
    .max(500, 'الملاحظة طويلة جداً (الحد الأقصى 500 حرف)')
    .optional()
});

/**
 * Expense validation schema
 * Validates all expense fields to prevent data corruption
 */
export const expenseSchema = z.object({
  amount: z.number()
    .positive('المبلغ يجب أن يكون موجباً')
    .max(10000000, 'المبلغ كبير جداً'),
  description: z.string()
    .trim()
    .min(1, 'الوصف مطلوب')
    .max(500, 'الوصف طويل جداً (الحد الأقصى 500 حرف)'),
  category_id: z.string()
    .uuid('معرف الفئة غير صالح')
    .nullable(),
  group_id: z.string().uuid('معرف المجموعة غير صالح'),
  payer_id: z.string().uuid('معرف الدافع غير صالح'),
  spent_at: z.string().datetime('تاريخ الإنفاق غير صالح'),
  currency: z.string().length(3, 'رمز العملة يجب أن يكون 3 أحرف')
});

/**
 * Expense split validation schema
 */
export const expenseSplitSchema = z.object({
  member_id: z.string().uuid('معرف العضو غير صالح'),
  share_amount: z.number()
    .nonnegative('المبلغ لا يمكن أن يكون سالباً')
    .max(10000000, 'المبلغ كبير جداً')
});

/**
 * Group creation validation schema
 */
export const groupSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'اسم المجموعة مطلوب')
    .max(100, 'اسم المجموعة طويل جداً (الحد الأقصى 100 حرف)'),
  currency: z.string()
    .length(3, 'رمز العملة يجب أن يكون 3 أحرف')
    .default('SAR'),
  group_type: z.string()
    .max(50, 'نوع المجموعة غير صالح')
    .optional()
});

/**
 * Validate and sanitize user input
 * Throws ZodError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate input and return safe result with error handling
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || 'خطأ في البيانات المدخلة'
      };
    }
    return { success: false, error: 'خطأ في التحقق من البيانات' };
  }
}

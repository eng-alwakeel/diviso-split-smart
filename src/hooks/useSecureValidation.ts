import { useState, useCallback } from 'react';

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  phone?: boolean;
  email?: boolean;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export function useSecureValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((
    fieldName: string,
    value: string,
    rules: ValidationRules
  ): ValidationResult => {
    // Required field validation
    if (rules.required && (!value || value.trim().length === 0)) {
      const error = 'هذا الحقل مطلوب';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, error };
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return { isValid: true, error: null };
    }

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      const error = `يجب أن يكون الحد الأدنى ${rules.minLength} أحرف`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, error };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      const error = `يجب أن يكون الحد الأقصى ${rules.maxLength} أحرف`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, error };
    }

    // Phone validation (Saudi numbers)
    if (rules.phone) {
      const phonePattern = /^(\+966|966|0)?5[0-9]{8}$|^\+966[1-9][0-9]{8}$|^05[0-9]{8}$/;
      if (!phonePattern.test(value)) {
        const error = 'رقم الهاتف غير صحيح';
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return { isValid: false, error };
      }
    }

    // Email validation
    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        const error = 'البريد الإلكتروني غير صحيح';
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return { isValid: false, error };
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      const error = 'التنسيق غير صحيح';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, error };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        setErrors(prev => ({ ...prev, [fieldName]: customError }));
        return { isValid: false, error: customError };
      }
    }

    // Clear any existing errors for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    return { isValid: true, error: null };
  }, []);

  const validateForm = useCallback((
    formData: Record<string, string>,
    validationRules: Record<string, ValidationRules>
  ): boolean => {
    let isFormValid = true;
    const newErrors: Record<string, string> = {};

    Object.entries(validationRules).forEach(([fieldName, rules]) => {
      const value = formData[fieldName] || '';
      const result = validateField(fieldName, value, rules);
      
      if (!result.isValid && result.error) {
        newErrors[fieldName] = result.error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const sanitizeInput = useCallback((input: string): string => {
    // Remove potential XSS characters and normalize
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/script injection chars
      .trim()
      .normalize('NFC'); // Normalize Unicode
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    sanitizeInput,
  };
}

// Enhanced password validation
export function usePasswordValidation() {
  const validatePassword = useCallback((password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, error: 'كلمة المرور مطلوبة' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'كلمة المرور طويلة جداً' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل' };
    }

    // Check for common weak passwords
    const commonPasswords = ['12345678', 'password', 'qwerty123', '11111111'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى' };
    }

    return { isValid: true, error: null };
  }, []);

  return { validatePassword };
}
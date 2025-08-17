import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSecurityAudit() {
  const logSecurityEvent = useCallback(async (
    action: string,
    tableName?: string,
    details?: Record<string, any>
  ) => {
    try {
      await supabase.rpc('log_security_event', {
        p_action: action,
        p_table_name: tableName,
        p_details: details || {}
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }, []);

  const validateInput = useCallback((input: string, maxLength: number = 1000): boolean => {
    if (!input || input.length > maxLength) return false;
    
    // Check for potential security threats
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  }, []);

  const sanitizeForDisplay = useCallback((input: string): string => {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      });
  }, []);

  return {
    logSecurityEvent,
    validateInput,
    sanitizeForDisplay
  };
}
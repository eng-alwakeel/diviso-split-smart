import { useEffect } from 'react';

export function useSecurityHeaders() {
  useEffect(() => {
    // Add security-related meta tags if not already present
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Content Security Policy (basic implementation)
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    
    // Prevent MIME type sniffing
    addMetaTag('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS Protection
    addMetaTag('X-XSS-Protection', '1; mode=block');
    
    // Prevent clickjacking
    addMetaTag('X-Frame-Options', 'DENY');

    // Feature Policy
    addMetaTag('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Monitor for potential security issues
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('Security policy violation:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
    };

    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  // Sanitize user input
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Validate phone numbers more strictly
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  // Validate email addresses
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  // Check for suspicious patterns
  const detectSuspiciousActivity = (input: string): boolean => {
    const suspiciousPatterns = [
      /script\s*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /<iframe/i,
      /eval\s*\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  };

  return {
    sanitizeInput,
    validatePhoneNumber,
    validateEmail,
    detectSuspiciousActivity
  };
}
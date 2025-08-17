import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers: string[];
}

export const useContacts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // For web, we'll use a mock implementation
      if (typeof window !== 'undefined' && window.navigator) {
        return true; // Always grant permission for now
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const getContacts = async (): Promise<ContactInfo[]> => {
    setLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        toast({
          title: "الصلاحية مطلوبة",
          description: "يرجى السماح بالوصول لجهات الاتصال لاستخدام هذه الميزة",
          variant: "destructive",
        });
        return [];
      }

      // Mock contacts for web development
      const mockContacts: ContactInfo[] = [
        {
          id: '1',
          name: 'أحمد محمد',
          phoneNumbers: ['966501234567']
        },
        {
          id: '2', 
          name: 'سارة علي',
          phoneNumbers: ['966551234567']
        },
        {
          id: '3',
          name: 'خالد فهد',
          phoneNumbers: ['966561234567', '966581234567']
        }
      ];

      return mockContacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "خطأ في جلب جهات الاتصال",
        description: "تعذر الوصول لجهات الاتصال، حاول مرة أخرى",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    getContacts,
    loading,
  };
};
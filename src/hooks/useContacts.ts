import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isNativePlatform } from '@/lib/native';

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
      if (!isNativePlatform()) {
        // For web, show a message that this feature is only available on mobile
        toast({
          title: "ميزة متاحة على الجوال فقط",
          description: "هذه الميزة متاحة فقط عند استخدام التطبيق على الجوال",
          variant: "destructive",
        });
        return false;
      }

      // Try to dynamically import and use Capacitor Contacts
      try {
        // @ts-ignore - Dynamic import for optional dependency
        const contactsModule = await import('@capacitor/contacts').catch(() => null);
        if (!contactsModule) {
          throw new Error('Contacts module not available');
        }
        
        const { Contacts } = contactsModule;
        const permission = await Contacts.checkPermissions();
        
        if (permission.contacts === 'granted') {
          return true;
        }
        
        if (permission.contacts === 'denied') {
          toast({
            title: "الصلاحية مرفوضة",
            description: "يرجى تفعيل صلاحية الوصول لجهات الاتصال من إعدادات التطبيق",
            variant: "destructive",
          });
          return false;
        }

        // Request permission if not granted or denied
        const requested = await Contacts.requestPermissions();
        if (requested.contacts === 'granted') {
          return true;
        } else {
          toast({
            title: "الصلاحية مطلوبة",
            description: "يرجى السماح بالوصول لجهات الاتصال لاستخدام هذه الميزة",
            variant: "destructive",
          });
          return false;
        }
      } catch (importError) {
        console.log('Contacts plugin not available:', importError);
        toast({
          title: "الميزة غير متاحة",
          description: "مكتبة جهات الاتصال غير مثبتة. يرجى استخدام npm install @capacitor/contacts && npx cap sync",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      toast({
        title: "خطأ في طلب الصلاحية",
        description: "تعذر طلب صلاحية الوصول لجهات الاتصال",
        variant: "destructive",
      });
      return false;
    }
  };

  const getContacts = async (): Promise<ContactInfo[]> => {
    setLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return [];
      }

      if (!isNativePlatform()) {
        // Return empty array for web since we can't access real contacts
        return [];
      }

      // Try to get real contacts from device
      try {
        // @ts-ignore - Dynamic import for optional dependency
        const contactsModule = await import('@capacitor/contacts').catch(() => null);
        if (!contactsModule) {
          throw new Error('Contacts module not available');
        }
        
        const { Contacts } = contactsModule;
        const result = await Contacts.getContacts({
          projection: {
            name: true,
            phones: true,
          }
        });

        const contactsData: ContactInfo[] = result.contacts
          .filter((contact: any) => contact.name && contact.phones && contact.phones.length > 0)
          .map((contact: any) => ({
            id: contact.contactId || Math.random().toString(),
            name: contact.name?.display || 'بدون اسم',
            phoneNumbers: contact.phones?.map((phone: any) => 
              phone.number?.replace(/\s+/g, '').replace(/[^\d+]/g, '') || ''
            ).filter((phone: string) => phone.length > 0) || []
          }))
          .filter((contact: ContactInfo) => contact.phoneNumbers.length > 0);

        return contactsData;
      } catch (importError) {
        console.log('Contacts plugin not available, returning empty list');
        return [];
      }
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
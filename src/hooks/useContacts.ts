import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers: string[];
}

export const useContacts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isNativePlatform = Capacitor.isNativePlatform();

  const getContacts = async (): Promise<ContactInfo[]> => {
    setLoading(true);
    try {
      // للويب: إرجاع مصفوفة فارغة - الوصول لجهات الاتصال متاح فقط في التطبيق
      if (!isNativePlatform) {
        console.log('Running on web - contacts not available');
        return [];
      }

      // للموبايل: طلب صلاحية الوصول لجهات الاتصال
      const permissionStatus = await Contacts.requestPermissions();
      
      if (permissionStatus.contacts !== 'granted') {
        toast({
          title: "الصلاحية مطلوبة",
          description: "يرجى السماح بالوصول لجهات الاتصال لاستخدام هذه الميزة",
          variant: "destructive",
        });
        return [];
      }

      // جلب جهات الاتصال الحقيقية
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true
        }
      });

      // تحويل البيانات للصيغة المطلوبة
      const contacts: ContactInfo[] = result.contacts
        .filter(contact => contact.phones && contact.phones.length > 0)
        .map(contact => ({
          id: contact.contactId || String(Math.random()),
          name: contact.name?.display || contact.name?.given || 'غير معروف',
          phoneNumbers: contact.phones?.map(p => p.number?.replace(/\D/g, '') || '') || []
        }))
        .filter(contact => contact.phoneNumbers.some(phone => phone.length > 0));

      console.log(`Fetched ${contacts.length} contacts from device`);
      return contacts;

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
    isNativePlatform,
  };
};
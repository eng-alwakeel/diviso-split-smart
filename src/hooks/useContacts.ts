import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers: string[];
}

// بيانات وهمية للتطوير على الويب
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
  },
  {
    id: '4',
    name: 'محمد سعيد',
    phoneNumbers: ['966571234567']
  },
  {
    id: '5',
    name: 'فاطمة أحمد',
    phoneNumbers: ['966591234567']
  }
];

export const useContacts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getContacts = async (): Promise<ContactInfo[]> => {
    setLoading(true);
    try {
      // للويب: استخدام بيانات وهمية للتطوير
      if (!Capacitor.isNativePlatform()) {
        console.log('Running on web - using mock contacts');
        return mockContacts;
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
  };
};
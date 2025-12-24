import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useContacts, ContactInfo } from '@/hooks/useContacts';

export interface RegisteredContact extends ContactInfo {
  userId: string;
  registeredPhone: string;
}

export interface ContactsWithRegistrationStatus {
  registeredContacts: RegisteredContact[];
  unregisteredContacts: ContactInfo[];
}

// تنظيف رقم الهاتف للمقارنة
const cleanPhoneNumber = (phone: string): string => {
  // إزالة كل شيء ما عدا الأرقام
  let cleaned = phone.replace(/\D/g, '');
  
  // إزالة رمز الدولة إذا كان موجوداً (966 للسعودية)
  if (cleaned.startsWith('966')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(5);
  }
  
  // إزالة الصفر الأول إذا كان موجوداً
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
};

export const useRegisteredContacts = () => {
  const [loading, setLoading] = useState(false);
  const { getContacts, loading: contactsLoading } = useContacts();

  const checkRegisteredContacts = useCallback(async (
    excludeNumbers: string[] = []
  ): Promise<ContactsWithRegistrationStatus> => {
    setLoading(true);
    
    try {
      // 1. جلب جهات الاتصال من الجهاز
      const contacts = await getContacts();
      
      if (contacts.length === 0) {
        return { registeredContacts: [], unregisteredContacts: [] };
      }
      
      // 2. استخراج جميع الأرقام من جهات الاتصال
      const allPhoneNumbers: string[] = [];
      contacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          const cleaned = cleanPhoneNumber(phone);
          if (cleaned.length >= 9) {
            allPhoneNumbers.push(cleaned);
          }
        });
      });
      
      // 3. جلب المستخدمين المسجلين من قاعدة البيانات
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, phone, name, display_name')
        .not('phone', 'is', null);
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return { registeredContacts: [], unregisteredContacts: contacts };
      }
      
      // 4. إنشاء map للأرقام المسجلة
      const registeredPhoneMap = new Map<string, { userId: string; name: string | null }>();
      profiles?.forEach(profile => {
        if (profile.phone) {
          const cleanedPhone = cleanPhoneNumber(profile.phone);
          registeredPhoneMap.set(cleanedPhone, {
            userId: profile.id,
            name: profile.display_name || profile.name
          });
        }
      });
      
      // 5. فصل جهات الاتصال إلى مسجلين وغير مسجلين
      const registeredContacts: RegisteredContact[] = [];
      const unregisteredContacts: ContactInfo[] = [];
      const excludeCleanedNumbers = excludeNumbers.map(cleanPhoneNumber);
      
      contacts.forEach(contact => {
        let isRegistered = false;
        let registeredInfo: { userId: string; registeredPhone: string } | null = null;
        
        // فحص كل رقم في جهة الاتصال
        for (const phone of contact.phoneNumbers) {
          const cleanedPhone = cleanPhoneNumber(phone);
          
          // تخطي الأرقام المستثناة
          if (excludeCleanedNumbers.includes(cleanedPhone)) {
            continue;
          }
          
          const registered = registeredPhoneMap.get(cleanedPhone);
          if (registered) {
            isRegistered = true;
            registeredInfo = { userId: registered.userId, registeredPhone: phone };
            break;
          }
        }
        
        if (isRegistered && registeredInfo) {
          registeredContacts.push({
            ...contact,
            userId: registeredInfo.userId,
            registeredPhone: registeredInfo.registeredPhone
          });
        } else {
          // فلترة الأرقام المستثناة
          const availablePhones = contact.phoneNumbers.filter(phone => 
            !excludeCleanedNumbers.includes(cleanPhoneNumber(phone))
          );
          
          if (availablePhones.length > 0) {
            unregisteredContacts.push({
              ...contact,
              phoneNumbers: availablePhones
            });
          }
        }
      });
      
      return { registeredContacts, unregisteredContacts };
    } catch (error) {
      console.error('Error checking registered contacts:', error);
      return { registeredContacts: [], unregisteredContacts: [] };
    } finally {
      setLoading(false);
    }
  }, [getContacts]);

  return {
    checkRegisteredContacts,
    loading: loading || contactsLoading
  };
};

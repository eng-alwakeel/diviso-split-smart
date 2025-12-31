import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRegisteredContacts, RegisteredContact, ContactsWithRegistrationStatus } from "@/hooks/useRegisteredContacts";
import { ContactInfo } from "@/hooks/useContacts";
import { Contact, Search, Phone, Check, CheckCircle2, UserPlus, Sparkles, Smartphone, Send } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface ContactsPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSelected: (contact: ContactInfo, phoneNumber: string, isRegistered: boolean, userId?: string) => void;
  excludeNumbers?: string[];
}

export const ContactsPicker = ({ 
  open, 
  onOpenChange, 
  onContactSelected, 
  excludeNumbers = [] 
}: ContactsPickerProps) => {
  const [contactsData, setContactsData] = useState<ContactsWithRegistrationStatus>({
    registeredContacts: [],
    unregisteredContacts: []
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const { checkRegisteredContacts, loading } = useRegisteredContacts();
  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    if (open) {
      if (isNativePlatform) {
        loadContacts();
      }
    } else {
      setSearchQuery("");
      setSelectedContact(null);
      setSelectedPhone("");
      setManualPhone("");
      setManualName("");
    }
  }, [open, isNativePlatform]);

  const loadContacts = async () => {
    const data = await checkRegisteredContacts(excludeNumbers);
    setContactsData(data);
  };

  const filteredRegistered = contactsData.registeredContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumbers.some(phone => phone.includes(searchQuery))
  );

  const filteredUnregistered = contactsData.unregisteredContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumbers.some(phone => phone.includes(searchQuery))
  );

  const handleRegisteredContactClick = (contact: RegisteredContact) => {
    onContactSelected(contact, contact.registeredPhone, true, contact.userId);
    onOpenChange(false);
  };

  const handleUnregisteredContactClick = (contact: ContactInfo) => {
    if (contact.phoneNumbers.length === 1) {
      const phoneNumber = contact.phoneNumbers[0];
      onContactSelected(contact, phoneNumber, false);
      onOpenChange(false);
    } else {
      setSelectedContact(contact);
    }
  };

  const handlePhoneSelect = (phoneNumber: string) => {
    if (selectedContact) {
      onContactSelected(selectedContact, phoneNumber, false);
      onOpenChange(false);
    }
  };

  const handleManualSubmit = () => {
    const cleanPhone = manualPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 9 && manualName.trim()) {
      const contact: ContactInfo = {
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        phoneNumbers: [cleanPhone]
      };
      onContactSelected(contact, cleanPhone, false);
      onOpenChange(false);
    }
  };

  const isManualFormValid = manualPhone.replace(/\D/g, '').length >= 9 && manualName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Contact className="w-5 h-5" />
            {isNativePlatform ? "اختيار من جهات الاتصال" : "إرسال دعوة"}
          </DialogTitle>
          <DialogDescription>
            {isNativePlatform 
              ? "اختر جهة اتصال لإرسال دعوة انضمام للمجموعة"
              : "أدخل بيانات الشخص لإرسال دعوة انضمام للمجموعة"
            }
          </DialogDescription>
        </DialogHeader>

        {/* واجهة الويب - إدخال يدوي */}
        {!isNativePlatform && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  الوصول لجهات الاتصال متاح فقط في تطبيق الجوال
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium text-center">أدخل البيانات يدوياً</p>
              <div className="space-y-3">
                <Input 
                  placeholder="اسم الشخص" 
                  value={manualName} 
                  onChange={(e) => setManualName(e.target.value)}
                />
                <Input 
                  placeholder="رقم الجوال (مثال: 966501234567)" 
                  value={manualPhone} 
                  onChange={(e) => setManualPhone(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
                <Button 
                  onClick={handleManualSubmit} 
                  disabled={!isManualFormValid}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  إرسال الدعوة
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* واجهة التطبيق - جهات الاتصال */}
        {isNativePlatform && !selectedContact && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في جهات الاتصال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      جاري تحميل جهات الاتصال...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* قسم الأصدقاء المسجلين */}
                    {filteredRegistered.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            أصدقاء على Diviso ({filteredRegistered.length})
                          </span>
                        </div>
                        
                        {filteredRegistered.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                            onClick={() => handleRegisteredContactClick(contact)}
                          >
                            <Avatar className="w-10 h-10 ring-2 ring-primary/30">
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {contact.name.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">
                                {contact.registeredPhone}
                              </p>
                            </div>
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              مسجل
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* قسم دعوة أصدقاء جدد */}
                    {filteredUnregistered.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <UserPlus className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            دعوة أصدقاء جدد ({filteredUnregistered.length})
                          </span>
                        </div>
                        
                        {filteredUnregistered.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/20 cursor-pointer transition-colors"
                            onClick={() => handleUnregisteredContactClick(contact)}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-muted">
                                {contact.name.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {contact.phoneNumbers.length} رقم متاح
                              </p>
                            </div>
                            {contact.phoneNumbers.length > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                عدة أرقام
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredRegistered.length === 0 && filteredUnregistered.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد جهات اتصال متاحة"}
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* اختيار رقم من جهة اتصال متعددة الأرقام */}
        {isNativePlatform && selectedContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-accent/10">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedContact.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedContact.name}</p>
                <p className="text-sm text-muted-foreground">اختر رقم الجوال</p>
              </div>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selectedContact.phoneNumbers.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => handlePhoneSelect(phone)}
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 font-mono text-left" dir="ltr">
                      {phone}
                    </span>
                    <Check className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button 
              variant="outline" 
              onClick={() => setSelectedContact(null)}
              className="w-full"
            >
              العودة لقائمة جهات الاتصال
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts, ContactInfo } from "@/hooks/useContacts";
import { Contact, Search, Phone, Check } from "lucide-react";

interface ContactsPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSelected: (contact: ContactInfo, phoneNumber: string) => void;
  excludeNumbers?: string[];
}

export const ContactsPicker = ({ 
  open, 
  onOpenChange, 
  onContactSelected, 
  excludeNumbers = [] 
}: ContactsPickerProps) => {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const { getContacts, loading } = useContacts();

  useEffect(() => {
    if (open) {
      loadContacts();
    } else {
      setSearchQuery("");
      setSelectedContact(null);
      setSelectedPhone("");
    }
  }, [open]);

  const loadContacts = async () => {
    const contactList = await getContacts();
    // Filter out contacts that are already members
    const filteredContacts = contactList.filter(contact =>
      contact.phoneNumbers.some(phone => 
        !excludeNumbers.includes(phone.replace(/\D/g, ''))
      )
    );
    setContacts(filteredContacts);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumbers.some(phone => phone.includes(searchQuery))
  );

  const handleContactClick = (contact: ContactInfo) => {
    if (contact.phoneNumbers.length === 1) {
      const phoneNumber = contact.phoneNumbers[0];
      if (!excludeNumbers.includes(phoneNumber.replace(/\D/g, ''))) {
        onContactSelected(contact, phoneNumber);
        onOpenChange(false);
      }
    } else {
      setSelectedContact(contact);
    }
  };

  const handlePhoneSelect = (phoneNumber: string) => {
    if (selectedContact && !excludeNumbers.includes(phoneNumber.replace(/\D/g, ''))) {
      onContactSelected(selectedContact, phoneNumber);
      onOpenChange(false);
    }
  };

  const isPhoneExcluded = (phone: string) => {
    return excludeNumbers.includes(phone.replace(/\D/g, ''));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Contact className="w-5 h-5" />
            اختيار من جهات الاتصال
          </DialogTitle>
          <DialogDescription>
            اختر جهة اتصال لإرسال دعوة انضمام للمجموعة
          </DialogDescription>
        </DialogHeader>

        {!selectedContact ? (
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

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    جاري تحميل جهات الاتصال...
                  </p>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد جهات اتصال متاحة"}
                  </p>
                ) : (
                  filteredContacts.map((contact) => {
                    const availablePhones = contact.phoneNumbers.filter(phone => 
                      !isPhoneExcluded(phone)
                    );
                    
                    if (availablePhones.length === 0) return null;

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/20 cursor-pointer transition-colors"
                        onClick={() => handleContactClick(contact)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contact.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {availablePhones.length} رقم متاح
                          </p>
                        </div>
                        {availablePhones.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            عدة أرقام
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
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
                {selectedContact.phoneNumbers.map((phone, index) => {
                  const isExcluded = isPhoneExcluded(phone);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isExcluded 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-accent/20 cursor-pointer'
                      }`}
                      onClick={() => !isExcluded && handlePhoneSelect(phone)}
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 font-mono text-left" dir="ltr">
                        {phone}
                      </span>
                      {isExcluded && (
                        <Badge variant="destructive" className="text-xs">
                          عضو بالفعل
                        </Badge>
                      )}
                      {!isExcluded && (
                        <Check className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
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
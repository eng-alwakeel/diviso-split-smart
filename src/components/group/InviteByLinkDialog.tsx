
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Link, RefreshCw, MessageSquare, Contact, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { BRAND_CONFIG } from "@/lib/brandConfig";
import { ContactsPicker } from "@/components/group/ContactsPicker";
import { ContactInfo } from "@/hooks/useContacts";

interface InviteByLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | undefined;
  groupName?: string;
  existingMembers?: string[];
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteByLinkDialog = ({ open, onOpenChange, groupId, groupName, existingMembers = [] }: InviteByLinkDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['groups', 'common']);
  const { handleQuotaError } = useQuotaHandler();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactsOpen, setContactsOpen] = useState(false);

  const disabledReason = useMemo(() => {
    if (!groupId) return t('groups:invite.no_group_id', 'No group ID.');
    if (!isUUID(groupId)) return t('groups:invite.demo_group', 'This is a demo group. Open a real group (UUID) to enable invites.');
    return null;
  }, [groupId, t]);

  useEffect(() => {
    if (!open) {
      setLink("");
      setPhoneNumber("");
      setContactsOpen(false);
    }
  }, [open]);

  const generateLink = async () => {
    if (disabledReason) {
      toast({ title: t('groups:invite.cannot_create'), description: disabledReason, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("group_join_tokens")
      .insert({ group_id: groupId })
      .select("token")
      .single();

    setLoading(false);

    if (error) {
      if (!handleQuotaError(error)) {
        toast({
          title: t('groups:invite.link_error'),
          description: error.message || t('groups:invite.check_admin'),
          variant: "destructive",
        });
      }
      return;
    }

    const token = data?.token as string;
    const url = `${BRAND_CONFIG.url}/i/${token}`;
    setLink(url);
    toast({ title: t('groups:invite.invite_created'), description: t('groups:invite.share_with_members') });
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: t('common:toast.copied'), description: t('common:toast.link_copied') });
  };

  const sendWhatsAppInvite = () => {
    if (!phoneNumber.trim() || !link || !groupName) return;
    
    const message = t('groups:invite.whatsapp_message', { groupName, inviteLink: link });
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: t('groups:invite.whatsapp_opened'),
      description: t('groups:invite.whatsapp_redirect'),
    });
  };

  const handleNativeShare = async () => {
    if (!link) return;
    const shareText = groupName 
      ? `انضم لمجموعة "${groupName}" على ${BRAND_CONFIG.name} 👇\n${link}`
      : `انضم للمجموعة على ${BRAND_CONFIG.name} 👇\n${link}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: t('common:toast.copied'), description: t('common:toast.link_copied') });
      }
    } catch {
      // User cancelled share
    }
  };

  const handleContactSelected = (contact: ContactInfo, selectedPhone: string) => {
    setPhoneNumber(selectedPhone);
    toast({ title: "تم اختيار جهة الاتصال", description: `${contact.name} — شارك الرابط معه` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('groups:members_tab.invite_new')}</DialogTitle>
          <DialogDescription>{t('groups:invite.link_description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('groups:invite.group_id', 'Group ID')}</Label>
            <Input value={groupId || ""} readOnly />
            {disabledReason && <p className="text-xs text-destructive mt-1">{disabledReason}</p>}
          </div>

          <div className="flex gap-2">
            <Button className="flex items-center gap-2" onClick={generateLink} disabled={!!disabledReason || loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              {t('groups:invite.create_link', 'Create Invite Link')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t('groups:invite.link_title')}</Label>
            <div className="flex gap-2">
              <Input value={link} readOnly placeholder={t('groups:invite.link_placeholder', 'Link will appear here after creation')} />
              <Button variant="outline" onClick={copyLink} disabled={!link} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {link && (
            <>
              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('groups:invite.title')}</Label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleNativeShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    مشاركة الرابط
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!link || !groupName) {
                        handleNativeShare();
                        return;
                      }
                      const message = t('groups:invite.whatsapp_message', { groupName, inviteLink: link });
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                  >
                    <MessageSquare className="w-4 h-4" />
                    واتساب
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('groups:invite.or_enter_phone', 'Or enter phone number')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      placeholder={t('groups:invite.phone_placeholder')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-left"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setContactsOpen(true)}
                      className="shrink-0"
                    >
                      <Contact className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {phoneNumber.trim() && (
                  <Button
                    variant="outline"
                    onClick={sendWhatsAppInvite}
                    className="w-full bg-green-500 hover:bg-green-600 text-white border-green-500"
                  >
                    <MessageSquare className="w-4 h-4 ml-2" />
                    إرسال واتساب إلى {phoneNumber}
                  </Button>
                )}
              </div>
            </>
          )}

          <ContactsPicker
            open={contactsOpen}
            onOpenChange={setContactsOpen}
            onContactSelected={handleContactSelected}
            excludeNumbers={existingMembers}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

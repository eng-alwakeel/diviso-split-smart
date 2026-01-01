import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowRight, 
  ArrowLeft,
  Gift, 
  Copy, 
  Share2, 
  Users, 
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Link,
  UserPlus,
  Coins
} from "lucide-react";
import { ContactsPicker } from "@/components/group/ContactsPicker";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { useReferralStats } from "@/hooks/useReferralStats";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const ReferralCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('referral');
  const { isRTL } = useLanguage();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  const { 
    referrals, 
    referralCode, 
    loading: referralsLoading, 
    getReferralLink
  } = useReferrals();

  const { 
    totalEarnedFromReferrals,
    totalReferrals: totalReferralsCount,
    joinedReferrals,
    loading: statsLoading
  } = useReferralStats();

  const referralLink = getReferralLink();
  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === 'joined').length;

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleCopy = async () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: t('toast.copied'),
      description: t('toast.copied_desc'),
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: t('invite.title'),
      text: t('invite.message', { code: referralCode || '' }),
      url: referralLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleCopy();
      }
    }
  };

  const handleContactSelected = async (
    contact: { name: string },
    phone: string,
    isRegistered: boolean
  ) => {
    setContactsOpen(false);
    
    if (isRegistered) {
      toast({
        title: t('toast.already_registered'),
        description: t('toast.already_registered_desc', { name: contact.name }),
      });
    } else {
      const shareText = `${t('invite.message', { code: referralCode || '' })}\n${referralLink}`;
      
      try {
        if (navigator.share) {
          await navigator.share({
            title: t('invite.title'),
            text: shareText,
            url: referralLink
          });
        } else {
          navigator.clipboard.writeText(shareText);
          toast({
            title: t('toast.copied'),
            description: t('toast.ready_to_share', { name: contact.name }),
          });
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: isRTL ? ar : enUS });
    } catch {
      return dateString;
    }
  };

  if (referralsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO title={t('title')} noIndex={true} />
      <AppHeader />
      
      <div className="page-container space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <BackIcon className="w-4 h-4 ms-2" />
            {t('back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>

        {/* Balance Card - Updated to show reward points */}
        <Card className="shadow-card bg-gradient-to-br from-card to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalEarnedFromReferrals}</p>
                <p className="text-sm text-muted-foreground">{t('balance_card.earned')} ({t('common:points', 'نقطة')})</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-6 text-center text-sm text-muted-foreground border-t border-border pt-4">
              <div>
                <p className="font-semibold text-foreground">{totalReferrals}</p>
                <p>{t('balance_card.referrals')}</p>
              </div>
              <div className="border-s border-border ps-6">
                <p className="font-semibold text-foreground">{successfulReferrals}</p>
                <p>{t('balance_card.successful')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code and Referral Link */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('share.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <QRCodeDisplay 
                value={referralLink} 
                size={180}
                showActions={true}
              />
            </div>

            <Separator />
            
            {/* Referral Link */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Link className="w-4 h-4" />
                {t('share.link_label')}:
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-sm font-mono break-all text-primary">
                  {referralLink}
                </p>
              </div>
            </div>
            
            {/* Code */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{t('share.code_label')}:</span>
              <Badge variant="secondary" className="font-mono text-base">
                {referralCode || '---'}
              </Badge>
            </div>

            {/* Copy and Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleCopy}
                className="h-12"
              >
                <Copy className="w-4 h-4 ms-2" />
                {t('share.copy')}
              </Button>
              <Button 
                onClick={handleShare}
                className="h-12"
              >
                <Share2 className="w-4 h-4 ms-2" />
                {t('share.share')}
              </Button>
            </div>

            {/* Separator */}
            <div className="relative">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                {t('share.or')}
              </span>
            </div>

            {/* Invite from Contacts Button */}
            <Button 
              variant="outline" 
              onClick={() => setContactsOpen(true)}
              className="w-full h-12"
            >
              <UserPlus className="w-4 h-4 ms-2" />
              {t('share.invite_contacts')}
            </Button>
          </CardContent>
        </Card>

        {/* ContactsPicker Dialog */}
        <ContactsPicker
          open={contactsOpen}
          onOpenChange={setContactsOpen}
          onContactSelected={handleContactSelected}
        />

        {/* Referral History - Collapsible */}
        {referrals.length > 0 && (
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <Card className="shadow-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {t('history.title')}
                      <Badge variant="secondary" className="ms-2">{referrals.length}</Badge>
                    </div>
                    {isHistoryOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {referrals.slice(0, 10).map((referral) => (
                      <div 
                        key={referral.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            referral.status === 'joined' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {referral.status === 'joined' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {referral.invitee_name || referral.invitee_phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(referral.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={referral.status === 'joined' ? 'secondary' : 'outline'}
                          className={referral.status === 'joined' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'border-orange-300 text-orange-600'
                          }
                        >
                          {referral.status === 'joined' ? t('history.joined') : t('history.pending')}
                        </Badge>
                      </div>
                    ))}
                    
                    {referrals.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground pt-2">
                        {t('history.more_referrals', { count: referrals.length - 10 })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ReferralCenter;

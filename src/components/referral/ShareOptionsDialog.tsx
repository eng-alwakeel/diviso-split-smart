import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialShareButtons } from './SocialShareButtons';
import { MessageEditor } from './MessageEditor';
import { SharePerformanceChart } from './SharePerformanceChart';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { useSocialShareTracking } from '@/hooks/useSocialShareTracking';
import { supabase } from '@/integrations/supabase/client';
import { Share2, MessageSquare, QrCode, TrendingUp } from 'lucide-react';

interface ShareOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
  referralCode: string;
}

export const ShareOptionsDialog = ({
  open,
  onOpenChange,
  referralLink,
  referralCode
}: ShareOptionsDialogProps) => {
  const [customMessage, setCustomMessage] = useState('');
  const [stats, setStats] = useState({});
  const [userId, setUserId] = useState<string | undefined>();
  const { getShareStats } = useSocialShareTracking();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  useEffect(() => {
    if (open && userId) {
      loadStats();
    }
  }, [open, userId]);

  const loadStats = async () => {
    if (userId) {
      const data = await getShareStats(userId);
      setStats(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">خيارات المشاركة المتقدمة</DialogTitle>
          <DialogDescription>
            اختر طريقة مشاركة إحالتك وتابع أداءها
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">مشاركة سريعة</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">رسالة مخصصة</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">اختر منصة للمشاركة</h3>
                <SocialShareButtons
                  referralLink={referralLink}
                  referralCode={referralCode}
                  message={customMessage}
                  layout="grid"
                  showLabels={true}
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    💡 نصائح للمشاركة الفعالة
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                    <li>• واتساب وتليجرام الأكثر فعالية في السعودية</li>
                    <li>• تويتر مناسب للوصول لجمهور أوسع</li>
                    <li>• سناب شات وإنستقرام ممتازين للـ Stories</li>
                    <li>• استخدم QR Code في الفعاليات والاجتماعات</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-6">
            <MessageEditor
              referralCode={referralCode}
              referralLink={referralLink}
              onMessageChange={setCustomMessage}
            />

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-4">شارك بالرسالة المخصصة:</h3>
                <SocialShareButtons
                  referralLink={referralLink}
                  referralCode={referralCode}
                  message={customMessage}
                  layout="grid"
                  showLabels={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-center mb-2">
                      QR Code الخاص بإحالتك
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      يمكن مسح هذا الرمز للوصول المباشر لرابط الإحالة
                    </p>
                  </div>

                  <QRCodeDisplay value={referralLink} size={250} />

                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-3 text-center">
                      شارك QR Code على:
                    </h4>
                    <SocialShareButtons
                      referralLink={referralLink}
                      referralCode={referralCode}
                      layout="grid"
                      showLabels={true}
                      platforms={['instagram', 'snapchat', 'whatsapp', 'telegram']}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    📸 أفكار لاستخدام QR Code
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                    <li>• أضفه إلى Instagram/Snapchat Stories</li>
                    <li>• استخدمه في البطاقات الشخصية</li>
                    <li>• اطبعه على ملصقات أو منشورات</li>
                    <li>• شاركه في الفعاليات والمؤتمرات</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <SharePerformanceChart stats={stats} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Eye, History, Loader2, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: "مسودة", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  sending: { label: "جاري الإرسال", variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "مكتمل", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "فشل", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export function AdminBroadcastEmail() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch campaign history
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Send broadcast mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
        body: { subject, body_html: bodyHtml, body_text: bodyText },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإرسال بنجاح ✉️",
        description: `تم إرسال ${data.sent_count} من أصل ${data.total_recipients} إيميل${data.failed_count > 0 ? ` (${data.failed_count} فشل)` : ""}`,
      });
      setSubject("");
      setBodyHtml("");
      setBodyText("");
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الإيميلات",
        variant: "destructive",
      });
    },
  });

  const handleSendClick = () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى كتابة العنوان والمحتوى",
        variant: "destructive",
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSend = () => {
    setShowConfirm(false);
    sendMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">كتابة إعلان</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">معاينة</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">السجل</span>
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال إعلان لجميع المسجلين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">عنوان الإيميل</label>
                <Input
                  placeholder="مثال: 🎉 ميزة جديدة في ديفيزو!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  محتوى الإيميل (HTML)
                </label>
                <Textarea
                  placeholder={`<h2>أخبار سارة! 🎉</h2>\n<p>أطلقنا ميزة جديدة تساعدك في...</p>\n<p>جربها الآن!</p>`}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={10}
                  dir="rtl"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  نص مختصر (اختياري - للأجهزة التي لا تدعم HTML)
                </label>
                <Textarea
                  placeholder="نص بسيط بدون تنسيق..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={3}
                  dir="rtl"
                />
              </div>

              <Button
                onClick={handleSendClick}
                disabled={sendMutation.isPending || !subject.trim() || !bodyHtml.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    إرسال لجميع المسجلين
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                معاينة الإيميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subject && !bodyHtml ? (
                <p className="text-muted-foreground text-center py-8">
                  اكتب العنوان والمحتوى أولاً لتظهر المعاينة
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {/* Subject preview */}
                  <div className="bg-muted px-4 py-3 border-b">
                    <p className="text-sm text-muted-foreground">العنوان:</p>
                    <p className="font-semibold">{subject || "(بدون عنوان)"}</p>
                  </div>
                  {/* HTML preview */}
                  <div
                    className="p-6 bg-background prose prose-sm max-w-none"
                    dir="rtl"
                    dangerouslySetInnerHTML={{
                      __html: bodyHtml || "<p class='text-muted-foreground'>لا يوجد محتوى</p>",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل الحملات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !campaigns || campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد حملات سابقة
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => {
                    const statusInfo = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
                    return (
                      <div
                        key={campaign.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(campaign.created_at).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-xs text-muted-foreground text-left">
                            <span className="text-primary">{campaign.sent_count}</span>
                            {" / "}
                            <span>{campaign.total_recipients}</span>
                            {campaign.failed_count > 0 && (
                              <span className="text-destructive mr-1">
                                ({campaign.failed_count} فشل)
                              </span>
                            )}
                          </div>
                          <Badge variant={statusInfo.variant} className="gap-1 flex-shrink-0">
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إرسال الإعلان</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>سيتم إرسال هذا الإيميل لجميع المستخدمين المسجلين.</p>
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="font-medium text-foreground">العنوان: {subject}</p>
              </div>
              <p className="text-destructive font-medium mt-2">
                هذا الإجراء لا يمكن التراجع عنه!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleConfirmSend} className="gap-2">
              <Send className="h-4 w-4" />
              تأكيد الإرسال
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

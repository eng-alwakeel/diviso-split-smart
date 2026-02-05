 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Gift, Loader2, ArrowLeft, Clock } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { usePaymentwallTokens } from '@/hooks/usePaymentwallTokens';
 import { toast } from 'sonner';
 
 interface PaymentwallOfferwallDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onRewardEarned?: () => void;
   isRTL?: boolean;
 }
 
 export function PaymentwallOfferwallDialog({
   open,
   onOpenChange,
   onRewardEarned,
   isRTL = false
 }: PaymentwallOfferwallDialogProps) {
   const [userId, setUserId] = useState<string | null>(null);
   const [projectKey, setProjectKey] = useState<string | null>(null);
   const [iframeUrl, setIframeUrl] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   
   const { status: paywallStatus, refetch: refreshStatus } = usePaymentwallTokens();
 
   // Get user when dialog opens
   useEffect(() => {
     if (!open) return;
     
     supabase.auth.getUser().then(({ data: { user } }) => {
       if (user) {
         setUserId(user.id);
       }
     });
   }, [open]);
 
   // Fetch project key
   useEffect(() => {
     if (!open) return;
     
     const fetchProjectKey = async () => {
       setLoading(true);
       try {
         const { data, error: fnError } = await supabase.functions.invoke('paymentwall-widget-key');
         
         if (fnError) throw fnError;
         
         if (data?.project_key) {
           setProjectKey(data.project_key);
         } else {
           throw new Error('Project key not found');
         }
       } catch (err) {
         console.error('Error fetching project key:', err);
         setError(isRTL ? 'فشل تحميل العروض' : 'Failed to load offers');
       } finally {
         setLoading(false);
       }
     };
 
     fetchProjectKey();
   }, [open, isRTL]);
 
   // Build iframe URL when we have project key and user
   useEffect(() => {
     if (!open || !projectKey) return;
     
     const uid = userId || `guest_${Date.now()}`;
     // Build Paymentwall Offerwall widget URL (iframe-based)
     const widgetUrl = new URL('https://api.paymentwall.com/api/offerwall/');
     widgetUrl.searchParams.set('key', projectKey);
     widgetUrl.searchParams.set('uid', uid);
     widgetUrl.searchParams.set('widget', 'ow1_1');
     
     setIframeUrl(widgetUrl.toString());
   }, [open, projectKey, userId]);
 
   // Reset state when dialog closes
   useEffect(() => {
     if (!open) {
       setIframeUrl(null);
       setError(null);
     }
   }, [open]);
 
   const handleClose = () => {
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent 
         className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col" 
         dir={isRTL ? 'rtl' : 'ltr'}
       >
         <DialogHeader className="flex-shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
               <Gift className="h-6 w-6 text-blue-600" />
             </div>
             <div>
               <DialogTitle className="text-lg">
                 {isRTL ? 'أكمل عرض واحصل على مكافأة' : 'Complete Offer & Get Reward'}
               </DialogTitle>
               <DialogDescription>
                 {isRTL 
                   ? 'اختر عرضاً لإكماله والحصول على عملية مجانية' 
                   : 'Choose an offer to complete and earn a free action'
                 }
               </DialogDescription>
             </div>
           </div>
           
           {/* Status badges */}
           <div className="flex items-center gap-2 mt-3">
             <Badge variant="secondary" className="text-xs">
               {isRTL ? 'متاح: ' : 'Available: '}{paywallStatus.available}
             </Badge>
             <Badge variant="outline" className="text-xs">
               {isRTL ? 'اليوم: ' : 'Today: '}
               {paywallStatus.usedToday}/{paywallStatus.dailyLimit}
             </Badge>
             {paywallStatus.cooldownSeconds > 0 && (
               <Badge variant="secondary" className="text-xs flex items-center gap-1 text-orange-600">
                 <Clock className="h-3 w-3" />
                 {paywallStatus.cooldownSeconds}s
               </Badge>
             )}
           </div>
         </DialogHeader>
 
         {/* Widget container */}
         <div className="flex-1 min-h-[400px] overflow-auto mt-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full">
               <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
               <p className="text-sm text-muted-foreground">
                 {isRTL ? 'جاري تحميل العروض...' : 'Loading offers...'}
               </p>
             </div>
           ) : error ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <p className="text-destructive mb-4">{error}</p>
               <Button variant="outline" onClick={() => window.location.reload()}>
                 {isRTL ? 'إعادة المحاولة' : 'Retry'}
               </Button>
             </div>
           ) : iframeUrl ? (
             <iframe
               src={iframeUrl}
               className="w-full h-[400px] rounded-lg border-0"
               title="Paymentwall Offerwall"
               allow="payment"
             />
           ) : (
             <div className="flex flex-col items-center justify-center h-[400px]">
               <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
               <p className="text-sm text-muted-foreground">
                 {isRTL ? 'جاري تحميل العروض...' : 'Loading offers...'}
               </p>
             </div>
           )}
         </div>
 
         {/* Footer */}
         <div className="flex-shrink-0 pt-4 border-t">
           <Button variant="ghost" className="w-full" onClick={handleClose}>
             <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
             {isRTL ? 'رجوع' : 'Back'}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
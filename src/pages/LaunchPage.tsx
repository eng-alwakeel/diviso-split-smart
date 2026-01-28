import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { Link2, Check } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { trackWithUTM } = useGoogleAnalytics();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackWithUTM('launch_page_view', {
      page_path: '/launch'
    });
  }, [trackWithUTM]);

  // CTA Handler
  const handleCTA = async () => {
    trackWithUTM('launch_cta_click');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      navigate('/create-group');
    } else {
      navigate('/auth?mode=signup&redirect=/create-group');
    }
  };

  // Share Handler
  const handleShare = async () => {
    const shareText = `عشان ما نتوه في الحسابات والكسور المرة الجاية.. 🌚
هذا التطبيق بيضبط لنا كل المصاريف ويقسمها بيننا بالملّي. حملوه وخلونا نترتب.
الرابط: ${window.location.origin}/launch`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: 'تم النسخ!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background"
      dir="rtl"
    >
      <SEO 
        title="القسمة دايمًا تلخبط؟ خلّها واضحة"
        description="تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش"
        ogImage="https://diviso.app/og-image.png"
        noIndex={false}
      />

      {/* Logo */}
      <img 
        src={BRAND_CONFIG.logo} 
        alt="Diviso" 
        className="h-12 w-auto mb-8" 
      />

      {/* H1 Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6 leading-tight">
        القسمة دايمًا تلخبط؟<br />
        خلّها واضحة وبلا إحراج
      </h1>

      {/* Description */}
      <p className="text-lg text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        في السفر، الطلعات، أو السكن<br />
        دائمًا فيه واحد يدفع أكثر<br />
        هذا التطبيق يخلي القسمة عادلة وواضحة بينكم
      </p>

      {/* Primary CTA */}
      <Button 
        onClick={handleCTA}
        size="lg"
        className="text-xl px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
      >
        ابدأ الحين
      </Button>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground text-center mt-4">
        بدقيقة تنشئ مجموعتك<br />
        وتبدأ تحسب بدون نقاش
      </p>

      {/* Share Element */}
      <button 
        onClick={handleShare}
        className="mt-12 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        <span>شارك الرابط مع شلتك</span>
      </button>
    </div>
  );
};

export default LaunchPage;

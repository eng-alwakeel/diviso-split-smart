import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  MapPin
} from "lucide-react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-muted/50 to-muted">
      <div className="container mx-auto px-4 py-16">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
              </div>
              <p className="text-sm font-medium text-muted-foreground/80">
                قسّم بذكاء، سافر براحة | Split Smart, Travel Easy
              </p>
            </div>
            <p className="text-muted-foreground">
              إدارة المصاريف المشتركة بذكاء وسهولة. قسّم النفقات واتبع الميزانية مع أصدقائك وعائلتك.
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط مفيدة</h4>
            <div className="space-y-3 text-muted-foreground">
              <Link to="/how-it-works" className="block hover:text-foreground transition-colors text-sm">
                كيف يعمل التطبيق
              </Link>
              <Link to="/faq" className="block hover:text-foreground transition-colors text-sm">
                الأسئلة الشائعة
              </Link>
              <Link to="/pricing" className="block hover:text-foreground transition-colors text-sm">
                الباقات والأسعار
              </Link>
              <Link to="/privacy-policy" className="block hover:text-foreground transition-colors text-sm">
                سياسة الخصوصية
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@diviso.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+966 50 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">الرياض، المملكة العربية السعودية</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>© 2024 Diviso. جميع الحقوق محفوظة.</p>
            <span className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">
              v{new Date().toISOString().slice(0, 16).replace('T', '-')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
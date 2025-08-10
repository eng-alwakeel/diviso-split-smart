import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  Download
} from "lucide-react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-muted/50 to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white text-center mb-16">
          <h3 className="text-2xl font-bold mb-2">ابق على اطلاع</h3>
          <p className="text-muted-foreground mb-6">
            اشترك في نشرتنا البريدية للحصول على آخر التحديثات والنصائح المالية
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              placeholder="بريدك الإلكتروني" 
              className="bg-white/10 border-white/20 text-white placeholder:text-muted-foreground"
            />
            <Button variant="secondary">اشتراك</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
            </div>
            <p className="text-muted-foreground">
              إدارة المصاريف المشتركة بذكاء وسهولة. قسّم النفقات واتبع الميزانية مع أصدقائك وعائلتك.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">المنتج</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">المزايا</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">الباقات</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">التحديثات</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">الأمان</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">الدعم</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">مركز المساعدة</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">تواصل معنا</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">التدريب</a></li>
            </ul>
          </div>

          {/* Contact & Download */}
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
            
            <div className="mt-6">
              <h5 className="font-medium mb-3">حمّل التطبيق</h5>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="w-4 h-4 ml-2" />
                  App Store
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="w-4 h-4 ml-2" />
                  Google Play
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Diviso. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-foreground transition-colors">شروط الاستخدام</a>
            <a href="#" className="hover:text-foreground transition-colors">ملفات الارتباط</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
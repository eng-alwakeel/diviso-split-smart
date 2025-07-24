import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, Calculator, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative py-20 bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-right">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              إدارة المصاريف
              <br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                بذكاء وسهولة
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              قسّم المصاريف بين الأصدقاء والعائلة والزملاء بطريقة عادلة وذكية. 
              تتبع النفقات، احسب الديون، وتلقى تحليلات مالية مدعومة بالذكاء الاصطناعي.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end mb-8">
              <Button variant="secondary" size="lg" className="text-lg">
                ابدأ مجاناً
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                شاهد العرض التوضيحي
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center lg:justify-end gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">آمن ومشفر</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">+10,000 مستخدم</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Diviso App"
                className="rounded-2xl shadow-elevated w-full max-w-lg mx-auto"
              />
            </div>
            
            {/* Floating cards */}
            <Card className="absolute -top-4 -right-4 p-4 bg-gradient-card shadow-card max-w-48">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">مصروف رحلة</p>
                  <p className="text-xs text-muted-foreground">1,200 ريال</p>
                </div>
              </div>
            </Card>

            <Card className="absolute -bottom-4 -left-4 p-4 bg-gradient-card shadow-card max-w-48">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">توفير 30%</p>
                  <p className="text-xs text-muted-foreground">هذا الشهر</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calculator, 
  Brain, 
  PieChart, 
  Smartphone, 
  Shield,
  Camera,
  MessageCircle,
  Gift,
  CreditCard
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "إدارة المجموعات",
    description: "أنشئ مجموعات للرحلات، السكن المشترك، أو المشاريع وادع الأعضاء بسهولة"
  },
  {
    icon: Calculator,
    title: "تقسيم ذكي",
    description: "قسّم المصاريف بالتساوي، بنسب محددة، أو مبالغ مخصصة حسب احتياجاتك"
  },
  {
    icon: Brain,
    title: "ذكاء اصطناعي",
    description: "تحليل الإيصالات تلقائياً واقتراح الفئات المناسبة للمصاريف"
  },
  {
    icon: Camera,
    title: "مسح الإيصالات",
    description: "تقنية OCR متقدمة لاستخراج تفاصيل المصاريف من صور الإيصالات"
  },
  {
    icon: PieChart,
    title: "تقارير وتحليلات",
    description: "تتبع الإنفاق وتحليل الميزانية مع رؤى مالية ذكية"
  },
  {
    icon: MessageCircle,
    title: "دردشة المجموعة",
    description: "تواصل مع أعضاء المجموعة ومناقشة المصاريف داخل التطبيق"
  },
  {
    icon: Gift,
    title: "برنامج الإحالة",
    description: "احصل على أيام مجانية من الاشتراك مقابل كل صديق تدعوه"
  },
  {
    icon: Shield,
    title: "الأمان والخصوصية",
    description: "تشفير البيانات ونظام مصادقة آمن لحماية معلوماتك المالية"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            مزايا تجعل إدارة المصاريف
            <span className="bg-gradient-primary bg-clip-text text-transparent"> أسهل من أي وقت مضى</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            استمتع بمجموعة شاملة من الأدوات الذكية التي تساعدك على إدارة أموالك بكفاءة
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">جاهز للبدء؟</h3>
            <p className="text-blue-100 mb-6">
              انضم إلى آلاف المستخدمين الذين يديرون مصاريفهم بذكاء
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                ابدأ مجاناً
              </button>
              <button className="border border-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                تحميل التطبيق
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
import { Header } from "@/components/Header";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="الأسعار والباقات"
        description="اختر الباقة المناسبة لك في Diviso. باقة مجانية وباقات مدفوعة للأفراد والعائلات مع مميزات متقدمة لإدارة المصاريف المشتركة."
        canonical="https://diviso.app/pricing"
      />
      <Header />
      <main className="pt-20">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
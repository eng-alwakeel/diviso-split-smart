import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { InstallWidget } from "@/components/pwa/InstallWidget";
import { ShareInstallButton } from "@/components/pwa/ShareInstallButton";
import { Download } from "lucide-react";

const Install = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="ثبّت Diviso على جوالك"
        description="قسّم المصاريف مع أصحابك بسهولة، وافتح التطبيق مباشرة من شاشة الجوال."
        ogImage="https://diviso.app/og/install-1200x630.png"
      />
      <Header />

      <main className="page-container">
        <section className="text-center py-12 md:py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ثبّت Diviso على جهازك
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            ثبّت التطبيق عشان تفتحه بسرعة من الشاشة الرئيسية، بدون ما تفتح المتصفح كل مرة.
          </p>

          <div className="max-w-md mx-auto space-y-3">
            <InstallWidget where="home" />
            <ShareInstallButton />
            <p className="text-xs text-muted-foreground">
              أرسل الرابط لشخص ثاني أو افتحه على جهازك الثاني.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-2xl mx-auto pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: "⚡", title: "أسرع", desc: "يفتح فوري بدون تحميل" },
              { emoji: "📱", title: "مثل التطبيق", desc: "شاشة كاملة بدون شريط المتصفح" },
              { emoji: "🔔", title: "إشعارات", desc: "تصلك تنبيهات المصاريف" },
            ].map((item) => (
              <div key={item.title} className="unified-card p-4 text-center">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Install;

import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { InstallWidget } from "@/components/pwa/InstallWidget";
import { ShareInstallButton } from "@/components/pwa/ShareInstallButton";
import { Download } from "lucide-react";

const Install = () => {
  const { t } = useTranslation("install");

  const benefits = [
    { emoji: "⚡", title: t("page.benefits.faster"), desc: t("page.benefits.fasterDesc") },
    { emoji: "📱", title: t("page.benefits.appLike"), desc: t("page.benefits.appLikeDesc") },
    { emoji: "🔔", title: t("page.benefits.notifications"), desc: t("page.benefits.notificationsDesc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("page.seoTitle")}
        description={t("page.seoDescription")}
        ogImage="https://diviso.app/og/install-1200x630.png"
      />
      <Header />

      <main className="page-container">
        <section className="text-center py-12 md:py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("page.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            {t("page.subtitle")}
          </p>

          <div className="max-w-md mx-auto space-y-3">
            <InstallWidget where="home" />
            <ShareInstallButton />
            <p className="text-xs text-muted-foreground">
              {t("page.shareHint")}
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-2xl mx-auto pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {benefits.map((item) => (
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

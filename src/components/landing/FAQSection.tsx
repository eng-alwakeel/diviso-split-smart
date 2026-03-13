import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    q: "كيف يعمل تطبيق Diviso؟",
    qEn: "How does Diviso work?",
    a: "أنشئ مجموعة، أضف أصدقائك، وسجل المصاريف. التطبيق يحسب تلقائياً من يدين لمن ويرسل تذكيرات للتسوية.",
    aEn: "Create a group, add your friends, and log expenses. The app automatically calculates who owes whom and sends settlement reminders.",
  },
  {
    q: "هل تطبيق Diviso مجاني؟",
    qEn: "Is Diviso free?",
    a: "نعم! Diviso مجاني بالكامل مع ميزات أساسية قوية. الخطة المدفوعة تضيف مزايا متقدمة مثل التقارير المفصلة ومجموعات غير محدودة.",
    aEn: "Yes! Diviso is completely free with powerful basic features. The paid plan adds advanced features like detailed reports and unlimited groups.",
  },
  {
    q: "هل يدعم Diviso الريال السعودي والعملات الأخرى؟",
    qEn: "Does Diviso support Saudi Riyal and other currencies?",
    a: "نعم، الريال السعودي هو العملة الافتراضية مع دعم أكثر من 50 عملة أخرى وتحويل تلقائي بين العملات.",
    aEn: "Yes, Saudi Riyal is the default currency with support for 50+ other currencies and automatic conversion between them.",
  },
  {
    q: "كيف أدعو أصدقائي للمجموعة؟",
    qEn: "How do I invite friends to a group?",
    a: "شارك رابط الدعوة عبر واتساب أو أي تطبيق، أو استخدم رمز QR. ما يحتاجون تحميل تطبيق — يعمل من المتصفح مباشرة.",
    aEn: "Share the invite link via WhatsApp or any app, or use a QR code. They don't need to download an app — it works directly from the browser.",
  },
  {
    q: "هل بياناتي آمنة في Diviso؟",
    qEn: "Is my data safe in Diviso?",
    a: "نعم، نستخدم تشفير متقدم وخوادم آمنة. بياناتك المالية محمية ولا نشاركها مع أي طرف ثالث.",
    aEn: "Yes, we use advanced encryption and secure servers. Your financial data is protected and never shared with third parties.",
  },
  {
    q: "هل يعمل Diviso بدون إنترنت؟",
    qEn: "Does Diviso work offline?",
    a: "نعم! Diviso تطبيق ويب تقدمي (PWA) يعمل بدون إنترنت. سجل مصاريفك وستتزامن تلقائياً عند عودة الاتصال.",
    aEn: "Yes! Diviso is a Progressive Web App (PWA) that works offline. Log expenses and they'll sync automatically when you're back online.",
  },
];

export const FAQSection = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          {isRTL ? "أسئلة شائعة" : "Frequently Asked Questions"}
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-lg">
          {isRTL
            ? "كل اللي تحتاج تعرفه عن Diviso"
            : "Everything you need to know about Diviso"}
        </p>

        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card rounded-lg border px-4"
            >
              <AccordionTrigger className="text-base md:text-lg font-medium hover:no-underline">
                {isRTL ? item.q : item.qEn}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                {isRTL ? item.a : item.aEn}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
};

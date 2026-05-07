import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

/**
 * صفحة مخطط الأسعار والاشتراكات الكامل
 * - عرض كامل لكل الخطط، الباقات، تكلفة كل عملية، ومصادر النقاط المجانية
 * - زر لتصدير المخطط إلى ملف PDF (عبر html2canvas + jsPDF)
 * - كل الأسعار شاملة ضريبة القيمة المضافة (15%)
 */

const plans = [
  {
    name: "مجاني",
    price: "0",
    monthlyCredits: "50 ترحيب + 5/يوم",
    featured: false,
    perks: ["إنشاء مجموعة واحدة", "إضافة نفقات أساسية", "تتبع التسويات"],
  },
  {
    name: "Starter",
    price: "19",
    monthlyCredits: "70",
    featured: false,
    perks: ["مجموعات غير محدودة", "نفقات غير محدودة", "تصدير محدود"],
  },
  {
    name: "Pro",
    price: "29",
    monthlyCredits: "90",
    featured: false,
    perks: ["مسح OCR للفواتير", "تصنيف ذكي", "إشعارات SMS"],
  },
  {
    name: "Max",
    price: "39",
    monthlyCredits: "260",
    featured: true,
    perks: ["كل مزايا Pro", "تقارير مفصلة", "أولوية الدعم", "أعلى رصيد شهري"],
  },
];

const packages = [
  { name: "صغيرة", price: "25", points: "90", validity: "30 يوم" },
  { name: "متوسطة", price: "49", points: "200", validity: "60 يوم" },
  { name: "كبيرة", price: "99", points: "450", validity: "90 يوم" },
];

const operationCosts: { cost: number; items: string[] }[] = [
  { cost: 0, items: ["تقسيم نفقة", "عرض البيانات", "الانضمام لمجموعة"] },
  {
    cost: 1,
    items: [
      "إضافة نفقة",
      "تعديل نفقة",
      "حذف نفقة",
      "مسح OCR للفاتورة",
      "تصنيف ذكي",
      "دعوة عضو",
      "تذكير دفع",
    ],
  },
  { cost: 2, items: ["حذف مجموعة", "إرسال SMS", "إنشاء ميزانية"] },
  {
    cost: 3,
    items: ["تأكيد تسوية", "اقتراح ميزانية ذكي", "إنشاء خطة سفر"],
  },
  { cost: 5, items: ["إنشاء مجموعة", "مخطط رحلة كامل"] },
];

const freeSources = [
  { label: "هدية الترحيب", value: "50 نقطة (صلاحية 7 أيام)" },
  { label: "تسجيل دخول يومي", value: "5 نقاط/يوم" },
  { label: "برنامج المؤسسين", value: "100 عند التسجيل + 50 شهرياً" },
  { label: "إكمال المهام", value: "حتى 70 نقطة" },
  { label: "مكافأة 7 أيام نشاط", value: "20 نقطة" },
  { label: "مشاهدة إعلان مكافأة", value: "5 نقاط" },
  { label: "دعوة صديق", value: "10 → 60 نقطة (تدريجي)" },
];

export default function PricingChart() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("Diviso-Pricing-Chart.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEO
        title="مخطط الأسعار والاشتراكات | Diviso"
        description="مخطط شامل لخطط الاشتراك، باقات النقاط، تكلفة العمليات، ومصادر النقاط المجانية في تطبيق Diviso."
      />

      {/* شريط الإجراءات */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تصدير PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* المحتوى المُصدَّر — ألوان Hex فقط لضمان عمل html2canvas */}
      <div
        ref={ref}
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          padding: "32px",
          fontFamily: "Tajawal, system-ui, sans-serif",
          direction: "rtl",
        }}
        className="container max-w-5xl mx-auto"
      >
        {/* العنوان */}
        <header style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
            }}
          >
            مخطط الأسعار والاشتراكات الكامل
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>
            Diviso — جميع الأسعار شاملة ضريبة القيمة المضافة 15% • بوابة الدفع: نيوليب
          </p>
        </header>

        {/* خطط الاشتراك */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              borderRight: "4px solid #C8F169",
              paddingRight: "12px",
              marginBottom: "16px",
            }}
          >
            خطط الاشتراك الشهرية
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            {plans.map((p) => (
              <div
                key={p.name}
                style={{
                  border: p.featured
                    ? "2px solid #C8F169"
                    : "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: p.featured ? "#fafff0" : "#ffffff",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    marginBottom: "4px",
                  }}
                >
                  {p.name}
                  {p.featured && (
                    <span
                      style={{
                        marginRight: "6px",
                        fontSize: "10px",
                        backgroundColor: "#C8F169",
                        color: "#0f172a",
                        padding: "2px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      الأفضل
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800 }}>
                  {p.price} <span style={{ fontSize: "12px" }}>ر.س/شهر</span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginTop: "4px",
                  }}
                >
                  نقاط: {p.monthlyCredits}
                </div>
                <ul
                  style={{
                    marginTop: "10px",
                    paddingRight: "16px",
                    fontSize: "12px",
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  {p.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* باقات النقاط */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              borderRight: "4px solid #C8F169",
              paddingRight: "12px",
              marginBottom: "16px",
            }}
          >
            باقات النقاط (شراء لمرة واحدة)
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={th}>الباقة</th>
                <th style={th}>السعر</th>
                <th style={th}>النقاط</th>
                <th style={th}>الصلاحية</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.name}>
                  <td style={td}>{pkg.name}</td>
                  <td style={td}>{pkg.price} ر.س</td>
                  <td style={td}>{pkg.points} نقطة</td>
                  <td style={td}>{pkg.validity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            style={{
              fontSize: "11px",
              color: "#64748b",
              marginTop: "8px",
            }}
          >
            الاستهلاك بنظام FEFO (الأقرب انتهاءً يُستخدم أولاً).
          </p>
        </section>

        {/* تكلفة العمليات */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              borderRight: "4px solid #C8F169",
              paddingRight: "12px",
              marginBottom: "16px",
            }}
          >
            تكلفة كل عملية بالنقاط
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {operationCosts.map((row) => (
              <div
                key={row.cost}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    minWidth: "60px",
                    backgroundColor: row.cost === 0 ? "#dcfce7" : "#fef3c7",
                    color: "#0f172a",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: "6px",
                    borderRadius: "6px",
                  }}
                >
                  {row.cost === 0 ? "مجاناً" : `${row.cost} نقطة`}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.8 }}>
                  {row.items.join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* مصادر النقاط المجانية */}
        <section style={{ marginBottom: "16px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              borderRight: "4px solid #C8F169",
              paddingRight: "12px",
              marginBottom: "16px",
            }}
          >
            كيف تحصل على نقاط مجانية؟
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <tbody>
              {freeSources.map((s) => (
                <tr key={s.label}>
                  <td style={{ ...td, fontWeight: 600, width: "40%" }}>
                    {s.label}
                  </td>
                  <td style={td}>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer
          style={{
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0",
            fontSize: "11px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          منشأة تكامل البناء — Diviso © {new Date().getFullYear()} • للاستفسار:
          support@diviso.app
        </footer>
      </div>

      {/* أزرار سفلية للجوال */}
      <div className="container max-w-5xl mx-auto px-4 py-6 hidden md:block" />
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "10px 12px",
  borderBottom: "2px solid #e2e8f0",
  fontWeight: 700,
  fontSize: "13px",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
};

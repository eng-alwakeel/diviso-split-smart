import { PwaInstallPrompt } from "./PwaInstallPrompt";

type InstallLocation = "home" | "faq" | "settings" | "appHome";

const COPY: Record<InstallLocation, { title: string; subtitle: string; variant: "primary" | "ghost" }> = {
  home: {
    title: "ثبّت Diviso — أسرع لك",
    subtitle: "ثبّت التطبيق عشان تفتح مجموعاتك بسرعة مثل أي تطبيق.",
    variant: "primary",
  },
  faq: {
    title: "كيف أثبّت Diviso؟",
    subtitle: "تثبيت التطبيق يسهّل الوصول ويعطي تجربة أفضل على الجوال.",
    variant: "primary",
  },
  settings: {
    title: "تثبيت التطبيق",
    subtitle: "إذا ما ثبتته، تقدر تثبته الآن بنقرة.",
    variant: "ghost",
  },
  appHome: {
    title: "ثبّت Diviso لجلسات أسرع",
    subtitle: "راح يفتح أسرع، ويصير كأنه تطبيق على جهازك.",
    variant: "primary",
  },
};

interface InstallWidgetProps {
  where: InstallLocation;
}

export function InstallWidget({ where }: InstallWidgetProps) {
  const { title, subtitle, variant } = COPY[where];

  return (
    <PwaInstallPrompt
      variant={variant}
      title={title}
      subtitle={subtitle}
    />
  );
}

import { useTranslation } from "react-i18next";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

type InstallLocation = "home" | "faq" | "settings" | "appHome";

const VARIANT: Record<InstallLocation, "primary" | "ghost"> = {
  home: "primary",
  faq: "primary",
  settings: "ghost",
  appHome: "primary",
};

interface InstallWidgetProps {
  where: InstallLocation;
}

export function InstallWidget({ where }: InstallWidgetProps) {
  const { t } = useTranslation("install");

  return (
    <PwaInstallPrompt
      variant={VARIANT[where]}
      title={t(`widget.${where}.title`)}
      subtitle={t(`widget.${where}.subtitle`)}
    />
  );
}

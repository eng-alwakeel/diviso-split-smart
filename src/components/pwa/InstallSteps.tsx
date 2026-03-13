import { useTranslation, Trans } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share, Plus, MoreVertical, Download } from "lucide-react";
import { useMemo } from "react";

function getDefaultTab(): "ios" | "android" {
  if (typeof navigator === "undefined") return "ios";
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ? "ios" : "android";
}

export function InstallSteps() {
  const { t } = useTranslation("install");
  const defaultTab = useMemo(() => getDefaultTab(), []);

  return (
    <section className="max-w-2xl mx-auto pb-16">
      <h2 className="text-xl font-bold text-foreground text-center mb-6">
        {t("steps.title")}
      </h2>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-center mb-4">
          <TabsTrigger value="ios" className="flex-1">
            🍎 {t("steps.iosTab")}
          </TabsTrigger>
          <TabsTrigger value="android" className="flex-1">
            🤖 {t("steps.androidTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ios">
          <div className="unified-card p-5 space-y-5">
            <p className="text-sm font-semibold text-foreground mb-2">{t("steps.iosTitle")}</p>

            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
              <div>
                <p className="font-medium text-foreground">
                  <Trans i18nKey="ios.step1Title" ns="install" components={{ bold: <span className="text-primary font-bold" /> }} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{t("ios.step1Desc")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{t("ios.step2")}</p>
                <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                  <Share className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("ios.step2Label")}</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">3</div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{t("ios.step3")}</p>
                <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                  <Plus className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("ios.step3Label")}</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">4</div>
              <p className="font-medium text-foreground">
                <Trans i18nKey="ios.step4" ns="install" components={{ bold: <span className="text-primary font-bold" /> }} />
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="android">
          <div className="unified-card p-5 space-y-5">
            <p className="text-sm font-semibold text-foreground mb-2">{t("steps.androidTitle")}</p>

            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
              <p className="font-medium text-foreground">{t("steps.android.step1")}</p>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{t("steps.android.step2")}</p>
                <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                  <MoreVertical className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">3</div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{t("steps.android.step3")}</p>
                <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("steps.android.step3Label")}</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">4</div>
              <p className="font-medium text-foreground">{t("steps.android.step4")} 🎉</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

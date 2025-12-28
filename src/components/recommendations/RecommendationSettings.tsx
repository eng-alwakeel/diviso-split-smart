import { useTranslation } from "react-i18next";
import { Sparkles, Bell, Utensils, Hotel, Coffee, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useRecommendationSettings } from "@/hooks/useRecommendationSettings";

const categoryOptions = [
  { id: "food", icon: Utensils, labelKey: "categories.food" },
  { id: "accommodation", icon: Hotel, labelKey: "categories.accommodation" },
  { id: "cafe", icon: Coffee, labelKey: "categories.cafe" },
  { id: "shopping", icon: ShoppingBag, labelKey: "categories.shopping" },
];

export function RecommendationSettings() {
  const { t } = useTranslation("recommendations");
  const { 
    settings, 
    isLoading, 
    updateEnabled,
    updateMaxPerDay,
    updatePreferredCategories,
    updateMealTimeAlerts,
  } = useRecommendationSettings();

  if (isLoading) {
    return (
      <Card className="unified-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const currentCategories = settings?.preferred_categories || [];
    const newCategories = checked
      ? [...currentCategories, categoryId]
      : currentCategories.filter((c: string) => c !== categoryId);
    updatePreferredCategories(newCategories);
  };

  return (
    <Card className="unified-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>{t("settings.title")}</CardTitle>
        </div>
        <CardDescription>{t("settings.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable Recommendations */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="recommendations-enabled" className="text-base">
              {t("settings.enabled")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.enabled_description")}
            </p>
          </div>
          <Switch
            id="recommendations-enabled"
            checked={settings?.enabled ?? true}
            onCheckedChange={updateEnabled}
          />
        </div>

        <Separator />

        {/* Meal Time Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="meal-alerts" className="text-base">
                {t("settings.meal_time_alerts")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.meal_time_alerts_description")}
              </p>
            </div>
          </div>
          <Switch
            id="meal-alerts"
            checked={settings?.enabled ?? true}
            onCheckedChange={updateMealTimeAlerts}
            disabled={!settings?.enabled}
          />
        </div>

        <Separator />

        {/* Max Recommendations Per Day */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t("settings.max_per_day")}</Label>
            <span className="text-sm font-medium text-primary">
              {settings?.max_per_day ?? 5}
            </span>
          </div>
          <Slider
            value={[settings?.max_per_day ?? 5]}
            onValueChange={(value) => updateMaxPerDay(value[0])}
            min={1}
            max={10}
            step={1}
            disabled={!settings?.enabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {t("settings.max_per_day_description")}
          </p>
        </div>

        <Separator />

        {/* Preferred Categories */}
        <div className="space-y-4">
          <Label className="text-base">{t("settings.categories")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("settings.categories_description")}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {categoryOptions.map((category) => {
              const Icon = category.icon;
              const isChecked = settings?.preferred_categories?.includes(category.id) ?? true;
              
              return (
                <label
                  key={category.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border/50 bg-card/50 hover:border-border"
                  } ${!settings?.enabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      handleCategoryToggle(category.id, checked as boolean)
                    }
                    disabled={!settings?.enabled}
                  />
                  <Icon className={`h-4 w-4 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${isChecked ? "text-foreground" : "text-muted-foreground"}`}>
                    {t(category.labelKey)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

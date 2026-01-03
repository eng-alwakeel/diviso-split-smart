import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Layers, MapPin, Handshake, Tag, DollarSign } from "lucide-react";
import { MonetizationDashboard } from "./MonetizationDashboard";
import { AdTypesManager } from "./AdTypesManager";
import { PlacementsManager } from "./PlacementsManager";
import { AffiliatePartnersManager } from "./AffiliatePartnersManager";
import { OffersManager } from "./OffersManager";
import { AdAnalyticsDashboard } from "./AdAnalyticsDashboard";

export function MonetizationCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">مركز الإيرادات</h2>
        <p className="text-muted-foreground">إدارة الإعلانات والشركاء والعروض</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1 py-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">الإيرادات</span>
          </TabsTrigger>
          <TabsTrigger value="ad-types" className="flex items-center gap-1 py-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">أنواع الإعلانات</span>
          </TabsTrigger>
          <TabsTrigger value="placements" className="flex items-center gap-1 py-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">أماكن الظهور</span>
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-1 py-2">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">الشركاء</span>
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-1 py-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">العروض</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">الإحصاءات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MonetizationDashboard />
        </TabsContent>

        <TabsContent value="ad-types">
          <AdTypesManager />
        </TabsContent>

        <TabsContent value="placements">
          <PlacementsManager />
        </TabsContent>

        <TabsContent value="partners">
          <AffiliatePartnersManager />
        </TabsContent>

        <TabsContent value="offers">
          <OffersManager />
        </TabsContent>

        <TabsContent value="analytics">
          <AdAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

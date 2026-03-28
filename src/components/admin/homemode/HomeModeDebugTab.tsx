import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, SlidersHorizontal, BookOpen, Layout } from "lucide-react";
import { UserModeInspector } from "./UserModeInspector";
import { ModeSimulator } from "./ModeSimulator";
import { ModeRulesViewer } from "./ModeRulesViewer";
import { UIMappingViewer } from "./UIMappingViewer";

export function HomeModeDebugTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Home Mode Engine — أدوات التصحيح</h2>
        <p className="text-sm text-muted-foreground">فحص ومحاكاة وتوثيق أوضاع الصفحة الرئيسية</p>
      </div>

      <Tabs defaultValue="inspector" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inspector" className="flex items-center gap-1 text-xs">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">فحص مستخدم</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">محاكاة</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">القواعد</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-1 text-xs">
            <Layout className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">الربط البصري</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inspector">
          <UserModeInspector />
        </TabsContent>
        <TabsContent value="simulator">
          <ModeSimulator />
        </TabsContent>
        <TabsContent value="rules">
          <ModeRulesViewer />
        </TabsContent>
        <TabsContent value="mapping">
          <UIMappingViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { Plus, Search, Users, TrendingUp, CreditCard, Settings, Archive, MoreVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGroups } from "@/hooks/useGroups";
import { useGroupArchive } from "@/hooks/useGroupArchive";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const { data: groups = [], isLoading, error } = useGroups(activeTab === "archived");
  const { archiveGroup, unarchiveGroup } = useGroupArchive();
  const navigate = useNavigate();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGroups = groups.length;
  const adminGroups = groups.filter(g => g.member_role === 'admin' || g.member_role === 'owner').length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-md mx-auto px-4 pt-4 pb-20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">مجموعاتي</h1>
            <p className="text-muted-foreground text-sm">إدارة وعرض جميع مجموعاتك</p>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              حدث خطأ في تحميل المجموعات. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container max-w-md mx-auto px-4 pt-4 pb-20 space-y-6">
        {/* عنوان الصفحة */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">مجموعاتي</h1>
          <p className="text-muted-foreground text-sm">إدارة وعرض جميع مجموعاتك</p>
        </div>
        {/* إحصائيات عامة */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-primary">{totalGroups}</div>
              <div className="text-xs text-muted-foreground">المجموعات</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-secondary">{adminGroups}</div>
              <div className="text-xs text-muted-foreground">أديرها</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-accent">{totalMembers}</div>
              <div className="text-xs text-muted-foreground">الأعضاء</div>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في المجموعات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* زر إنشاء مجموعة جديدة */}
        <Button 
          onClick={() => navigate("/create-group")}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 ml-2" />
          إنشاء مجموعة جديدة
        </Button>

        {/* قائمة المجموعات */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">النشطة</TabsTrigger>
            <TabsTrigger value="archived">المؤرشفة</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'active' ? 'المجموعات النشطة' : 'المجموعات المؤرشفة'} ({filteredGroups.length})
            </h2>
          
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredGroups.length === 0 ? (
            searchQuery ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد مجموعات تطابق البحث</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">لا توجد مجموعات بعد</p>
                  <Button onClick={() => navigate("/create-group")}>
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء أول مجموعة
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            filteredGroups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                onNavigate={navigate}
                onArchive={activeTab === 'active' ? archiveGroup : unarchiveGroup}
                isArchived={activeTab === 'archived'}
              />
            ))
          )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    currency: string;
    member_role?: string;
    member_count?: number;
    created_at: string;
  };
  onNavigate: (path: string) => void;
  onArchive: (groupId: string) => void;
  isArchived?: boolean;
}

function GroupCard({ group, onNavigate, onArchive, isArchived }: GroupCardProps) {
  const isAdmin = group.member_role === 'admin' || group.member_role === 'owner';
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle 
              className="text-base leading-tight cursor-pointer hover:text-primary transition-colors"
              onClick={() => onNavigate(`/group/${group.id}`)}
            >
              {group.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3" />
              {group.member_count || 0} عضو
              <span className="text-muted-foreground">•</span>
              {group.currency}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {isAdmin && (
              <Badge variant="secondary" className="text-xs">
                مدير
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate(`/group/${group.id}`)}
            className="flex-1"
          >
            <TrendingUp className="h-3 w-3 ml-1" />
            عرض
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate(`/add-expense?group=${group.id}`)}
            className="flex-1"
          >
            <CreditCard className="h-3 w-3 ml-1" />
            مصروف
          </Button>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onNavigate(`/group/${group.id}?tab=settings`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(group.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchived ? 'استعادة' : 'أرشف'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
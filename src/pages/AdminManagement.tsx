import { useState } from "react";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, ShieldCheck, User } from "lucide-react";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

export default function AdminManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, name, is_admin, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_user_admin", {
        p_user_id: userId,
        p_is_admin: isAdmin,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث صلاحيات المستخدم بنجاح",
      });
    },
    onError: (error) => {
      console.error("Admin toggle error:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الصلاحيات",
        variant: "destructive",
      });
    },
  });

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    toggleAdminMutation.mutate({
      userId,
      isAdmin: !currentIsAdmin,
    });
  };

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminProtectedRoute>
      <SEO title="إدارة المديرين" noIndex={true} />
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">إدارة المديرين</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إدارة صلاحيات المستخدمين
              </CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المستخدمين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {user.is_admin ? (
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-foreground">
                              {user.display_name || user.name || "مستخدم غير مسمى"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {user.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={user.is_admin ? "default" : "secondary"}>
                          {user.is_admin ? "مدير" : "مستخدم عادي"}
                        </Badge>
                        <Button
                          variant={user.is_admin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={toggleAdminMutation.isPending}
                        >
                          {user.is_admin ? "إزالة الصلاحيات" : "منح صلاحيات المدير"}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredUsers?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد مستخدمين مطابقين للبحث
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useAdminUserActions as useAdminGroupActions } from "@/hooks/useEnhancedAdminStats";
import { useUsersWithRoles, ROLE_LABELS } from "@/hooks/useRBAC";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRolesDialog } from "./UserRolesDialog";
import { UserActionsDropdown } from "./UserActionsDropdown";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface User {
  id: string;
  display_name: string | null;
  name: string | null;
  phone: string | null;
  email?: string | null;
  created_at: string;
  is_admin: boolean;
  is_banned?: boolean;
  current_plan: string;
  groups_count: number;
  expenses_count: number;
}

interface Group {
  id: string;
  name: string;
  currency: string;
  owner_name: string;
  created_at: string;
  members_count: number;
  expenses_count: number;
  total_amount: number;
}

interface AdminManagementTablesProps {
  users: User[];
  groups: Group[];
}

export const AdminManagementTables = ({ users, groups }: AdminManagementTablesProps) => {
  const [usersPage, setUsersPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [groupsPerPage, setGroupsPerPage] = useState(10);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  
  const { deleteGroup } = useAdminGroupActions();
  const { data: usersWithRoles } = useUsersWithRoles();
  const queryClient = useQueryClient();

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      free: { variant: "secondary", label: "مجاني" },
      personal: { variant: "default", label: "شخصي" },
      family: { variant: "default", label: "عائلي" },
      lifetime: { variant: "destructive", label: "مدى الحياة" }
    };
    const config = variants[plan] || { variant: "secondary", label: plan };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleOpenRolesDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setRolesDialogOpen(true);
  };

  const getUserRoles = (userId: string): AppRole[] => {
    return usersWithRoles?.get(userId) || [];
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${groupName}"؟`)) return;
    try {
      await deleteGroup(groupId);
      toast.success("تم حذف المجموعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
    } catch (error: any) {
      toast.error("خطأ في حذف المجموعة", { description: error.message });
    }
  };

  const totalUsersPages = Math.ceil(users.length / usersPerPage);
  const totalGroupsPages = Math.ceil(groups.length / groupsPerPage);
  const paginatedUsers = users.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);
  const paginatedGroups = groups.slice((groupsPage - 1) * groupsPerPage, groupsPage * groupsPerPage);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => currentPage > 1 && setPage(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
          </PaginationItem>
          {startPage > 1 && (
            <>
              <PaginationItem><PaginationLink onClick={() => setPage(1)} className="cursor-pointer">1</PaginationLink></PaginationItem>
              {startPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
            </>
          )}
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
            <PaginationItem key={page}><PaginationLink onClick={() => setPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
              <PaginationItem><PaginationLink onClick={() => setPage(totalPages)} className="cursor-pointer">{totalPages}</PaginationLink></PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext onClick={() => currentPage < totalPages && setPage(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">👥 إدارة المستخدمين <Badge variant="secondary">{users.length}</Badge></CardTitle>
          <Select value={usersPerPage.toString()} onValueChange={(v) => { setUsersPerPage(Number(v)); setUsersPage(1); }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / صفحة</SelectItem>
              <SelectItem value="25">25 / صفحة</SelectItem>
              <SelectItem value="50">50 / صفحة</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الإيميل</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>المجموعات</TableHead>
                  <TableHead>المصروفات</TableHead>
                  <TableHead>التسجيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const userRoles = getUserRoles(user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.display_name || user.name || "مستخدم"}
                          {user.is_admin && <Badge variant="destructive" className="text-xs">مدير</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive" className="text-xs">محظور</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.phone || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate" title={user.email || "-"}>{user.email || "-"}</TableCell>
                      <TableCell>{getPlanBadge(user.current_plan)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRoles.length > 0 ? userRoles.slice(0, 2).map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">{ROLE_LABELS[role]}</Badge>
                          )) : <span className="text-muted-foreground text-xs">-</span>}
                          {userRoles.length > 2 && <Badge variant="secondary" className="text-xs">+{userRoles.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{user.groups_count}</TableCell>
                      <TableCell>{user.expenses_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ar })}</TableCell>
                      <TableCell>
                        <UserActionsDropdown 
                          user={user} 
                          onOpenRolesDialog={handleOpenRolesDialog}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalUsersPages > 1 && <div className="flex justify-center pt-4">{renderPagination(usersPage, totalUsersPages, setUsersPage)}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">🏢 إدارة المجموعات <Badge variant="secondary">{groups.length}</Badge></CardTitle>
          <Select value={groupsPerPage.toString()} onValueChange={(v) => { setGroupsPerPage(Number(v)); setGroupsPage(1); }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / صفحة</SelectItem>
              <SelectItem value="25">25 / صفحة</SelectItem>
              <SelectItem value="50">50 / صفحة</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المجموعة</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>الأعضاء</TableHead>
                  <TableHead>المصروفات</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">{group.owner_name}</TableCell>
                    <TableCell>{group.members_count}</TableCell>
                    <TableCell>{group.expenses_count}</TableCell>
                    <TableCell className="text-green-600 font-medium">{Number(group.total_amount).toLocaleString()} {group.currency}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(group.created_at), { addSuffix: true, locale: ar })}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id, group.name)} className="gap-2">
                        <Trash2 className="w-4 h-4" />حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalGroupsPages > 1 && <div className="flex justify-center pt-4">{renderPagination(groupsPage, totalGroupsPages, setGroupsPage)}</div>}
        </CardContent>
      </Card>

      {selectedUserId && (
        <UserRolesDialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen} userId={selectedUserId} userName={selectedUserName} />
      )}
    </div>
  );
};
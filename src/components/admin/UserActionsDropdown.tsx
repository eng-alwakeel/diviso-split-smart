import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Shield, Plus, Minus, Ban, UserCheck, Trash2 } from "lucide-react";
import { EditUserProfileDialog } from "./EditUserProfileDialog";
import { ManageCreditsDialog } from "./ManageCreditsDialog";
import { BanUserDialog } from "./BanUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

interface User {
  id: string;
  display_name: string | null;
  name: string | null;
  phone: string | null;
  is_banned?: boolean;
}

interface UserActionsDropdownProps {
  user: User;
  onOpenRolesDialog: (userId: string, userName: string) => void;
}

export function UserActionsDropdown({ user, onOpenRolesDialog }: UserActionsDropdownProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [grantCreditsOpen, setGrantCreditsOpen] = useState(false);
  const [deductCreditsOpen, setDeductCreditsOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const userName = user.display_name || user.name || "مستخدم";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل البيانات
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenRolesDialog(user.id, userName)}>
            <Shield className="ml-2 h-4 w-4" />
            إدارة الأدوار
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setGrantCreditsOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            منح نقاط
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeductCreditsOpen(true)}>
            <Minus className="ml-2 h-4 w-4" />
            سحب نقاط
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.is_banned ? (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)} className="text-green-600">
              <UserCheck className="ml-2 h-4 w-4" />
              إلغاء الحظر
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)} className="text-orange-600">
              <Ban className="ml-2 h-4 w-4" />
              حظر المستخدم
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="ml-2 h-4 w-4" />
            حذف المستخدم
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
      />
      <ManageCreditsDialog
        open={grantCreditsOpen}
        onOpenChange={setGrantCreditsOpen}
        userId={user.id}
        userName={userName}
        operation="grant"
      />
      <ManageCreditsDialog
        open={deductCreditsOpen}
        onOpenChange={setDeductCreditsOpen}
        userId={user.id}
        userName={userName}
        operation="deduct"
      />
      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        userId={user.id}
        userName={userName}
        isBanned={user.is_banned || false}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userId={user.id}
        userName={userName}
      />
    </>
  );
}

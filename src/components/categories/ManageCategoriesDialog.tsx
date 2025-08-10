
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Pencil, Save, Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
};

export const ManageCategoriesDialog = ({ open, onOpenChange, currentUserId }: Props) => {
  const { categories, addCategory, updateCategory, isLoading } = useCategories();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!open) {
      setNewName("");
      setEditingId(null);
      setEditingName("");
    }
  }, [open]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await addCategory(name);
    toast({ title: "تمت الإضافة", description: "تمت إضافة الفئة بنجاح" });
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSave = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    await updateCategory({ id: editingId, name });
    toast({ title: "تم التعديل", description: "تم تحديث اسم الفئة" });
    setEditingId(null);
    setEditingName("");
  };

  const isOwned = (created_by: string | null) =>
    !!currentUserId && !!created_by && created_by === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">إدارة الفئات</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-cat">إضافة فئة جديدة</Label>
              <Input
                id="new-cat"
                placeholder="اسم الفئة"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 bg-background/50 border-border"
              />
            </div>
            <Button onClick={handleAdd} className="mt-6" disabled={!newName.trim()}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border border-border/50 p-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground px-1">جاري التحميل…</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">لا توجد فئات بعد</p>
            ) : (
              categories.map((cat) => {
                const canEdit = isOwned(cat.created_by);
                const isEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2",
                      "bg-muted/40"
                    )}
                  >
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-background/50 border-border"
                          autoFocus
                        />
                      ) : (
                        <span className="text-foreground">{cat.name_ar}</span>
                      )}
                      {!canEdit && (
                        <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 ml-1" />
                          افتراضية
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && !isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(cat.id, cat.name_ar)}
                        >
                          <Pencil className="w-4 h-4 ml-2" />
                          تعديل
                        </Button>
                      )}
                      {canEdit && isEditing && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                          disabled={!editingName.trim()}
                        >
                          <Save className="w-4 h-4 ml-2" />
                          حفظ
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Share, Plus, X } from "lucide-react";

interface IosInstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IosInstallSheet({ open, onOpenChange }: IosInstallSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader className="text-center">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-foreground">
              تثبيت Diviso على الآيفون
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-5">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">
                افتح الموقع من <span className="text-primary font-bold">Safari</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                إذا كنت داخل واتساب أو إنستغرام، اضغط "Open in Safari" أولاً.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              2
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">اضغط زر</p>
              <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                <Share className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">المشاركة</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              3
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">اختر</p>
              <div className="inline-flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                <Plus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Add to Home Screen</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              4
            </div>
            <p className="font-medium text-foreground">
              اضغط <span className="text-primary font-bold">Add</span> وخلاص! 🎉
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onOpenChange(false)}
          >
            فهمت، شكراً
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

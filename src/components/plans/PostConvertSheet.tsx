import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UserPlus, Receipt, ArrowUpRight } from "lucide-react";

interface PostConvertSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onInvite: () => void;
}

export function PostConvertSheet({ open, onOpenChange, groupId, onInvite }: PostConvertSheetProps) {
  const { t } = useTranslation('plans');
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-xl">{t('post_convert.success_title')}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t('post_convert.whats_next')}</p>
        </SheetHeader>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-base"
            onClick={() => {
              onOpenChange(false);
              onInvite();
            }}
          >
            <UserPlus className="w-5 h-5 text-primary" />
            {t('post_convert.invite_members')}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-base"
            onClick={() => {
              onOpenChange(false);
              navigate(`/add-expense?groupId=${groupId}`);
            }}
          >
            <Receipt className="w-5 h-5 text-primary" />
            {t('post_convert.add_first_expense')}
          </Button>

          <Button
            className="w-full justify-start gap-3 h-14 text-base"
            onClick={() => {
              onOpenChange(false);
              navigate(`/group/${groupId}`);
            }}
          >
            <ArrowUpRight className="w-5 h-5" />
            {t('post_convert.open_group')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Play, CheckCircle2, Link, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartCtaBarProps {
  status: string;
  groupId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isReady: boolean;
  missingItems: string[];
  onConvert: () => void;
  onLink: () => void;
  onStartPlanning: () => void;
  isConverting?: boolean;
}

export function SmartCtaBar({
  status, groupId, isOwner, isAdmin, isReady, missingItems,
  onConvert, onLink, onStartPlanning, isConverting,
}: SmartCtaBarProps) {
  const { t } = useTranslation('plans');
  const navigate = useNavigate();

  // Linked to group
  if (groupId) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('smart_cta.linked_to_group')}</p>
          <Button className="w-full" onClick={() => navigate(`/group/${groupId}`)}>
            <ArrowUpRight className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {status === 'done' ? t('smart_cta.view_group') : t('smart_cta.open_group')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Canceled
  if (status === 'canceled') {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t('smart_cta.plan_canceled')}</p>
        </CardContent>
      </Card>
    );
  }

  // Done without group (edge case)
  if (status === 'done') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t('smart_cta.plan_completed')}</p>
        </CardContent>
      </Card>
    );
  }

  // Draft
  if (status === 'draft') {
    return (
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('smart_cta.personal_plan')}</p>
          {isAdmin && (
            <Button className="w-full" onClick={onStartPlanning}>
              <Play className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('actions.start_planning')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Planning
  if (status === 'planning') {
    return (
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('smart_cta.start_planning')}</p>
          {isAdmin && (
            <Button className="w-full" variant="outline" onClick={onStartPlanning}>
              {t('actions.lock_plan')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Locked (ready to convert)
  if (status === 'locked') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{t('smart_cta.ready_to_convert')}</p>
          </div>

          {missingItems.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{t('smart_cta.missing_hint', { missing: missingItems.join('، ') })}</p>
            </div>
          )}

          {isOwner && (
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={onConvert} disabled={isConverting}>
                <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('smart_cta.convert_to_group')}
              </Button>
              <Button variant="outline" className="w-full" onClick={onLink}>
                <Link className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('smart_cta.link_existing')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

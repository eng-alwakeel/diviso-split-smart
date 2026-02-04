import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiceDecision } from "./DiceDecision";
import { cn } from "@/lib/utils";

interface HomeDiceBannerProps {
  className?: string;
}

export function HomeDiceBanner({ className }: HomeDiceBannerProps) {
  const { t } = useTranslation('dice');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className={cn(
        "border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
        "hover:shadow-md transition-all duration-300",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Icon and Content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 shrink-0">
                <span className="text-2xl" role="img" aria-label="dice">🎲</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {t('banner.title')}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {t('banner.description')}
                </p>
              </div>
            </div>
            
            {/* CTA Button */}
            <Button 
              onClick={() => setDialogOpen(true)}
              className="shrink-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {t('banner.cta')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dice Decision Dialog */}
      <DiceDecision
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

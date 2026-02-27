import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DiceOutcome,
  DiceTypeId,
  GroupDiceContext,
  rollGroupDice,
  suggestGroupDiceType,
  getAllowedTypes,
  mapOutcomeToGroupAction,
} from "@/dice/groupDiceEngine";

interface GroupDiceCardProps {
  groupId: string;
  groupType?: string;
  members: Array<{ id: string; name: string }>;
  hasOpenDebts: boolean;
  hasExpenses: boolean;
  onOpenAddExpense: (params: { groupId: string; categoryKey?: string; payerId?: string }) => void;
  onOpenSettleUp: (params: { groupId: string }) => void;
  onOpenInvite: (params: { groupId: string }) => void;
  onOpenWeeklyReport: (params: { groupId: string }) => void;
  onOpenRenameGroup: (params: { groupId: string }) => void;
  onOpenBudgetSettings: (params: { groupId: string }) => void;
  className?: string;
}

export function GroupDiceCard({
  groupId,
  groupType = "friends",
  members,
  hasOpenDebts,
  hasExpenses,
  onOpenAddExpense,
  onOpenSettleUp,
  onOpenInvite,
  onOpenWeeklyReport,
  onOpenRenameGroup,
  onOpenBudgetSettings,
  className,
}: GroupDiceCardProps) {
  const { t, i18n } = useTranslation("dice");
  const locale = (i18n.language === "ar" ? "ar" : "en") as "ar" | "en";
  const isRTL = locale === "ar";

  const ctx: GroupDiceContext = useMemo(
    () => ({
      locale,
      groupType,
      members,
      hasOpenDebts,
      hasExpenses,
    }),
    [locale, groupType, members, hasOpenDebts, hasExpenses]
  );

  const [forcedType, setForcedType] = useState<DiceTypeId | null>(null);
  const [outcome, setOutcome] = useState<DiceOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const suggested = useMemo(() => suggestGroupDiceType(ctx), [ctx]);
  const activeType = forcedType ?? suggested;

  const allowedTypes = useMemo(() => getAllowedTypes(ctx), [ctx]);

  function handleRoll() {
    setBusy(true);
    setTimeout(() => {
      const res = rollGroupDice(ctx, activeType);
      setOutcome(res);
      setShowTypePicker(false);
      setBusy(false);
    }, 600);
  }

  function handlePrimaryAction() {
    if (!outcome) return;
    const action = mapOutcomeToGroupAction(outcome, ctx);

    switch (action.type) {
      case "add_expense":
        onOpenAddExpense({ groupId, categoryKey: action.categoryKey, payerId: action.payerId });
        return;
      case "settle_up":
        onOpenSettleUp({ groupId });
        return;
      case "invite":
        onOpenInvite({ groupId });
        return;
      case "weekly_report":
        onOpenWeeklyReport({ groupId });
        return;
      case "rename_group":
        onOpenRenameGroup({ groupId });
        return;
      case "budget_settings":
        onOpenBudgetSettings({ groupId });
        return;
    }
  }

  const title = isRTL ? "قرار المجموعة اليوم" : "Group Decision Today";
  const subtitle = isRTL
    ? "رمية واحدة… وتتحول لفعل داخل Diviso"
    : "One roll… turns into action inside Diviso";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "rounded-2xl p-4 border border-border/10",
        className
      )}
      style={{ background: "#2D302F", color: "#F3F4F6" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold">{title}</h3>
          <p className="text-[13px] opacity-90 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowTypePicker((v) => !v)}
          className="shrink-0 rounded-full px-2.5 py-1.5 text-xs border border-white/20 hover:border-white/40 transition-colors bg-transparent"
          style={{ color: "#F3F4F6" }}
        >
          {isRTL ? "تغيير النوع" : "Change type"}
        </button>
      </div>

      {/* Type picker */}
      {showTypePicker && (
        <div className="flex flex-wrap gap-2 mt-3">
          {allowedTypes.map((t) => {
            const isActive = t.id === activeType;
            return (
              <button
                key={t.id}
                onClick={() => setForcedType(t.id)}
                className="rounded-full px-2.5 py-1.5 text-xs font-extrabold border-none cursor-pointer transition-colors"
                style={{
                  background: isActive ? "#C8F169" : "rgba(243,244,246,0.06)",
                  color: isActive ? "#1A1C1E" : "#F3F4F6",
                }}
              >
                {isRTL ? t.name_ar : t.name_en}
              </button>
            );
          })}
          <button
            onClick={() => setForcedType(null)}
            className="rounded-full px-2.5 py-1.5 text-xs font-bold border border-white/20 bg-transparent cursor-pointer"
            style={{ color: "#F3F4F6" }}
          >
            {isRTL ? "تلقائي" : "Auto"}
          </button>
        </div>
      )}

      {/* Roll button */}
      <div className="mt-3">
        <Button
          onClick={handleRoll}
          disabled={busy}
          className="w-full rounded-xl text-sm font-black h-11"
          style={{
            background: "#C8F169",
            color: "#1A1C1E",
            border: "none",
          }}
        >
          {busy
            ? isRTL ? "…يرمي" : "Rolling…"
            : isRTL ? "🎲 ارم النرد" : "🎲 Roll"}
        </Button>
      </div>

      {/* Outcome */}
      {outcome && (
        <div
          className="mt-3 p-3 rounded-xl grid gap-2.5"
          style={{ background: "rgba(243,244,246,0.06)" }}
        >
          <OutcomeRows locale={locale} outcome={outcome} />

          <div className="flex gap-2 mt-1">
            <Button
              onClick={handlePrimaryAction}
              className="flex-1 rounded-xl font-black text-sm h-10"
              style={{ background: "#C8F169", color: "#1A1C1E", border: "none" }}
            >
              {isRTL ? "نفّذ الآن" : "Do it now"}
            </Button>
            <Button
              variant="outline"
              onClick={handleRoll}
              className="rounded-xl font-bold text-sm h-10 whitespace-nowrap border-white/20 hover:border-white/40"
              style={{ background: "transparent", color: "#F3F4F6" }}
            >
              {isRTL ? "جرّب مرة ثانية" : "Roll again"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomeRows({ locale, outcome }: { locale: "ar" | "en"; outcome: DiceOutcome }) {
  const rows = outcome.mode === "single" ? [outcome.result] : outcome.results;

  return (
    <div className="grid gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-[22px]">{r.face.emoji}</span>
          <div className="grid gap-0.5">
            <span className="text-sm font-black">
              {locale === "ar" ? r.face.label_ar : r.face.label_en}
            </span>
            <span className="text-xs opacity-85">{r.diceName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

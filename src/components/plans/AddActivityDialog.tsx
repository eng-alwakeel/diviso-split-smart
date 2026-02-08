import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import type { AddActivityData } from "@/hooks/usePlanItinerary";

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddActivityData) => Promise<void>;
  isSaving: boolean;
}

export function AddActivityDialog({ open, onOpenChange, onSave, isSaving }: AddActivityDialogProps) {
  const { t } = useTranslation("plans");
  const [title, setTitle] = useState("");
  const [timeSlot, setTimeSlot] = useState("any");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [showExtra, setShowExtra] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    await onSave({
      title: title.trim(),
      time_slot: timeSlot,
      description: description.trim() || undefined,
      estimated_cost: cost ? Number(cost) : null,
    });
    setTitle("");
    setTimeSlot("any");
    setDescription("");
    setCost("");
    setShowExtra(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("itinerary.add_activity_dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("itinerary.add_activity_dialog.activity_title")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("itinerary.add_activity_dialog.activity_title_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("itinerary.add_activity_dialog.time_slot")}</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["morning", "afternoon", "evening", "any"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`itinerary.time_slots.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Collapsible open={showExtra} onOpenChange={setShowExtra}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
                {t("itinerary.add_activity_dialog.extra_details")}
                <ChevronDown className={`w-4 h-4 transition-transform ${showExtra ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">{t("itinerary.add_activity_dialog.description")}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("itinerary.add_activity_dialog.description_placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("itinerary.add_activity_dialog.estimated_cost")}</Label>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button className="w-full" onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                {t("itinerary.add_activity_dialog.saving")}
              </>
            ) : (
              t("itinerary.add_activity_dialog.save")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

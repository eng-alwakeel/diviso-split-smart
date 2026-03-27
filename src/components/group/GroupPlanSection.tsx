import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CalendarDays, MapPin, Plus, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PlanScheduleDay {
  id: string;
  day_index: number;
  day_date: string | null;
  activities: {
    id: string;
    title: string;
    description: string | null;
    time_slot: string;
    estimated_cost: number | null;
    currency: string | null;
    status: string;
  }[];
}

interface GroupPlanSectionProps {
  planId: string;
  planName: string;
  budgetValue: number | null;
  budgetCurrency: string;
  totalExpenses: number;
  days: PlanScheduleDay[];
  groupId: string;
}

const timeSlotLabels: Record<string, string> = {
  morning: "صباح",
  afternoon: "ظهر",
  evening: "مساء",
  any: "عام",
};

export function GroupPlanSection({
  planId, planName, budgetValue, budgetCurrency, totalExpenses, days, groupId,
}: GroupPlanSectionProps) {
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <>
      {/* Plan link banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">مبنية على خطة: <strong className="text-foreground">{planName}</strong></span>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/plan/${planId}`)}>
          عرض الخطة
        </Button>
      </div>

      {/* Schedule preview */}
      {days.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> الجدول
            </h2>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => setScheduleOpen(true)}>
              عرض الكل ({days.length} أيام)
            </Button>
          </div>

          {/* Show first 2 days */}
          {days.slice(0, 2).map((day) => (
            <Card key={day.id} className="border-border/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">اليوم {day.day_index + 1}</span>
                  {day.day_date && (
                    <span className="text-[10px] text-muted-foreground">{day.day_date}</span>
                  )}
                </div>
                {day.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">لا توجد أنشطة</p>
                ) : (
                  <div className="space-y-1">
                    {day.activities.slice(0, 3).map(activity => (
                      <div key={activity.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{activity.title}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {timeSlotLabels[activity.time_slot] || activity.time_slot}
                          </Badge>
                        </div>
                        {activity.estimated_cost && (
                          <span className="text-muted-foreground shrink-0">{activity.estimated_cost} {activity.currency || budgetCurrency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full schedule sheet */}
      <Sheet open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>الجدول — {planName}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {days.map((day) => (
              <div key={day.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">اليوم {day.day_index + 1}</h3>
                  {day.day_date && <span className="text-xs text-muted-foreground">{day.day_date}</span>}
                </div>
                {day.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">لا توجد أنشطة لهذا اليوم</p>
                ) : (
                  day.activities.map(activity => (
                    <Card key={activity.id} className="border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{activity.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {timeSlotLabels[activity.time_slot] || activity.time_slot}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          {activity.estimated_cost ? (
                            <span className="text-xs text-muted-foreground">
                              تكلفة تقديرية: {activity.estimated_cost} {activity.currency || budgetCurrency}
                            </span>
                          ) : <span />}
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => {
                              setScheduleOpen(false);
                              navigate(`/add-expense?groupId=${groupId}&activityId=${activity.id}&description=${encodeURIComponent(activity.title)}`);
                            }}>
                            <Plus className="w-3 h-3 me-1" /> مصروف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

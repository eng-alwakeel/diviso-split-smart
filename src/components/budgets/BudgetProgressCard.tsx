import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Budget } from "@/hooks/useBudgets";

interface BudgetProgressCardProps {
  budget: Budget;
  progress: number;
  spent: number;
  remaining: number;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
}

export function BudgetProgressCard({
  budget,
  progress,
  spent,
  remaining,
  onEdit,
  onDelete,
  formatCurrency
}: BudgetProgressCardProps) {
  const getProgressVariant = () => {
    if (progress >= 100) return "destructive";
    if (progress >= 90) return "secondary";
    if (progress >= 75) return "outline";
    return "default";
  };

  const getProgressIcon = () => {
    if (progress >= 100) return <AlertTriangle className="h-4 w-4" />;
    if (progress >= 90) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getPeriodText = () => {
    switch (budget.period) {
      case "weekly": return "أسبوعية";
      case "monthly": return "شهرية";
      case "yearly": return "سنوية";
      case "quarterly": return "ربع سنوية";
      case "custom": return "مخصصة";
      default: return "شهرية";
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{budget.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{getPeriodText()}</span>
              <span>•</span>
              <span>{new Date(budget.start_date).toLocaleDateString('ar-SA')}</span>
              {budget.end_date && (
                <>
                  <span>-</span>
                  <span>{new Date(budget.end_date).toLocaleDateString('ar-SA')}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getProgressVariant()} className="flex items-center gap-1">
              {getProgressIcon()}
              {progress.toFixed(1)}%
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>المصروف</span>
            <span className="font-medium">{formatCurrency(spent)}</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>المتبقي: {formatCurrency(remaining)}</span>
            <span>الإجمالي: {formatCurrency(budget.amount_limit || budget.total_amount)}</span>
          </div>
        </div>
        
        {progress >= 90 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {progress >= 100 
                  ? "تم تجاوز الميزانية!" 
                  : "اقتراب من الحد الأقصى"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
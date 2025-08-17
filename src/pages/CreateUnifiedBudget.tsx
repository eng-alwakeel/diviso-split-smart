import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { UnifiedBudgetCreator } from "@/components/budgets/UnifiedBudgetCreator";
import { useBudgets, CreateBudgetData } from "@/hooks/useBudgets";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";

export default function CreateUnifiedBudget() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId") || undefined;
  
  const { createBudget, isCreating } = useBudgets();
  const { createCategory } = useBudgetCategories();

  const handleSave = async (budgetData: {
    name: string;
    group_id: string;
    categories: Array<{
      id: string;
      category_id: string;
      category_name: string;
      amount: number;
    }>;
    total_amount: number;
  }) => {
    try {
      // Create the main budget
      const budgetCreateData: CreateBudgetData = {
        name: budgetData.name,
        total_amount: budgetData.total_amount,
        amount_limit: budgetData.total_amount,
        start_date: new Date().toISOString().split('T')[0],
        period: 'monthly',
        budget_type: 'monthly',
        group_id: budgetData.group_id,
      };

      const createdBudget = await createBudget(budgetCreateData);

      // Create budget categories
      for (const category of budgetData.categories) {
        await createCategory({
          name: category.category_name,
          allocated_amount: category.amount,
          budget_id: createdBudget.id,
        });
      }

      // Navigate back to financial plan
      navigate("/financial-plan");
    } catch (error) {
      console.error("Error creating unified budget:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 pt-6 pb-20">
        <UnifiedBudgetCreator 
          onSave={handleSave}
          isLoading={isCreating}
          groupId={groupId}
        />
      </div>
      
      <BottomNav />
    </div>
  );
}
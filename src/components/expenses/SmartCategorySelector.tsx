import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, Plus, DollarSign, Clock, Lightbulb, Folder } from "lucide-react";
import { useSmartCategories, SmartCategory } from "@/hooks/useSmartCategories";
import { ManageCategoriesDialog } from "@/components/categories/ManageCategoriesDialog";
interface SmartCategorySelectorProps {
  groupId: string | null;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  groupCurrency?: string;
}

export function SmartCategorySelector({ 
  groupId, 
  selectedCategoryId, 
  onCategorySelect,
  groupCurrency = 'SAR'
}: SmartCategorySelectorProps) {
  const { t } = useTranslation('expenses');
  const [searchQuery, setSearchQuery] = useState("");
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['budget', 'recent', 'suggested'])
  );

  const { smartCategories, isLoading, getSectionIcon } = useSmartCategories(groupId);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getIcon = (section: SmartCategory['section']) => {
    switch (section) {
      case 'budget': return <DollarSign className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'suggested': return <Lightbulb className="w-4 h-4" />;
      case 'other': return <Folder className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: groupCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredCategories = smartCategories.filter(category =>
    category.name_ar.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.section]) {
      acc[category.section] = [];
    }
    acc[category.section].push(category);
    return acc;
  }, {} as Record<string, SmartCategory[]>);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={t('category_selector.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Categories by Section */}
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {(['budget', 'recent', 'suggested', 'other'] as const).map((section) => {
            const sectionCategories = groupedCategories[section];
            if (!sectionCategories || sectionCategories.length === 0) return null;

            return (
              <Collapsible
                key={section}
                open={expandedSections.has(section)}
                onOpenChange={() => toggleSection(section)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2">
                    <div className="flex items-center gap-2">
                      {getIcon(section)}
                      <span className="font-medium">{t(`category_selector.sections.${section}`)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {sectionCategories.length}
                      </Badge>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {sectionCategories.map((category) => (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedCategoryId === category.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onCategorySelect(category.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{category.name_ar}</div>
                            
                            {/* Budget info */}
                            {category.section === 'budget' && category.budgeted_amount && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <div>{t('category_selector.budget_info')} {formatCurrency(category.budgeted_amount)}</div>
                                {category.remaining_amount !== undefined && (
                                  <div className={`${
                                    category.remaining_amount > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {t('category_selector.remaining')} {formatCurrency(category.remaining_amount)}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Usage count for recent */}
                            {category.section === 'recent' && category.usage_count && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t('category_selector.used_times', { count: category.usage_count })}
                              </div>
                            )}
                            
                            {/* Confidence for suggested */}
                            {category.section === 'suggested' && category.confidence && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t('category_selector.suggested_based_on')}
                              </div>
                            )}
                          </div>
                          
                          {/* Section indicator */}
                          <div className="text-xs opacity-50">
                            {getSectionIcon(category.section)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add New Category */}
      <Button
        variant="outline"
        onClick={() => setManageCategoriesOpen(true)}
        className="w-full"
      >
        <Plus className="w-4 h-4 ml-2" />
        {t('category_selector.add_new_category')}
      </Button>

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        currentUserId={null}
      />
    </div>
  );
}
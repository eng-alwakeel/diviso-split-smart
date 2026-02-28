import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, X, ChevronDown, Calendar, DollarSign } from "lucide-react";
import { ExpenseFilters as FilterType } from "@/hooks/useMyExpenses";

interface ExpenseFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  groups?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export const ExpenseFilters = ({ 
  filters, 
  onFiltersChange, 
  groups = [], 
  loading = false 
}: ExpenseFiltersProps) => {
  const { t } = useTranslation('expenses');
  const { debounce } = usePerformanceOptimization();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  // Debounced search to improve performance
  const debouncedSearch = useMemo(
    () => debounce((searchValue: string) => {
      onFiltersChange({ ...localFilters, search: searchValue || undefined });
    }, 300),
    [debounce, localFilters, onFiltersChange]
  );

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof FilterType];
      return value !== undefined && value !== '' && value !== 'all';
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const updateFilter = (key: keyof FilterType, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('filters.search_placeholder')}
          value={localFilters.search || ''}
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('search', value);
            debouncedSearch(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onFiltersChange(localFilters);
            }
          }}
          className="pr-10 h-9"
          disabled={loading}
        />
        {localFilters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              updateFilter('search', '');
              onFiltersChange({ ...localFilters, search: undefined });
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quick Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={(!filters.status || filters.status === 'all') ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, status: 'all' })}
          disabled={loading}
        >
          {t('filters.all')}
        </Button>
        <Button
          variant={filters.status === 'pending' ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, status: 'pending' })}
          disabled={loading}
        >
          {t('filters.pending')}
        </Button>
        <Button
          variant={filters.status === 'approved' ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, status: 'approved' })}
          disabled={loading}
        >
          {t('filters.approved')}
        </Button>
        <Button
          variant={filters.status === 'rejected' ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, status: 'rejected' })}
          disabled={loading}
        >
          {t('filters.rejected')}
        </Button>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filters.advanced')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {t('filters.clear')}
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Group Filter */}
              <div className="space-y-2">
                <Label>{t('filters.group')}</Label>
                <Select 
                  value={localFilters.group_id || ''} 
                  onValueChange={(value) => updateFilter('group_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('filters.all_groups')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('filters.all_groups')}</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('filters.date_from')}
                  </Label>
                  <Input
                    type="date"
                    value={localFilters.date_from || ''}
                    onChange={(e) => updateFilter('date_from', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('filters.date_to')}
                  </Label>
                  <Input
                    type="date"
                    value={localFilters.date_to || ''}
                    onChange={(e) => updateFilter('date_to', e.target.value)}
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {t('filters.min_amount')}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.min_amount || ''}
                    onChange={(e) => updateFilter('min_amount', parseFloat(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {t('filters.max_amount')}
                  </Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={localFilters.max_amount || ''}
                    onChange={(e) => updateFilter('max_amount', parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  {t('filters.apply')}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t('filters.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
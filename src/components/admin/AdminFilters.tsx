import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminFiltersProps {
  onFilterChange: (filters: any) => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdminFilters = ({ onFilterChange, onExport, onRefresh, isLoading }: AdminFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ search: value, plan: planFilter, dateRange, status: statusFilter });
  };

  const handlePlanFilter = (value: string) => {
    setPlanFilter(value);
    onFilterChange({ search: searchTerm, plan: value, dateRange, status: statusFilter });
  };

  const handleDateRange = (value: string) => {
    setDateRange(value);
    onFilterChange({ search: searchTerm, plan: planFilter, dateRange: value, status: statusFilter });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    onFilterChange({ search: searchTerm, plan: planFilter, dateRange, status: value });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPlanFilter("all");
    setDateRange("30");
    setStatusFilter("all");
    onFilterChange({ search: "", plan: "all", dateRange: "30", status: "all" });
  };

  const activeFiltersCount = [searchTerm, planFilter !== "all" ? planFilter : "", statusFilter !== "all" ? statusFilter : ""].filter(Boolean).length + 
    (dateRange !== "30" ? 1 : 0);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Mobile: Compact view with expand button */}
        <div className="flex flex-col gap-4">
          {/* Search - Always visible */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            
            {/* Mobile: Toggle filters button */}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Action Buttons - Always visible */}
            <Button
              onClick={onRefresh}
              variant="outline"
              size="icon"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={onExport}
              variant="outline"
              size="icon"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters - Expandable on mobile, always visible on desktop */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${isExpanded ? 'block' : 'hidden lg:grid'}`}>
            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={handlePlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الباقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الباقات</SelectItem>
                <SelectItem value="free">مجاني</SelectItem>
                <SelectItem value="personal">شخصي</SelectItem>
                <SelectItem value="family">عائلي</SelectItem>
                <SelectItem value="lifetime">مدى الحياة</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={handleDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters - Only show when there are active filters */}
          {activeFiltersCount > 0 && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="self-start gap-2"
            >
              <Filter className="w-4 h-4" />
              مسح الفلاتر
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
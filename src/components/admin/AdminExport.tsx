import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminExportProps {
  onExport: (config: ExportConfig) => void;
  isLoading?: boolean;
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json';
  dataType: 'users' | 'groups' | 'expenses' | 'all';
  includeFields: string[];
  dateRange: string;
}

export const AdminExport = ({ onExport, isLoading }: AdminExportProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('excel');
  const [dataType, setDataType] = useState<'users' | 'groups' | 'expenses' | 'all'>('all');
  const [dateRange, setDateRange] = useState('30');
  const [includeFields, setIncludeFields] = useState<string[]>([
    'basic_info', 'subscription_info', 'activity_data'
  ]);

  const fieldOptions = {
    users: [
      { id: 'basic_info', label: 'المعلومات الأساسية', description: 'الاسم، البريد، الهاتف' },
      { id: 'subscription_info', label: 'معلومات الاشتراك', description: 'نوع الباقة، تاريخ الانتهاء' },
      { id: 'activity_data', label: 'بيانات النشاط', description: 'المجموعات، المصروفات' },
      { id: 'admin_status', label: 'صلاحيات الإدارة', description: 'حالة المدير' }
    ],
    groups: [
      { id: 'basic_info', label: 'المعلومات الأساسية', description: 'الاسم، المالك، العملة' },
      { id: 'members_info', label: 'معلومات الأعضاء', description: 'عدد الأعضاء، قائمة الأعضاء' },
      { id: 'financial_data', label: 'البيانات المالية', description: 'إجمالي المصروفات، الرصيد' },
      { id: 'activity_data', label: 'بيانات النشاط', description: 'تاريخ الإنشاء، آخر نشاط' }
    ],
    expenses: [
      { id: 'basic_info', label: 'المعلومات الأساسية', description: 'المبلغ، الوصف، التاريخ' },
      { id: 'approval_info', label: 'معلومات الموافقة', description: 'الحالة، المعتمد من' },
      { id: 'split_data', label: 'بيانات التقسيم', description: 'تقسيم المصروف بين الأعضاء' },
      { id: 'receipt_data', label: 'بيانات الفاتورة', description: 'الفواتير المرفقة' }
    ],
    all: [
      { id: 'users_data', label: 'بيانات المستخدمين', description: 'جميع معلومات المستخدمين' },
      { id: 'groups_data', label: 'بيانات المجموعات', description: 'جميع معلومات المجموعات' },
      { id: 'expenses_data', label: 'بيانات المصروفات', description: 'جميع معلومات المصروفات' },
      { id: 'analytics_data', label: 'البيانات التحليلية', description: 'الإحصائيات والتحليلات' }
    ]
  };

  const handleFieldToggle = (fieldId: string) => {
    setIncludeFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    onExport({
      format,
      dataType,
      includeFields,
      dateRange
    });
    setOpen(false);
  };

  const currentFields = fieldOptions[dataType] || [];
  const formatIcon = {
    excel: FileSpreadsheet,
    csv: FileText,
    json: FileText
  };
  const IconComponent = formatIcon[format];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير البيانات
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            تصدير البيانات الإدارية
          </DialogTitle>
          <DialogDescription>
            اختر نوع البيانات والحقول التي تريد تصديرها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">صيغة التصدير</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON (.json)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">نوع البيانات</Label>
            <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="users">المستخدمين فقط</SelectItem>
                <SelectItem value="groups">المجموعات فقط</SelectItem>
                <SelectItem value="expenses">المصروفات فقط</SelectItem>
                <SelectItem value="all">جميع البيانات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">الفترة الزمنية</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
                <SelectItem value="all">جميع البيانات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">الحقول المطلوبة</Label>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  {currentFields.map((field) => (
                    <div key={field.id} className="flex items-start space-x-2 space-x-reverse">
                      <Checkbox
                        id={field.id}
                        checked={includeFields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={field.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {field.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <IconComponent className="w-4 h-4" />
                <span className="font-medium">
                  سيتم تصدير: {dataType === 'all' ? 'جميع البيانات' : 
                    dataType === 'users' ? 'بيانات المستخدمين' :
                    dataType === 'groups' ? 'بيانات المجموعات' : 'بيانات المصروفات'}
                </span>
                <span className="text-muted-foreground">
                  ({includeFields.length} حقل محدد)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isLoading || includeFields.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isLoading ? 'جاري التصدير...' : 'تصدير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
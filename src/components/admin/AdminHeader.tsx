import { Button } from "@/components/ui/button";
import { Home, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const AdminHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 sm:p-6 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">لوحة التحكم الإدارية</h1>
            <p className="text-white/80 text-sm hidden sm:block">إدارة شاملة للتطبيق والمستخدمين</p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/dashboard')}
          variant="secondary"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-white/20 gap-2"
        >
          <Home className="w-4 h-4" />
          <span className="hidden xs:inline">العودة للداشبورد</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <Breadcrumb className="text-white/80 hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/dashboard')}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              الرئيسية
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-white/60" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white font-medium">
              لوحة التحكم الإدارية
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
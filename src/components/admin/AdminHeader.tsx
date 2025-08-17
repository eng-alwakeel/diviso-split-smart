import { Button } from "@/components/ui/button";
import { Home, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const AdminHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم الإدارية</h1>
            <p className="text-white/80">إدارة شاملة للتطبيق والمستخدمين</p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/dashboard')}
          variant="secondary"
          className="bg-white/20 hover:bg-white/30 text-white border-white/20 gap-2"
        >
          <Home className="w-4 h-4" />
          العودة للداشبورد
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <Breadcrumb className="text-white/80">
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
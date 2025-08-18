import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface ReportWatermarkProps {
  children: React.ReactNode;
  className?: string;
}

export const ReportWatermark = ({ children, className = "" }: ReportWatermarkProps) => {
  const { isFreePlan } = useSubscriptionLimits();

  if (!isFreePlan) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Watermark overlay for free plan */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 left-4 opacity-10 transform -rotate-12">
          <div className="text-4xl font-bold text-muted-foreground whitespace-nowrap">
            FREE PLAN
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 opacity-10 transform rotate-12">
          <div className="text-2xl font-bold text-muted-foreground whitespace-nowrap">
            upgrade for unlimited
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 -rotate-45">
          <div className="text-6xl font-bold text-muted-foreground whitespace-nowrap">
            FREE PLAN
          </div>
        </div>
      </div>
      
      {/* Footer watermark */}
      <div className="mt-4 pt-2 border-t border-muted text-center">
        <p className="text-xs text-muted-foreground">
          🆓 تم إنشاء هذا التقرير باستخدام الباقة المجانية - 
          <span className="text-primary font-medium cursor-pointer hover:underline"> قم بالترقية للحصول على تقارير احترافية</span>
        </p>
      </div>
    </div>
  );
};
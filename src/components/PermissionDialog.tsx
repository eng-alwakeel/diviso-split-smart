import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePermissions, PermissionType } from '@/hooks/usePermissions';
import { Camera, Users, MapPin, Bell, Settings } from 'lucide-react';

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionType: PermissionType;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const iconMap: Record<PermissionType, React.ReactNode> = {
  camera: <Camera className="h-12 w-12 text-primary" />,
  contacts: <Users className="h-12 w-12 text-primary" />,
  location: <MapPin className="h-12 w-12 text-primary" />,
  notifications: <Bell className="h-12 w-12 text-primary" />,
};

export const PermissionDialog = ({
  open,
  onOpenChange,
  permissionType,
  onPermissionGranted,
  onPermissionDenied,
}: PermissionDialogProps) => {
  const { requestPermission, permissionDetails, loading, openAppSettings, checkPermission } = usePermissions();
  const [isDenied, setIsDenied] = useState(false);

  const details = permissionDetails[permissionType];

  const handleAllow = async () => {
    const granted = await requestPermission(permissionType);
    
    if (granted) {
      onPermissionGranted?.();
      onOpenChange(false);
      setIsDenied(false);
    } else {
      // التحقق إذا تم رفض الصلاحية نهائياً
      const status = await checkPermission(permissionType);
      if (status === 'denied') {
        setIsDenied(true);
      }
      onPermissionDenied?.();
    }
  };

  const handleDeny = () => {
    onPermissionDenied?.();
    onOpenChange(false);
  };

  const handleOpenSettings = () => {
    openAppSettings();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full">
            {iconMap[permissionType]}
          </div>
          <DialogTitle className="text-xl">
            الوصول إلى {details.title}
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            {details.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {isDenied ? (
            <>
              <p className="text-sm text-muted-foreground text-center mb-2">
                تم رفض الصلاحية. يرجى تفعيلها من إعدادات التطبيق.
              </p>
              <Button 
                onClick={handleOpenSettings}
                className="w-full"
              >
                <Settings className="h-4 w-4 ml-2" />
                فتح الإعدادات
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleAllow} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'جاري الطلب...' : '✅ السماح'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeny}
                disabled={loading}
                className="w-full"
              >
                ❌ لاحقاً
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionDialog;

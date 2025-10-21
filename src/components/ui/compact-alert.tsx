import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactAlertProps {
  variant: 'destructive' | 'warning' | 'info' | 'success';
  message: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function CompactAlert({
  variant,
  message,
  onDismiss,
  actionLabel,
  onAction,
  className
}: CompactAlertProps) {
  return (
    <Alert 
      variant={variant} 
      className={cn(
        "py-2 px-3 border-l-4 flex items-center justify-between gap-2",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <AlertDescription className="text-sm font-medium truncate">
          {message}
        </AlertDescription>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {actionLabel && onAction && (
          <Button 
            size="sm" 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onAction}
            className="h-7 text-xs px-2"
          >
            {actionLabel}
          </Button>
        )}
        {onDismiss && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDismiss}
            className="h-7 w-7 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

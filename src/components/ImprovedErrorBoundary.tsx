import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ImprovedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, retry }) => {
  const navigate = useNavigate();

  const getErrorMessage = (error: Error) => {
    if (error.message.includes('Network')) {
      return {
        title: 'خطأ في الاتصال',
        description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        action: 'المحاولة مرة أخرى'
      };
    }
    
    if (error.message.includes('Authentication') || error.message.includes('auth')) {
      return {
        title: 'خطأ في المصادقة',
        description: 'يرجى تسجيل الدخول مرة أخرى',
        action: 'تسجيل الدخول'
      };
    }

    if (error.message.includes('permission') || error.message.includes('Forbidden')) {
      return {
        title: 'ليس لديك صلاحية',
        description: 'ليس لديك صلاحية للوصول لهذه الصفحة',
        action: 'العودة للرئيسية'
      };
    }

    return {
      title: 'حدث خطأ غير متوقع',
      description: 'نعتذر عن هذا الخطأ، يرجى المحاولة مرة أخرى',
      action: 'المحاولة مرة أخرى'
    };
  };

  const errorInfo = getErrorMessage(error);

  const handleAction = () => {
    if (errorInfo.action === 'تسجيل الدخول') {
      navigate('/auth');
    } else if (errorInfo.action === 'العودة للرئيسية') {
      navigate('/');
    } else {
      retry();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card border border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">{errorInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">{errorInfo.description}</p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-xs bg-muted p-3 rounded">
              <summary className="cursor-pointer font-medium mb-2">تفاصيل الخطأ (للمطورين)</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAction} className="flex-1">
              {errorInfo.action === 'المحاولة مرة أخرى' && <RefreshCw className="w-4 h-4 ml-2" />}
              {errorInfo.action === 'العودة للرئيسية' && <Home className="w-4 h-4 ml-2" />}
              {errorInfo.action}
            </Button>
            
            {errorInfo.action !== 'العودة للرئيسية' && (
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 ml-2" />
                الرئيسية
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
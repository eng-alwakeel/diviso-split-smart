import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Maximize2, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showActions?: boolean;
}

export function QRCodeDisplay({ value, size = 200, className = "", showActions = true }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateQRCode = useCallback(async () => {
    if (!canvasRef.current || !value?.trim()) {
      setError('قيمة الرابط غير صحيحة');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use fixed colors instead of CSS variables
      const qrOptions = {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M' as const,
      };

      await QRCode.toCanvas(canvasRef.current, value, qrOptions);

      // Generate data URL for download with higher resolution
      const dataUrl = await QRCode.toDataURL(value, {
        ...qrOptions,
        width: size * 2,
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('فشل في توليد رمز QR');
      toast.error('خطأ في توليد رمز QR');
    } finally {
      setIsLoading(false);
    }
  }, [value, size]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = 'referral-qr-code.png';
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل رمز QR بنجاح');
  };

  const shareQRCode = async () => {
    if (!qrDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'referral-qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'رمز QR للإحالة',
          text: 'امسح هذا الرمز للانضمام إلى التطبيق',
          files: [file],
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        toast.success('تم نسخ رمز QR إلى الحافظة');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('خطأ في مشاركة رمز QR');
    }
  };

  const retryGeneration = () => {
    setError('');
    generateQRCode();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="bg-background p-4 rounded-lg border relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <Button onClick={retryGeneration} variant="outline" size="sm">
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <canvas ref={canvasRef} className="max-w-full h-auto" style={{ minHeight: size, minWidth: size }} />
        )}
      </div>
      
      {showActions && !error && (
        <div className="flex gap-2">
          <Button onClick={downloadQRCode} variant="outline" size="sm" disabled={!qrDataUrl || isLoading}>
            <Download className="w-4 h-4 mr-2" />
            تحميل
          </Button>
          
          <Button onClick={shareQRCode} variant="outline" size="sm" disabled={!qrDataUrl || isLoading}>
            <Share2 className="w-4 h-4 mr-2" />
            مشاركة
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!qrDataUrl || isLoading}>
                <Maximize2 className="w-4 h-4 mr-2" />
                عرض كبير
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>رمز QR للإحالة</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                <div className="bg-white p-4 rounded-lg">
                  <canvas 
                    ref={(canvas) => {
                      if (canvas && qrDataUrl) {
                        QRCode.toCanvas(canvas, value, {
                          width: 300,
                          margin: 2,
                          color: { dark: '#000000', light: '#FFFFFF' }
                        });
                      }
                    }}
                    width={300}
                    height={300}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
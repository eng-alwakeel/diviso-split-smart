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

  const generateCustomQRCode = useCallback(async () => {
    if (!canvasRef.current || !value?.trim()) {
      setError('قيمة الرابط غير صحيحة');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Generate QR code with app colors and high error correction
      const qrOptions = {
        width: size,
        margin: 1,
        color: {
          dark: '#1A1C1E', // App dark color
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H' as const, // High error correction for logo overlay
      };

      // Generate QR to a temporary canvas
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, value, qrOptions);

      // Clear main canvas and draw background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Add gradient background frame
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#C8F169'); // Primary color
      gradient.addColorStop(1, '#A5D147'); // Darker shade
      
      // Draw gradient border
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      
      // Draw white background for QR
      const padding = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(padding, padding, size - padding * 2, size - padding * 2);

      // Draw QR code
      ctx.drawImage(tempCanvas, padding, padding, size - padding * 2, size - padding * 2);

      // Load and draw logo in center
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logo.onload = () => {
          // Calculate logo size (about 15% of QR size)
          const logoSize = size * 0.15;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // Draw white circle background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, 2 * Math.PI);
          ctx.fill();

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          resolve(true);
        };
        logo.onerror = () => resolve(true); // Continue without logo if it fails
        logo.src = '/lovable-uploads/4eed09d8-8605-4bc8-aedd-a51b6ad9fcf8.png';
      });

      // Generate high-resolution data URL for download
      const tempHiResCanvas = document.createElement('canvas');
      const hiResSize = size * 3;
      tempHiResCanvas.width = hiResSize;
      tempHiResCanvas.height = hiResSize;
      const hiResCtx = tempHiResCanvas.getContext('2d');
      
      if (hiResCtx) {
        // Repeat the same process for high-res version
        const hiResGradient = hiResCtx.createLinearGradient(0, 0, hiResSize, hiResSize);
        hiResGradient.addColorStop(0, '#C8F169');
        hiResGradient.addColorStop(1, '#A5D147');
        
        hiResCtx.fillStyle = hiResGradient;
        hiResCtx.fillRect(0, 0, hiResSize, hiResSize);
        
        const hiResPadding = 24;
        hiResCtx.fillStyle = '#FFFFFF';
        hiResCtx.fillRect(hiResPadding, hiResPadding, hiResSize - hiResPadding * 2, hiResSize - hiResPadding * 2);
        
        // Generate high-res QR
        const hiResQRCanvas = document.createElement('canvas');
        await QRCode.toCanvas(hiResQRCanvas, value, {
          ...qrOptions,
          width: hiResSize - hiResPadding * 2,
        });
        
        hiResCtx.drawImage(hiResQRCanvas, hiResPadding, hiResPadding);
        
        // Draw high-res logo
        const hiResLogoSize = hiResSize * 0.15;
        const hiResLogoX = (hiResSize - hiResLogoSize) / 2;
        const hiResLogoY = (hiResSize - hiResLogoSize) / 2;
        
        hiResCtx.fillStyle = '#FFFFFF';
        hiResCtx.beginPath();
        hiResCtx.arc(hiResSize / 2, hiResSize / 2, hiResLogoSize / 2 + 12, 0, 2 * Math.PI);
        hiResCtx.fill();
        
        hiResCtx.drawImage(logo, hiResLogoX, hiResLogoY, hiResLogoSize, hiResLogoSize);
        
        setQrDataUrl(tempHiResCanvas.toDataURL('image/png', 1.0));
      }

    } catch (error) {
      console.error('Error generating custom QR code:', error);
      setError('فشل في توليد رمز QR');
      toast.error('خطأ في توليد رمز QR');
    } finally {
      setIsLoading(false);
    }
  }, [value, size]);

  useEffect(() => {
    generateCustomQRCode();
  }, [generateCustomQRCode]);

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
    generateCustomQRCode();
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
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="رمز QR للإحالة" 
                      className="w-[300px] h-[300px] object-contain"
                    />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
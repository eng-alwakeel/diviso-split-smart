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

      // Set canvas size - increased height for logo
      const qrSize = size;
      const logoHeight = 50;
      const totalHeight = qrSize + logoHeight + 20; // padding between QR and logo
      
      canvas.width = qrSize;
      canvas.height = totalHeight;

      // Generate QR code with app colors
      const qrOptions = {
        width: qrSize,
        margin: 1,
        color: {
          dark: '#16A34A', // Green from app theme
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M' as const,
      };

      // Generate QR to a temporary canvas
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, value, qrOptions);

      // Clear main canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, qrSize, totalHeight);

      // Add gradient background for QR area
      const gradient = ctx.createLinearGradient(0, 0, qrSize, qrSize);
      gradient.addColorStop(0, '#C8F169'); // Primary green
      gradient.addColorStop(1, '#16A34A'); // Darker green
      
      // Draw gradient border for QR
      const padding = 8;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, qrSize, qrSize);
      
      // Draw white background for QR
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(padding, padding, qrSize - padding * 2, qrSize - padding * 2);

      // Draw QR code
      ctx.drawImage(tempCanvas, padding, padding, qrSize - padding * 2, qrSize - padding * 2);

      // Draw text logo below QR (Letter "D")
      const logoY = qrSize + 15;
      
      // Set font for the logo text
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#16A34A'; // App green color
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw the letter "D" centered below QR
      ctx.fillText('D', qrSize / 2, logoY + 15);
      
      // Add "Diviso" text below
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#6B7280'; // Gray color
      ctx.fillText('Diviso', qrSize / 2, logoY + 35);

      // Generate high-resolution data URL for download
      const tempHiResCanvas = document.createElement('canvas');
      const hiResQRSize = qrSize * 3;
      const hiResLogoHeight = logoHeight * 3;
      const hiResTotalHeight = hiResQRSize + hiResLogoHeight + 60;
      
      tempHiResCanvas.width = hiResQRSize;
      tempHiResCanvas.height = hiResTotalHeight;
      const hiResCtx = tempHiResCanvas.getContext('2d');
      
      if (hiResCtx) {
        // Clear high-res canvas
        hiResCtx.fillStyle = '#FFFFFF';
        hiResCtx.fillRect(0, 0, hiResQRSize, hiResTotalHeight);
        
        // Draw high-res gradient
        const hiResGradient = hiResCtx.createLinearGradient(0, 0, hiResQRSize, hiResQRSize);
        hiResGradient.addColorStop(0, '#C8F169');
        hiResGradient.addColorStop(1, '#16A34A');
        
        const hiResPadding = 24;
        hiResCtx.fillStyle = hiResGradient;
        hiResCtx.fillRect(0, 0, hiResQRSize, hiResQRSize);
        
        hiResCtx.fillStyle = '#FFFFFF';
        hiResCtx.fillRect(hiResPadding, hiResPadding, hiResQRSize - hiResPadding * 2, hiResQRSize - hiResPadding * 2);
        
        // Generate high-res QR
        const hiResQRCanvas = document.createElement('canvas');
        await QRCode.toCanvas(hiResQRCanvas, value, {
          ...qrOptions,
          width: hiResQRSize - hiResPadding * 2,
        });
        
        hiResCtx.drawImage(hiResQRCanvas, hiResPadding, hiResPadding);
        
        // Draw high-res text logo
        const hiResLogoY = hiResQRSize + 45;
        
        // Set font for high-res logo
        hiResCtx.font = 'bold 84px system-ui, -apple-system, sans-serif';
        hiResCtx.fillStyle = '#16A34A';
        hiResCtx.textAlign = 'center';
        hiResCtx.textBaseline = 'middle';
        
        // Draw "D" letter
        hiResCtx.fillText('D', hiResQRSize / 2, hiResLogoY + 45);
        
        // Add "Diviso" text
        hiResCtx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        hiResCtx.fillStyle = '#6B7280';
        hiResCtx.fillText('Diviso', hiResQRSize / 2, hiResLogoY + 105);
        
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
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

// Helper function to draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function QRCodeDisplay({ value, size = 200, className = "", showActions = true }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateProfessionalQR = useCallback(async (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    qrValue: string,
    scale: number = 1
  ) => {
    const padding = 24 * scale;
    const qrAreaSize = canvasWidth - (padding * 2);
    const cornerRadius = 20 * scale;
    const logoRadius = 28 * scale;
    const bottomTextHeight = 50 * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background with subtle gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    bgGradient.addColorStop(0, '#FAFAFA');
    bgGradient.addColorStop(1, '#F3F4F6');
    ctx.fillStyle = bgGradient;
    roundRect(ctx, 0, 0, canvasWidth, canvasHeight, cornerRadius);
    ctx.fill();

    // Outer frame with gradient border
    const frameGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasWidth);
    frameGradient.addColorStop(0, '#22C55E');
    frameGradient.addColorStop(0.5, '#16A34A');
    frameGradient.addColorStop(1, '#15803D');
    
    ctx.strokeStyle = frameGradient;
    ctx.lineWidth = 3 * scale;
    roundRect(ctx, padding / 2, padding / 2, canvasWidth - padding, canvasWidth - padding + bottomTextHeight, cornerRadius);
    ctx.stroke();

    // Inner white area for QR with shadow effect
    ctx.save();
    ctx.shadowColor = 'rgba(22, 163, 74, 0.15)';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, padding, padding, qrAreaSize, qrAreaSize, cornerRadius - 8);
    ctx.fill();
    ctx.restore();

    // Generate QR code
    const qrCanvas = document.createElement('canvas');
    const qrPadding = 16 * scale;
    const actualQrSize = qrAreaSize - (qrPadding * 2);
    
    await QRCode.toCanvas(qrCanvas, qrValue, {
      width: actualQrSize,
      margin: 0,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High for logo overlay
    });

    // Draw QR code
    ctx.drawImage(qrCanvas, padding + qrPadding, padding + qrPadding, actualQrSize, actualQrSize);

    // Logo in center - white circle with shadow
    const centerX = canvasWidth / 2;
    const centerY = padding + (qrAreaSize / 2);

    // Logo shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetY = 4 * scale;
    
    // White circle background
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoRadius + 4 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // Green gradient circle
    const logoGradient = ctx.createRadialGradient(
      centerX - logoRadius / 3, centerY - logoRadius / 3, 0,
      centerX, centerY, logoRadius
    );
    logoGradient.addColorStop(0, '#4ADE80');
    logoGradient.addColorStop(1, '#16A34A');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
    ctx.fillStyle = logoGradient;
    ctx.fill();

    // Logo letter "D"
    ctx.font = `bold ${24 * scale}px "SF Pro Display", "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', centerX, centerY + 1 * scale);

    // Bottom section with text
    const textY = padding + qrAreaSize + 18 * scale;

    // Divider line
    const lineGradient = ctx.createLinearGradient(padding * 2, 0, canvasWidth - padding * 2, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.2, '#E5E7EB');
    lineGradient.addColorStop(0.8, '#E5E7EB');
    lineGradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(padding * 2, textY - 8 * scale);
    ctx.lineTo(canvasWidth - padding * 2, textY - 8 * scale);
    ctx.stroke();

    // Main text - "امسح للانضمام إلى Diviso"
    ctx.font = `600 ${12 * scale}px "SF Pro Display", "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText('امسح للانضمام إلى Diviso', centerX, textY + 8 * scale);

    // Website link
    ctx.font = `400 ${10 * scale}px "SF Pro Display", "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('www.diviso.app', centerX, textY + 26 * scale);

    // Small decorative dots
    const dotPositions = [
      { x: padding + 12 * scale, y: padding + 12 * scale },
      { x: canvasWidth - padding - 12 * scale, y: padding + 12 * scale },
    ];

    dotPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#22C55E';
      ctx.fill();
    });

  }, []);

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

      // Canvas dimensions
      const canvasWidth = size;
      const bottomTextHeight = 50;
      const canvasHeight = size + bottomTextHeight;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Generate display QR
      await generateProfessionalQR(ctx, canvasWidth, canvasHeight, value, 1);

      // Generate high-resolution version for download
      const hiResCanvas = document.createElement('canvas');
      const scale = 3;
      const hiResWidth = canvasWidth * scale;
      const hiResHeight = canvasHeight * scale;
      
      hiResCanvas.width = hiResWidth;
      hiResCanvas.height = hiResHeight;
      
      const hiResCtx = hiResCanvas.getContext('2d');
      if (hiResCtx) {
        await generateProfessionalQR(hiResCtx, hiResWidth, hiResHeight, value, scale);
        setQrDataUrl(hiResCanvas.toDataURL('image/png', 1.0));
      }

    } catch (error) {
      console.error('Error generating custom QR code:', error);
      setError('فشل في توليد رمز QR');
      toast.error('خطأ في توليد رمز QR');
    } finally {
      setIsLoading(false);
    }
  }, [value, size, generateProfessionalQR]);

  useEffect(() => {
    generateCustomQRCode();
  }, [generateCustomQRCode]);

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = 'diviso-qr-code.png';
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل رمز QR بنجاح');
  };

  const shareQRCode = async () => {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'diviso-qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'رمز QR - Diviso',
          text: 'امسح هذا الرمز للانضمام إلى Diviso',
          files: [file],
        });
      } else {
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
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-2xl border">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <Button onClick={retryGeneration} variant="outline" size="sm">
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="max-w-full h-auto rounded-2xl"
            style={{ minHeight: size + 50, minWidth: size }}
          />
        )}
      </div>
      
      {showActions && !error && (
        <div className="flex gap-2">
          <Button 
            onClick={downloadQRCode} 
            variant="outline" 
            size="sm" 
            disabled={!qrDataUrl || isLoading}
            className="rounded-full"
          >
            <Download className="w-4 h-4 ml-2" />
            تحميل
          </Button>
          
          <Button 
            onClick={shareQRCode} 
            variant="outline" 
            size="sm" 
            disabled={!qrDataUrl || isLoading}
            className="rounded-full"
          >
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!qrDataUrl || isLoading}
                className="rounded-full"
              >
                <Maximize2 className="w-4 h-4 ml-2" />
                تكبير
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">رمز QR - Diviso</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                {qrDataUrl && (
                  <img 
                    src={qrDataUrl} 
                    alt="رمز QR للإحالة" 
                    className="w-full max-w-[320px] h-auto rounded-2xl shadow-lg"
                  />
                )}
              </div>
              <div className="flex justify-center gap-2 pb-2">
                <Button onClick={downloadQRCode} size="sm" className="rounded-full">
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </Button>
                <Button onClick={shareQRCode} variant="outline" size="sm" className="rounded-full">
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

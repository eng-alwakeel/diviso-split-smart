import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Maximize2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, size = 200, className = "" }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [value, size]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !value) return;

    try {
      await QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: 'hsl(var(--foreground))',
          light: 'hsl(var(--background))',
        },
      });

      // Generate data URL for download
      const dataUrl = await QRCode.toDataURL(value, {
        width: size * 2, // Higher resolution for download
        margin: 1,
        color: {
          dark: 'hsl(var(--foreground))',
          light: 'hsl(var(--background))',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('خطأ في توليد رمز QR');
    }
  };

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

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="bg-background p-4 rounded-lg border">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={downloadQRCode} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          تحميل
        </Button>
        
        <Button onClick={shareQRCode} variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          مشاركة
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-2" />
              عرض كبير
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>رمز QR للإحالة</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <QRCodeDisplay value={value} size={300} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
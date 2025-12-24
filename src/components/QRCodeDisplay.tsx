import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
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
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!value?.trim()) {
      setError('قيمة الرابط غير صحيحة');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Brand color: hsl(73 66% 71%) = #C8F169
      // Darker version for QR readability: hsl(73 66% 35%) ≈ #6B8A1F
      const qrMainColor = "#6B8A1F"; // Darker brand color for readability
      const qrCornerColor = "#5A7519"; // Even darker for corners
      
      // Create QR code instance
      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        data: value,
        image: "/favicon.png",
        dotsOptions: {
          color: qrMainColor,
          type: "rounded"
        },
        cornersSquareOptions: {
          color: qrCornerColor,
          type: "extra-rounded"
        },
        cornersDotOptions: {
          color: qrMainColor,
          type: "dot"
        },
        backgroundOptions: {
          color: "#ffffff"
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 6,
          imageSize: 0.3,
          hideBackgroundDots: true
        },
        qrOptions: {
          errorCorrectionLevel: 'H'
        }
      });

      qrCodeRef.current = qrCode;

      // Clear and append
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrCode.append(qrRef.current);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('فشل في توليد رمز QR');
      setIsLoading(false);
    }
  }, [value, size]);

  const downloadQRCode = async () => {
    if (!qrCodeRef.current) return;

    try {
      await qrCodeRef.current.download({
        name: "diviso-qr-code",
        extension: "png"
      });
      toast.success('تم تحميل رمز QR بنجاح');
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast.error('خطأ في تحميل رمز QR');
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeRef.current) return;

    try {
      const rawData = await qrCodeRef.current.getRawData('png');
      if (!rawData) {
        toast.error('خطأ في تحضير رمز QR');
        return;
      }

      // Convert to Blob if it's a Buffer
      let blob: Blob;
      if (rawData instanceof Blob) {
        blob = rawData;
      } else if (Buffer.isBuffer(rawData)) {
        blob = new Blob([new Uint8Array(rawData)], { type: 'image/png' });
      } else {
        blob = new Blob([rawData as ArrayBuffer], { type: 'image/png' });
      }
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
    } catch (err) {
      console.error('Error sharing QR code:', err);
      toast.error('خطأ في مشاركة رمز QR');
    }
  };

  const retryGeneration = () => {
    setError('');
    setIsLoading(true);
    
    if (qrCodeRef.current && qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCodeRef.current.append(qrRef.current);
    }
    
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* QR Container with frame */}
      <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-2xl border border-primary/20 shadow-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-xl">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <Button onClick={retryGeneration} variant="outline" size="sm">
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <div className="bg-white p-3 rounded-xl shadow-inner">
            <div 
              ref={qrRef} 
              className="flex items-center justify-center"
              style={{ minHeight: size, minWidth: size }}
            />
          </div>
        )}

        {/* Bottom text */}
        {!error && (
          <div className="mt-3 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              امسح للانضمام إلى Diviso
            </p>
            <p className="text-xs text-muted-foreground">
              www.diviso.app
            </p>
          </div>
        )}
      </div>
      
      {/* Actions */}
      {showActions && !error && (
        <div className="flex gap-2">
          <Button 
            onClick={downloadQRCode} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="rounded-full"
          >
            <Download className="w-4 h-4 ml-2" />
            تحميل
          </Button>
          
          <Button 
            onClick={shareQRCode} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
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
                disabled={isLoading}
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
              <div className="flex flex-col items-center p-4 space-y-4">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-2xl border border-primary/20">
                  <div className="bg-white p-4 rounded-xl shadow-inner">
                    <QRCodeLarge value={value} size={280} />
                  </div>
                  <div className="mt-4 text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      امسح للانضمام إلى Diviso
                    </p>
                    <p className="text-xs text-muted-foreground">
                      www.diviso.app
                    </p>
                  </div>
                </div>
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

// Separate component for large QR in dialog
function QRCodeLarge({ value, size }: { value: string; size: number }) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.trim() || !qrRef.current) return;

    // Brand color: hsl(73 66% 71%) = #C8F169
    // Darker version for QR readability: hsl(73 66% 35%) ≈ #6B8A1F
    const qrMainColor = "#6B8A1F";
    const qrCornerColor = "#5A7519";
    
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      data: value,
      image: "/favicon.png",
      dotsOptions: {
        color: qrMainColor,
        type: "rounded"
      },
      cornersSquareOptions: {
        color: qrCornerColor,
        type: "extra-rounded"
      },
      cornersDotOptions: {
        color: qrMainColor,
        type: "dot"
      },
      backgroundOptions: {
        color: "#ffffff"
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: 0.3,
        hideBackgroundDots: true
      },
      qrOptions: {
        errorCorrectionLevel: 'H'
      }
    });

    qrRef.current.innerHTML = '';
    qrCode.append(qrRef.current);
  }, [value, size]);

  return (
    <div 
      ref={qrRef} 
      className="flex items-center justify-center"
      style={{ minHeight: size, minWidth: size }}
    />
  );
}

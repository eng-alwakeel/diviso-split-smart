import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Maximize2, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  shortUrl?: string;
}

// Brand QR config (Version A) — for in-app display only
function createBrandQR(size: number, value: string) {
  return new QRCodeStyling({
    width: size,
    height: size,
    data: value,
    image: "/favicon.png",
    dotsOptions: {
      color: "#1A1C1E",
      type: "square"
    },
    cornersSquareOptions: {
      color: "#1A1C1E",
      type: "square"
    },
    cornersDotOptions: {
      color: "#1A1C1E",
      type: "square"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: 0.2,
      hideBackgroundDots: true
    },
    qrOptions: {
      errorCorrectionLevel: 'H'
    }
  });
}

// Functional QR config (Version B) — for download/share, high contrast
function createFunctionalQR(value: string) {
  return new QRCodeStyling({
    width: 1024,
    height: 1024,
    data: value,
    dotsOptions: {
      color: "#000000",
      type: "square"
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "square"
    },
    cornersDotOptions: {
      color: "#000000",
      type: "square"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0,
      imageSize: 0,
      hideBackgroundDots: true
    },
    qrOptions: {
      errorCorrectionLevel: 'H'
    }
  });
}

export function QRCodeDisplay({ value, size = 200, className = "", showActions = true, shortUrl }: QRCodeDisplayProps) {
  const { t } = useTranslation('referral');
  const brandRef = useRef<HTMLDivElement>(null);
  const functionalRef = useRef<HTMLDivElement>(null);
  const brandQrRef = useRef<QRCodeStyling | null>(null);
  const functionalQrRef = useRef<QRCodeStyling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!value?.trim()) {
      setError(t('qr.invalid_link'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Version A: Brand (display)
      const brandQr = createBrandQR(size, value);
      brandQrRef.current = brandQr;

      if (brandRef.current) {
        brandRef.current.innerHTML = '';
        brandQr.append(brandRef.current);
      }

      // Version B: Functional (download/share) — hidden
      const funcQr = createFunctionalQR(value);
      functionalQrRef.current = funcQr;

      if (functionalRef.current) {
        functionalRef.current.innerHTML = '';
        funcQr.append(functionalRef.current);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(t('qr.generation_failed'));
      setIsLoading(false);
    }
  }, [value, size, t]);

  // Download always uses Functional (Version B)
  const downloadQRCode = async () => {
    if (!functionalQrRef.current) return;

    try {
      await functionalQrRef.current.download({
        name: "diviso-qr-code",
        extension: "png"
      });
      toast.success(t('qr.download_success'));
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast.error(t('qr.download_error'));
    }
  };

  // Share always uses Functional (Version B)
  const shareQRCode = async () => {
    if (!functionalQrRef.current) return;

    try {
      const rawData = await functionalQrRef.current.getRawData('png');
      if (!rawData) {
        toast.error(t('qr.prepare_error'));
        return;
      }

      let blob: Blob;
      if (rawData instanceof Blob) {
        blob = rawData;
      } else if (rawData instanceof ArrayBuffer) {
        blob = new Blob([rawData], { type: 'image/png' });
      } else {
        blob = new Blob([new Uint8Array(rawData as unknown as ArrayBuffer)], { type: 'image/png' });
      }
      const file = new File([blob], 'diviso-qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: t('qr.title'),
          text: t('qr.scan_to_join_group'),
          files: [file],
        });
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        toast.success(t('qr.copied_to_clipboard'));
      }
    } catch (err) {
      console.error('Error sharing QR code:', err);
      toast.error(t('qr.share_error'));
    }
  };

  const retryGeneration = () => {
    setError('');
    setIsLoading(true);
    
    if (brandQrRef.current && brandRef.current) {
      brandRef.current.innerHTML = '';
      brandQrRef.current.append(brandRef.current);
    }
    
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Hidden functional QR for download/share */}
      <div ref={functionalRef} className="hidden" aria-hidden="true" />

      {/* Brand QR Container */}
      <div className="relative bg-card p-3 rounded-xl border border-border shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <Button onClick={retryGeneration} variant="outline" size="sm">
              {t('qr.retry')}
            </Button>
          </div>
        ) : (
          <div className="bg-white p-2 rounded-lg">
            <div 
              ref={brandRef} 
              className="flex items-center justify-center"
              style={{ minHeight: size, minWidth: size }}
            />
          </div>
        )}

        {/* Bottom text */}
        {!error && (
          <div className="mt-2 text-center space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {t('qr.join_group')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('qr.scan_instruction')}
            </p>
            {shortUrl && (
              <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">
                {shortUrl}
              </p>
            )}
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
            <Download className="w-4 h-4 me-2" />
            {t('qr.download')}
          </Button>
          
          <Button 
            onClick={shareQRCode} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="rounded-full"
          >
            <Share2 className="w-4 h-4 me-2" />
            {t('qr.share')}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isLoading}
                className="rounded-full"
              >
                <Maximize2 className="w-4 h-4 me-2" />
                {t('qr.enlarge')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">{t('qr.title')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center p-4 space-y-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeLarge value={value} size={280} />
                  </div>
                  <div className="mt-3 text-center space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {t('qr.join_group')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('qr.scan_instruction')}
                    </p>
                    {shortUrl && (
                      <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">
                        {shortUrl}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-2 pb-2">
                <Button onClick={downloadQRCode} size="sm" className="rounded-full">
                  <Download className="w-4 h-4 me-2" />
                  {t('qr.download')}
                </Button>
                <Button onClick={shareQRCode} variant="outline" size="sm" className="rounded-full">
                  <Share2 className="w-4 h-4 me-2" />
                  {t('qr.share')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

// Separate component for large QR in dialog — uses Brand styling
function QRCodeLarge({ value, size }: { value: string; size: number }) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.trim() || !qrRef.current) return;

    const qrCode = createBrandQR(size, value);
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
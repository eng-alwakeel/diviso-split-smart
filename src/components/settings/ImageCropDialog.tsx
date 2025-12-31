import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropDialogProps) {
  const { t } = useTranslation(['settings']);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const outputSize = 256; // حجم الصورة النهائية
    canvas.width = outputSize;
    canvas.height = outputSize;

    // رسم دائرة للقص
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // حساب التحويلات
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // تطبيق التدوير والتكبير
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-outputSize / 2, -outputSize / 2);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          handleClose();
        }
      },
      'image/png',
      1
    );
  }, [completedCrop, scale, rotate, onCropComplete]);

  const handleClose = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    onOpenChange(false);
  };

  const handleRotateLeft = () => {
    setRotate((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotate((prev) => prev + 90);
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('settings:image_crop.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* منطقة القص */}
          <div className="flex justify-center bg-muted/30 rounded-lg p-4 overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-h-64"
            >
              <img
                ref={imgRef}
                alt="Crop"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '256px',
                  maxWidth: '100%',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* أدوات التحكم */}
          <div className="space-y-4">
            {/* التكبير */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ZoomOut className="w-4 h-4" />
                </span>
                <span>{t('settings:image_crop.zoom')}</span>
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-4 h-4" />
                </span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* التدوير */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateLeft}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('settings:image_crop.rotate_left')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateRight}
                className="gap-2"
              >
                <RotateCw className="w-4 h-4" />
                {t('settings:image_crop.rotate_right')}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X className="w-4 h-4" />
            {t('settings:image_crop.cancel')}
          </Button>
          <Button onClick={handleCropComplete} className="gap-2">
            <Check className="w-4 h-4" />
            {t('settings:image_crop.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

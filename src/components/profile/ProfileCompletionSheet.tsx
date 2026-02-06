import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserReputation } from '@/hooks/useUserReputation';

interface ProfileCompletionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
}

export const ProfileCompletionSheet = ({ 
  open, 
  onOpenChange 
}: ProfileCompletionSheetProps) => {
  const navigate = useNavigate();
  const { calculateProfileCompletion, getCompletionStatus } = useUserReputation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('display_name, name, avatar_url, city, bio')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data as ProfileData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open]);

  const completion = profile ? calculateProfileCompletion(profile) : 0;
  const status = getCompletionStatus(completion);

  const getFieldStatus = (value: string | null): boolean => !!value;

  const handleCompleteNow = () => {
    onOpenChange(false);
    navigate('/settings?tab=profile');
  };

  const handleLater = () => {
    onOpenChange(false);
  };

  if (loading || !profile) {
    return null;
  }

  // Don't show if profile is already complete
  if (completion >= 100) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-xl">أكمل بروفايلك</SheetTitle>
          <SheetDescription>
            بروفايل مكتمل يساعد أعضاء مجموعتك على التعرف عليك
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Completion Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">نسبة الاكتمال</span>
              <span className={`text-sm font-bold ${status.color}`}>
                {completion}%
              </span>
            </div>
            <Progress value={completion} className="h-3" />
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              getFieldStatus(profile.display_name || profile.name) 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-muted/50 border border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getFieldStatus(profile.display_name || profile.name) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted-foreground/20'
              }`}>
                {getFieldStatus(profile.display_name || profile.name) 
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <User className="w-4 h-4" />
                }
              </div>
              <span className={getFieldStatus(profile.display_name || profile.name) ? '' : 'text-muted-foreground'}>
                الاسم
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              getFieldStatus(profile.avatar_url) 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-muted/50 border border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getFieldStatus(profile.avatar_url) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted-foreground/20'
              }`}>
                {getFieldStatus(profile.avatar_url) 
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Camera className="w-4 h-4" />
                }
              </div>
              <span className={getFieldStatus(profile.avatar_url) ? '' : 'text-muted-foreground'}>
                صورة البروفايل
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              getFieldStatus(profile.city) 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-muted/50 border border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getFieldStatus(profile.city) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted-foreground/20'
              }`}>
                {getFieldStatus(profile.city) 
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <MapPin className="w-4 h-4" />
                }
              </div>
              <span className={getFieldStatus(profile.city) ? '' : 'text-muted-foreground'}>
                المدينة (اختياري)
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              getFieldStatus(profile.bio) 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-muted/50 border border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getFieldStatus(profile.bio) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted-foreground/20'
              }`}>
                {getFieldStatus(profile.bio) 
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <FileText className="w-4 h-4" />
                }
              </div>
              <span className={getFieldStatus(profile.bio) ? '' : 'text-muted-foreground'}>
                نبذة قصيرة (اختياري)
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleCompleteNow}
            className="w-full"
            variant="hero"
          >
            أكمل الآن
          </Button>
          <Button 
            onClick={handleLater}
            variant="ghost"
            className="w-full"
          >
            لاحقاً
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

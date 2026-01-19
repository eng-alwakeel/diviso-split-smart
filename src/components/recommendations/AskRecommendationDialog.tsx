import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Hotel, 
  Utensils, 
  MapPin, 
  Car, 
  Loader2, 
  Star,
  ExternalLink,
  Plus,
  Coins
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUsageCredits } from "@/hooks/useUsageCredits";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";

interface AskRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  city?: string;
}

type RequestType = 'hotel' | 'restaurant' | 'activity' | 'transport';
type Budget = 'low' | 'medium' | 'high' | 'luxury';
type Distance = 'near' | 'medium' | 'far';
type Timing = 'morning' | 'afternoon' | 'evening' | 'night';

interface Recommendation {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  rating: number;
  priceRange: string;
  estimatedPrice?: number;
  currency: string;
  description: string;
  descriptionAr: string;
  relevanceReason: string;
  affiliateUrl?: string;
}

const requestTypes: { value: RequestType; labelAr: string; labelEn: string; icon: any }[] = [
  { value: 'hotel', labelAr: 'فندق', labelEn: 'Hotel', icon: Hotel },
  { value: 'restaurant', labelAr: 'مطعم', labelEn: 'Restaurant', icon: Utensils },
  { value: 'activity', labelAr: 'نشاط', labelEn: 'Activity', icon: MapPin },
  { value: 'transport', labelAr: 'مواصلات', labelEn: 'Transport', icon: Car },
];

export function AskRecommendationDialog({ 
  open, 
  onOpenChange, 
  groupId,
  city: initialCity 
}: AskRecommendationDialogProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = useState<'type' | 'preferences' | 'results'>('type');
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('restaurant');
  const [preferences, setPreferences] = useState({
    budget: 'medium' as Budget,
    distance: 'near' as Distance,
    has_children: false,
    timing: 'afternoon' as Timing,
    city: initialCity || '',
    special_requirements: ''
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const handleSelectType = (type: RequestType) => {
    setRequestType(type);
    setStep('preferences');
  };

  const handleSubmit = async () => {
    // Check credits before making the request
    const creditCheck = await checkCredits('recommendation');
    if (!creditCheck.canPerform) {
      setShowInsufficientDialog(true);
      return;
    }

    setLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://iwthriddasxzbjddpzzf.functions.supabase.co/ask-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`
          },
          body: JSON.stringify({
            group_id: groupId,
            request_type: requestType,
            preferences
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations) {
          // Consume credits after successful recommendation
          await consumeCredits('recommendation');
          setRecommendations(data.recommendations);
          setStep('results');
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsExpense = (rec: Recommendation) => {
    navigate(`/add-expense?groupId=${groupId}&description=${encodeURIComponent(rec.nameAr || rec.name)}&amount=${rec.estimatedPrice || ''}`);
    onOpenChange(false);
  };

  const handleReset = () => {
    setStep('type');
    setRecommendations([]);
  };

  const renderTypeSelection = () => (
    <div className="grid grid-cols-2 gap-3">
      {requestTypes.map(type => {
        const Icon = type.icon;
        return (
          <Button
            key={type.value}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5"
            onClick={() => handleSelectType(type.value)}
          >
            <Icon className="w-6 h-6" />
            <span>{isRTL ? type.labelAr : type.labelEn}</span>
          </Button>
        );
      })}
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-4">
      {/* City */}
      <div className="space-y-2">
        <Label>{isRTL ? 'المدينة' : 'City'}</Label>
        <Input
          value={preferences.city}
          onChange={e => setPreferences(p => ({ ...p, city: e.target.value }))}
          placeholder={isRTL ? 'مثال: الرياض' : 'e.g. Riyadh'}
        />
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label>{isRTL ? 'الميزانية' : 'Budget'}</Label>
        <RadioGroup
          value={preferences.budget}
          onValueChange={v => setPreferences(p => ({ ...p, budget: v as Budget }))}
          className="flex flex-wrap gap-2"
        >
          {[
            { value: 'low', labelAr: 'اقتصادي', labelEn: 'Budget' },
            { value: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
            { value: 'high', labelAr: 'فاخر', labelEn: 'High' },
            { value: 'luxury', labelAr: 'فخم', labelEn: 'Luxury' },
          ].map(opt => (
            <Label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                preferences.budget === opt.value 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={opt.value} className="sr-only" />
              {isRTL ? opt.labelAr : opt.labelEn}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Timing */}
      <div className="space-y-2">
        <Label>{isRTL ? 'التوقيت' : 'Timing'}</Label>
        <RadioGroup
          value={preferences.timing}
          onValueChange={v => setPreferences(p => ({ ...p, timing: v as Timing }))}
          className="flex flex-wrap gap-2"
        >
          {[
            { value: 'morning', labelAr: 'صباحاً', labelEn: 'Morning' },
            { value: 'afternoon', labelAr: 'ظهراً', labelEn: 'Afternoon' },
            { value: 'evening', labelAr: 'مساءً', labelEn: 'Evening' },
            { value: 'night', labelAr: 'ليلاً', labelEn: 'Night' },
          ].map(opt => (
            <Label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                preferences.timing === opt.value 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={opt.value} className="sr-only" />
              {isRTL ? opt.labelAr : opt.labelEn}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Has children */}
      <div className="flex items-center justify-between">
        <Label>{isRTL ? 'مناسب للأطفال' : 'Child-friendly'}</Label>
        <Switch
          checked={preferences.has_children}
          onCheckedChange={v => setPreferences(p => ({ ...p, has_children: v }))}
        />
      </div>

      {/* Special requirements */}
      <div className="space-y-2">
        <Label>{isRTL ? 'ملاحظات إضافية' : 'Special requirements'}</Label>
        <Textarea
          value={preferences.special_requirements}
          onChange={e => setPreferences(p => ({ ...p, special_requirements: e.target.value }))}
          placeholder={isRTL ? 'مثال: نباتي، كراسي متحركة...' : 'e.g. vegetarian, wheelchair access...'}
          rows={2}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => setStep('type')} className="flex-1">
          {isRTL ? 'رجوع' : 'Back'}
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !preferences.city} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isRTL ? 'جاري البحث...' : 'Searching...'}
            </>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-1" />
              {isRTL ? 'ابحث (1 نقطة)' : 'Search (1 credit)'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <Card key={rec.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">
                      {isRTL ? rec.nameAr : rec.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRTL ? rec.descriptionAr : rec.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {rec.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">{rec.rating}</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {rec.priceRange}
                      </Badge>
                      {rec.estimatedPrice && (
                        <span className="text-xs text-muted-foreground">
                          ~{rec.estimatedPrice} {rec.currency}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-primary mt-2">
                      {rec.relevanceReason}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {groupId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddAsExpense(rec)}
                      className="flex-1"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {isRTL ? 'أضف كمصروف' : 'Add as expense'}
                    </Button>
                  )}
                  {rec.affiliateUrl && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => window.open(rec.affiliateUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {isRTL ? 'احجز' : 'Book'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={handleReset} className="w-full">
        {isRTL ? 'بحث جديد' : 'New Search'}
      </Button>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case 'type':
        return isRTL ? 'أبغى توصية...' : 'I want a recommendation...';
      case 'preferences':
        const typeLabel = requestTypes.find(t => t.value === requestType);
        return isRTL 
          ? `أبغى ${typeLabel?.labelAr}` 
          : `Looking for ${typeLabel?.labelEn}`;
      case 'results':
        return isRTL ? 'الاقتراحات' : 'Suggestions';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>

          {step === 'type' && renderTypeSelection()}
          {step === 'preferences' && renderPreferences()}
          {step === 'results' && renderResults()}
        </DialogContent>
      </Dialog>

      <ZeroCreditsPaywall
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        actionName="recommendation"
      />
    </>
  );
}

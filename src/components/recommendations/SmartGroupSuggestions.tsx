import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Hotel, 
  Utensils, 
  MapPin, 
  Car, 
  Smartphone, 
  ExternalLink, 
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Suggestion {
  id: string;
  type: 'hotel' | 'activity' | 'esim' | 'car_rental' | 'restaurant';
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price?: number;
  priceRange?: string;
  currency?: string;
  rating?: number;
  affiliateUrl?: string;
  imageUrl?: string;
  partnerName?: string;
}

interface SmartGroupSuggestionsProps {
  groupId: string;
  city?: string;
  destination?: string;
}

const typeIcons: Record<string, any> = {
  hotel: Hotel,
  activity: MapPin,
  esim: Smartphone,
  car_rental: Car,
  restaurant: Utensils
};

const typeLabels: Record<string, { en: string; ar: string }> = {
  hotel: { en: 'Hotels', ar: 'فنادق' },
  activity: { en: 'Activities', ar: 'أنشطة' },
  esim: { en: 'eSIM', ar: 'شريحة إنترنت' },
  car_rental: { en: 'Car Rental', ar: 'تأجير سيارة' },
  restaurant: { en: 'Restaurants', ar: 'مطاعم' }
};

export function SmartGroupSuggestions({ groupId, city, destination }: SmartGroupSuggestionsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<{
    hotels: Suggestion[];
    activities: Suggestion[];
    esim: Suggestion | null;
    carRental: Suggestion | null;
  }>({
    hotels: [],
    activities: [],
    esim: null,
    carRental: null
  });

  useEffect(() => {
    fetchSuggestions();
  }, [groupId, city, destination]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch(
        `https://iwthriddasxzbjddpzzf.functions.supabase.co/smart-group-suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`
          },
          body: JSON.stringify({
            group_id: groupId,
            city,
            destination
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderSuggestionCard = (suggestion: Suggestion) => {
    const Icon = typeIcons[suggestion.type] || MapPin;
    const name = isRTL && suggestion.nameAr ? suggestion.nameAr : suggestion.name;
    const description = isRTL && suggestion.descriptionAr ? suggestion.descriptionAr : suggestion.description;

    return (
      <Card key={suggestion.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
        {suggestion.partnerName && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
            {suggestion.partnerName}
          </Badge>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                {suggestion.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{suggestion.rating}</span>
                  </div>
                )}
                
                {(suggestion.price || suggestion.priceRange) && (
                  <Badge variant="outline" className="text-xs">
                    {suggestion.price 
                      ? `${suggestion.price} ${suggestion.currency || 'USD'}`
                      : suggestion.priceRange
                    }
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {suggestion.affiliateUrl && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => handleOpenLink(suggestion.affiliateUrl)}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              {isRTL ? 'افتح العرض' : 'View Offer'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSection = (title: string, titleAr: string, items: Suggestion[], icon: any) => {
    if (items.length === 0) return null;
    const Icon = icon;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {isRTL ? titleAr : title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(renderSuggestionCard)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnySuggestions = 
    suggestions.hotels.length > 0 ||
    suggestions.activities.length > 0 ||
    suggestions.esim ||
    suggestions.carRental;

  if (!hasAnySuggestions) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          {isRTL ? 'اقتراحات ذكية' : 'Smart Suggestions'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isRTL 
            ? 'اقتراحات مخصصة بناءً على نشاط مجموعتك'
            : 'Personalized suggestions based on your group activity'
          }
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Hotels */}
        {renderSection('Hotels', 'فنادق', suggestions.hotels, Hotel)}
        
        {/* Activities */}
        {renderSection('Activities', 'أنشطة', suggestions.activities, MapPin)}
        
        {/* Single items: eSIM and Car Rental */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.esim && renderSuggestionCard(suggestions.esim)}
          {suggestions.carRental && renderSuggestionCard(suggestions.carRental)}
        </div>
      </CardContent>
    </Card>
  );
}

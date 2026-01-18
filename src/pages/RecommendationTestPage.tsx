import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  RotateCcw,
  Utensils,
  Moon,
  Calendar,
  Receipt,
  Sparkles,
  Settings,
  Bell,
  MessageSquare,
  ArrowLeft
} from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useRecommendationSettings } from "@/hooks/useRecommendationSettings";
import { useRecommendationTriggers } from "@/hooks/useRecommendationTriggers";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { RecommendationDialog } from "@/components/recommendations/RecommendationDialog";
import { RecommendationNotification } from "@/components/recommendations/RecommendationNotification";
import { AskRecommendationDialog } from "@/components/recommendations/AskRecommendationDialog";
import { toast } from "@/hooks/use-toast";

type TriggerType = "planning" | "meal_time" | "post_expense" | "end_of_day";

export default function RecommendationTestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  // Test configuration state
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>("meal_time");
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["food"]);

  // API response state
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Dialog states
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);

  // Notification test states
  const [showLunchNotification, setShowLunchNotification] = useState(false);
  const [showDinnerNotification, setShowDinnerNotification] = useState(false);
  const [showPlanningNotification, setShowPlanningNotification] = useState(false);
  const [showPostExpenseNotification, setShowPostExpenseNotification] = useState(false);

  // Hooks
  const { 
    generateRecommendation, 
    currentRecommendation, 
    isLoading,
    addAsExpense,
    dismissRecommendation 
  } = useRecommendations();
  
  const { 
    settings, 
    isEnabled, 
    checkDailyLimit,
    isLoading: settingsLoading 
  } = useRecommendationSettings();

  const triggerState = useRecommendationTriggers({});

  const triggers: { type: TriggerType; label: string; icon: React.ReactNode }[] = [
    { type: "planning", label: "Planning", icon: <Calendar className="h-4 w-4" /> },
    { type: "meal_time", label: "Meal Time", icon: <Utensils className="h-4 w-4" /> },
    { type: "post_expense", label: "Post Expense", icon: <Receipt className="h-4 w-4" /> },
    { type: "end_of_day", label: "End of Day", icon: <Moon className="h-4 w-4" /> },
  ];

  const categories = ["food", "hotel", "activity", "cafe", "shopping", "entertainment"];

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        toast({
          title: "Location Updated",
          description: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      }
    );
  };

  // Generate recommendation
  const handleGenerateRecommendation = async () => {
    setApiError(null);
    setApiResponse(null);
    
    const startTime = Date.now();
    
    try {
      const result = await generateRecommendation({
        trigger: selectedTrigger,
        city: city || undefined,
        district: district || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      });
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setApiResponse(result);
      
      if (result) {
        toast({
          title: "✅ Recommendation Generated",
          description: result.name || "Success",
        });
      } else {
        setApiError("No recommendation returned");
      }
    } catch (error: any) {
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setApiError(error.message || "Unknown error");
      toast({
        title: "❌ Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Copy response to clipboard
  const copyResponse = () => {
    if (apiResponse) {
      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
      toast({ title: "Copied to clipboard" });
    }
  };

  // Reset all state
  const resetState = () => {
    setApiResponse(null);
    setResponseTime(null);
    setApiError(null);
    setCity("Riyadh");
    setDistrict("");
    setLatitude(null);
    setLongitude(null);
    setSelectedCategories(["food"]);
    setSelectedTrigger("meal_time");
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle add as expense from card
  const handleAddAsExpense = (rec: any) => {
    addAsExpense(rec);
    toast({ title: "Navigating to Add Expense..." });
  };

  // Handle open location
  const handleOpenLocation = (rec: any) => {
    if (rec.location?.lat && rec.location?.lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${rec.location.lat},${rec.location.lng}`,
        "_blank"
      );
    }
  };

  // Handle dismiss
  const handleDismiss = (id: string) => {
    dismissRecommendation(id);
    toast({ title: "Recommendation dismissed" });
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Recommendation Test Page</h1>
        </div>
        <Badge variant="outline" className="ml-auto">DEV</Badge>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          {/* Configuration Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trigger Type */}
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <div className="flex flex-wrap gap-2">
                  {triggers.map((trigger) => (
                    <Button
                      key={trigger.type}
                      variant={selectedTrigger === trigger.type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTrigger(trigger.type)}
                      className="gap-2"
                    >
                      {trigger.icon}
                      {trigger.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Riyadh"
                  />
                </div>
                <div className="space-y-2">
                  <Label>District (Optional)</Label>
                  <Input 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g., Olaya"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={getCurrentLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Get My Location
                </Button>
                {latitude && longitude && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleGenerateRecommendation}
                  disabled={isLoading}
                  className="gap-2 flex-1"
                  size="lg"
                >
                  <Play className="h-5 w-5" />
                  {isLoading ? "Generating..." : "Generate Recommendation"}
                </Button>
                {responseTime !== null && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {(responseTime / 1000).toFixed(2)}s
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={resetState}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Status */}
              {apiError && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}
              {apiResponse && !apiError && (
                <div className="mt-3 p-3 bg-green-500/10 rounded-lg flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Recommendation generated successfully</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Response */}
          {apiResponse && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">API Response</CardTitle>
                  <Button variant="ghost" size="sm" onClick={copyResponse} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 rounded-lg bg-muted p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Recommendation Card Preview */}
          {currentRecommendation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">RecommendationCard Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <RecommendationCard
                  recommendation={currentRecommendation}
                  onAddAsExpense={handleAddAsExpense}
                  onOpenLocation={handleOpenLocation}
                  onDismiss={handleDismiss}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLunchNotification(true)}
                  className="gap-2"
                >
                  <Utensils className="h-4 w-4" />
                  Lunch
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDinnerNotification(true)}
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dinner
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPlanningNotification(true)}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Planning
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPostExpenseNotification(true)}
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Post Expense
                </Button>
              </div>

              {/* Notification Previews */}
              <div className="space-y-3 mt-4">
                {showLunchNotification && (
                  <RecommendationNotification
                    type="lunch"
                    placeName="مطعم نجد"
                    onViewRecommendation={() => {
                      toast({ title: "View recommendation clicked" });
                      setShowLunchNotification(false);
                    }}
                    onDismiss={() => setShowLunchNotification(false)}
                  />
                )}
                {showDinnerNotification && (
                  <RecommendationNotification
                    type="dinner"
                    placeName="مطعم الرومانسية"
                    onViewRecommendation={() => {
                      toast({ title: "View recommendation clicked" });
                      setShowDinnerNotification(false);
                    }}
                    onDismiss={() => setShowDinnerNotification(false)}
                  />
                )}
                {showPlanningNotification && (
                  <RecommendationNotification
                    type="planning"
                    placeName="فندق الفيصلية"
                    onViewRecommendation={() => {
                      toast({ title: "View recommendation clicked" });
                      setShowPlanningNotification(false);
                    }}
                    onDismiss={() => setShowPlanningNotification(false)}
                  />
                )}
                {showPostExpenseNotification && (
                  <RecommendationNotification
                    type="post_expense"
                    placeName="كافيه لافندر"
                    onViewRecommendation={() => {
                      toast({ title: "View recommendation clicked" });
                      setShowPostExpenseNotification(false);
                    }}
                    onDismiss={() => setShowPostExpenseNotification(false)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialogs Tab */}
        <TabsContent value="dialogs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Dialog Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRecommendationDialog(true)}
                className="w-full justify-start gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Open RecommendationDialog
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAskDialog(true)}
                className="w-full justify-start gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Open AskRecommendationDialog
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings Status */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  User Settings
                </Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Enabled</span>
                    <Badge variant={isEnabled ? "default" : "secondary"}>
                      {isEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Max/Day</span>
                    <Badge variant="outline">{settings?.max_per_day || 5}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Used Today</span>
                    <Badge variant="outline">{settings?.notifications_today || 0}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Can Trigger</span>
                    <Badge variant={checkDailyLimit() ? "default" : "destructive"}>
                      {checkDailyLimit() ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Current Time Info */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Time Context
                </Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Current Time</span>
                    <Badge variant="outline">{new Date().toLocaleTimeString()}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Hour</span>
                    <Badge variant="outline">{new Date().getHours()}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Is Lunch (11-15)</span>
                    <Badge variant={new Date().getHours() >= 11 && new Date().getHours() < 15 ? "default" : "secondary"}>
                      {new Date().getHours() >= 11 && new Date().getHours() < 15 ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Is Dinner (18-23)</span>
                    <Badge variant={new Date().getHours() >= 18 && new Date().getHours() < 23 ? "default" : "secondary"}>
                      {new Date().getHours() >= 18 && new Date().getHours() < 23 ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trigger State */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Trigger State
                </Label>
                <ScrollArea className="h-32 rounded-lg bg-muted p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(triggerState, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              <Separator />

              {/* Categories */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Preferred Categories
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings?.preferred_categories?.map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  )) || <span className="text-muted-foreground text-sm">None</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RecommendationDialog
        open={showRecommendationDialog}
        onOpenChange={setShowRecommendationDialog}
        recommendation={currentRecommendation || {
          id: "test-id",
          name: "مطعم نجد للأكلات الشعبية",
          name_ar: "مطعم نجد للأكلات الشعبية",
          category: "food",
          rating: 4.5,
          price_range: "$$",
          estimated_price: 80,
          currency: "SAR",
          relevance_reason: "Popular choice for lunch in your area",
          relevance_reason_ar: "خيار شائع للغداء في منطقتك",
          is_partner: true,
          location: {
            address: "العليا، الرياض",
            lat: 24.7136,
            lng: 46.6753,
          },
        }}
        onAddAsExpense={handleAddAsExpense}
        onOpenLocation={handleOpenLocation}
        onDismiss={handleDismiss}
        isLoading={isLoading}
      />

      <AskRecommendationDialog
        open={showAskDialog}
        onOpenChange={setShowAskDialog}
      />
    </div>
  );
}

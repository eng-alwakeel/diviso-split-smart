import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Subscription = () => {
  const [plan, setPlan] = useState<string>('free');
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any).rpc('get_current_plan');
      const row: any = Array.isArray(data) ? data?.[0] : data;
      setPlan(row?.plan_code || 'free');
    };
    load();
  }, []);

  const startCheckout = async (plan_code: string) => {
    const { data, error } = await supabase.functions.invoke('neoleap_create', { body: { plan_code } });
    if (!error && data?.checkout_url) {
      window.location.href = data.checkout_url;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>اشتراكك الحالي: {plan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => startCheckout('pro_monthly')}>ترقية إلى برو - شهري</Button>
            <Button variant="outline" onClick={() => startCheckout('pro_yearly')}>ترقية إلى برو - سنوي</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;

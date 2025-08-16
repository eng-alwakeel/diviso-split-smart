import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useFamilyPlan } from "@/hooks/useFamilyPlan";

export function AcceptFamilyInvite() {
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { acceptInvitation } = useFamilyPlan();

  const handleAcceptInvite = async () => {
    if (!invitationCode.trim()) {
      return;
    }

    setLoading(true);
    try {
      await acceptInvitation(invitationCode.trim().toUpperCase());
      setInvitationCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          الانضمام لخطة عائلية
        </CardTitle>
        <CardDescription>
          إذا كان لديك رمز دعوة للانضمام لخطة عائلية، أدخله هنا
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="invitationCode">رمز الدعوة</Label>
          <Input
            id="invitationCode"
            placeholder="أدخل رمز الدعوة المكون من 8 أحرف"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
        </div>
        
        <Button 
          onClick={handleAcceptInvite}
          disabled={!invitationCode.trim() || loading}
          className="w-full"
        >
          {loading ? "جاري المعالجة..." : "قبول الدعوة"}
        </Button>
      </CardContent>
    </Card>
  );
}
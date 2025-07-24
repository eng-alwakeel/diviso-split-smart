import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  Plus, 
  X, 
  Share2, 
  Copy,
  Phone,
  Link as LinkIcon,
  Coins
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    category: "",
    currency: ""
  });
  const [phoneNumbers, setPhoneNumbers] = useState([""]);
  const [inviteLink, setInviteLink] = useState("");

  const categories = [
    "رحلة", "سكن مشترك", "مشروع عمل", "عشاء جماعي", 
    "هدية جماعية", "حفلة", "رياضة", "أخرى"
  ];

  const currencies = [
    { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    { code: "USD", name: "دولار أمريكي", symbol: "$" },
    { code: "EUR", name: "يورو", symbol: "€" },
    { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
    { code: "KWD", name: "دينار كويتي", symbol: "د.ك" },
    { code: "QAR", name: "ريال قطري", symbol: "ر.ق" }
  ];

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
  };

  const generateInviteLink = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    const link = `https://diviso.app/join/${randomId}`;
    setInviteLink(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  const sendWhatsAppInvite = (phoneNumber: string) => {
    const message = `مرحباً! تمت دعوتك للانضمام لمجموعة "${groupData.name}" على تطبيق ديفيزو لتقسيم المصاريف.\n\nانقر على الرابط للانضمام:\n${inviteLink}`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "تم فتح واتس اب!",
      description: "تم توجيهك لإرسال الدعوة عبر واتس اب",
    });
  };

  const handleCreateGroup = () => {
    // في التطبيق الحقيقي، سترسل البيانات لقاعدة البيانات
    toast({
      title: "تم إنشاء المجموعة!",
      description: `تم إنشاء مجموعة "${groupData.name}" بنجاح`,
    });
    navigate('/dashboard');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      generateInviteLink();
    }
    setCurrentStep(currentStep + 1);
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <h1 className="text-3xl font-bold mb-2">إنشاء مجموعة جديدة</h1>
          <p className="text-muted-foreground">أنشئ مجموعة لتتبع المصاريف المشتركة</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium">معلومات المجموعة</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">دعوة الأعضاء</span>
          </div>
        </div>

        {/* Step 1: Group Information */}
        {currentStep === 1 && (
          <Card className="bg-gradient-group border-0 shadow-group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-group-card-foreground">
                <Users className="w-5 h-5" />
                معلومات المجموعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="groupName">اسم المجموعة</Label>
                <Input
                  id="groupName"
                  placeholder="مثال: رحلة الصيف 2024"
                  value={groupData.name}
                  onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  placeholder="وصف قصير عن المجموعة..."
                  value={groupData.description}
                  onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label>نوع المجموعة</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={groupData.category === category ? "default" : "outline"}
                      className="cursor-pointer justify-center py-2 hover:bg-accent"
                      onClick={() => setGroupData({...groupData, category})}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>العملة الرئيسية</Label>
                <Select value={groupData.currency} onValueChange={(value) => setGroupData({...groupData, currency: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر العملة" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          <span>{currency.name} ({currency.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ⚠️ لا يمكن تغيير العملة بعد إنشاء المجموعة
                </p>
              </div>

              <Button 
                onClick={nextStep}
                disabled={!groupData.name || !groupData.currency}
                className="w-full"
                variant="hero"
              >
                المتابعة لدعوة الأعضاء
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Invite Members */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Phone Numbers */}
            <Card className="bg-gradient-expense border-0 shadow-expense">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-expense-light-foreground">
                  <Phone className="w-5 h-5" />
                  دعوة عبر رقم الجوال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="966xxxxxxxxx"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="text-left"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      disabled={!phone.trim()}
                      onClick={() => sendWhatsAppInvite(phone)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      إرسال
                    </Button>
                    {phoneNumbers.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhone(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={handleAddPhone}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة رقم آخر
                </Button>
              </CardContent>
            </Card>

            {/* Invite Link */}
            <Card className="bg-gradient-total border-0 shadow-total">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-total-card-foreground">
                  <LinkIcon className="w-5 h-5" />
                  رابط الدعوة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  شارك هذا الرابط مع أي شخص تريد دعوته للمجموعة
                </p>
                
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="text-left"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(inviteLink)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `انضم لمجموعة ${groupData.name}`,
                          url: inviteLink
                        });
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                العودة
              </Button>
              <Button
                onClick={handleCreateGroup}
                className="flex-1"
                variant="hero"
              >
                إنشاء المجموعة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroup;
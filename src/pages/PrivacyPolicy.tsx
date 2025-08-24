import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Lock, Eye, Edit, Trash, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            سياسة الخصوصية
          </h1>
          <p className="text-muted-foreground">
            نحن ملتزمون بحماية خصوصيتك والالتزام بنظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            {/* البيانات التي نجمعها */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">1. البيانات التي نجمعها</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">عند استخدامك للتطبيق، قد نطلب منك تزويدنا بالمعلومات التالية:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-4">
                  <li>الاسم الكامل</li>
                  <li>رقم الجوال</li>
                  <li>البريد الإلكتروني</li>
                </ul>
              </div>
            </section>

            {/* كيفية استخدام البيانات */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">2. كيفية استخدام البيانات</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">نستخدم بياناتك الشخصية للأغراض التالية فقط:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-4">
                  <li>إنشاء حسابك في التطبيق</li>
                  <li>التواصل معك بشأن التحديثات أو الخدمات</li>
                  <li>تحسين تجربتك داخل التطبيق</li>
                </ul>
              </div>
            </section>

            {/* حماية البيانات */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Lock className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">3. حماية البيانات</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-4">
                  <li>يتم تخزين بياناتك في بيئة آمنة</li>
                  <li>نستخدم وسائل تقنية مناسبة لحمايتها من الوصول غير المصرح به أو التعديل أو الإفصاح</li>
                  <li>لا نشارك بياناتك مع أي طرف ثالث إلا إذا كان ذلك مطلوبًا بموجب القانون أو بموافقتك المسبقة</li>
                </ul>
              </div>
            </section>

            {/* حقوقك */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">4. حقوقك</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">بموجب نظام حماية البيانات الشخصية (PDPL)، لك الحق في:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-4">
                  <li>الاطلاع على بياناتك الشخصية</li>
                  <li>طلب تعديلها أو تحديثها</li>
                  <li>طلب حذفها متى ما رغبت</li>
                </ul>
              </div>
            </section>

            {/* موافقتك */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold">5. موافقتك</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  باستخدامك للتطبيق، فإنك توافق على جمع واستخدام بياناتك وفقًا لهذه السياسة.
                </p>
              </div>
            </section>

            {/* التعديلات */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Edit className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">6. التعديلات</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  قد نقوم بتحديث سياسة الخصوصية من وقت لآخر، وسيتم إشعارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.
                </p>
              </div>
            </section>

            {/* التواصل معنا */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold">7. التواصل معنا</h2>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
                <p className="text-foreground mb-4">
                  إذا كان لديك أي استفسار حول هذه السياسة أو استخدام بياناتك، يمكنك التواصل معنا عبر:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p>📧 البريد الإلكتروني: support@diviso.app</p>
                  <p>📞 رقم الجوال: +966500000000</p>
                </div>
              </div>
            </section>

            {/* تاريخ التحديث */}
            <div className="text-center pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => navigate(-1)} 
            className="gap-2"
            size="lg"
          >
            <ArrowRight className="h-4 w-4" />
            العودة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Users, UserPlus, Mail, Phone, Crown, Shield, User, Trash2, Copy, Clock } from "lucide-react";
import { useFamilyPlan } from "@/hooks/useFamilyPlan";
import { toast } from "sonner";

export function FamilyPlanManagement() {
  const { members, invitations, loading, isOwner, hasFamilyPlan, inviteMember, removeMember, cancelInvitation, leaveFamily } = useFamilyPlan();
  const [inviteForm, setInviteForm] = useState({
    emailOrPhone: "",
    role: "member" as "admin" | "member"
  });
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleInvite = async () => {
    if (!inviteForm.emailOrPhone.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف");
      return;
    }

    const success = await inviteMember(inviteForm.emailOrPhone, inviteForm.role);
    if (success) {
      setInviteForm({ emailOrPhone: "", role: "member" });
      setShowInviteForm(false);
    }
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ رمز الدعوة");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'المالك';
      case 'admin': return 'مدير';
      default: return 'عضو';
    }
  };

  const getMemberDisplayName = (member: any) => {
    return member.profile?.display_name || member.profile?.name || 'مستخدم';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إدارة الخطة العائلية
          </CardTitle>
          <CardDescription>
            {hasFamilyPlan 
              ? "لا يوجد أعضاء في خطتك العائلية حالياً. يمكنك دعوة أعضاء جدد للانضمام."
              : "تحتاج إلى اشتراك عائلي لإدارة أعضاء العائلة."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasFamilyPlan ? (
            <Button 
              onClick={() => setShowInviteForm(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              دعوة عضو جديد
            </Button>
          ) : (
            <p className="text-center text-muted-foreground">
              قم بترقية اشتراكك إلى الخطة العائلية لبدء دعوة الأعضاء
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* أعضاء الخطة العائلية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                أعضاء الخطة العائلية ({members.length})
              </CardTitle>
              <CardDescription>
                إدارة أعضاء خطتك العائلية وصلاحياتهم
              </CardDescription>
            </div>
            {isOwner && (
              <Button 
                onClick={() => setShowInviteForm(true)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                دعوة عضو
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profile?.avatar_url} />
                    <AvatarFallback>
                      {getMemberDisplayName(member).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getMemberDisplayName(member)}</div>
                    {member.profile?.phone && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.profile.phone}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
                
                {isOwner && member.role !== 'owner' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>إزالة عضو من الخطة العائلية</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من إزالة {getMemberDisplayName(member)} من الخطة العائلية؟ 
                          لن يتمكن من الوصول إلى مميزات الخطة العائلية.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => removeMember(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          إزالة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {!isOwner && member.role === 'owner' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        مغادرة الخطة
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>مغادرة الخطة العائلية</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من مغادرة الخطة العائلية؟ ستفقد الوصول إلى جميع مميزات الخطة العائلية.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={leaveFamily}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          مغادرة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* الدعوات المعلقة */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              الدعوات المعلقة ({invitations.length})
            </CardTitle>
            <CardDescription>
              دعوات في انتظار الموافقة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {invitation.invited_email ? (
                        <Mail className="h-4 w-4 text-primary" />
                      ) : (
                        <Phone className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {invitation.invited_email || invitation.invited_phone}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        رمز الدعوة: {invitation.invitation_code}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {getRoleLabel(invitation.role)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInvitationCode(invitation.invitation_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>إلغاء الدعوة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من إلغاء هذه الدعوة؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelInvitation(invitation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            إلغاء الدعوة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نموذج دعوة عضو جديد */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>دعوة عضو جديد</CardTitle>
            <CardDescription>
              أدخل البريد الإلكتروني أو رقم الهاتف للعضو الجديد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailOrPhone">البريد الإلكتروني أو رقم الهاتف</Label>
              <Input
                id="emailOrPhone"
                placeholder="example@email.com أو 966501234567"
                value={inviteForm.emailOrPhone}
                onChange={(e) => setInviteForm(prev => ({ ...prev, emailOrPhone: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="role">الصلاحية</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value: "admin" | "member") => 
                  setInviteForm(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">عضو</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="flex gap-3">
              <Button onClick={handleInvite} className="flex-1">
                إرسال الدعوة
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInviteForm(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
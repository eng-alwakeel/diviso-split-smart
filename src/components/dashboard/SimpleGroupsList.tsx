import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  name: string;
  members: number;
  expenses: number;
  totalExpenses: number;
}

interface SimpleGroupsListProps {
  groups: Group[];
  groupPaidMap: Record<string, number>;
  groupOwedMap: Record<string, number>;
}

export const SimpleGroupsList = ({ 
  groups, 
  groupPaidMap, 
  groupOwedMap 
}: SimpleGroupsListProps) => {
  const navigate = useNavigate();

  if (groups.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مجموعات</h3>
          <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول مجموعة لك</p>
          <Button onClick={() => navigate('/create-group')}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء مجموعة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">المجموعات</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/my-groups')}
          >
            عرض الكل
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/create-group')}
          >
            <Plus className="w-4 h-4 ml-2" />
            إنشاء
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.slice(0, 5).map((group) => {
          const paid = groupPaidMap[group.id] || 0;
          const owed = groupOwedMap[group.id] || 0;
          const balance = paid - owed;
          
          return (
            <div
              key={group.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{group.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {group.members} أعضاء • {group.expenses} مصاريف
                </p>
              </div>
              <div className="text-left ml-4">
                <p className={`text-sm font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance.toLocaleString()} ر.س
                </p>
                <p className="text-xs text-muted-foreground">
                  {balance >= 0 ? 'لك' : 'عليك'}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
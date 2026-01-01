import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Filter,
  Send,
  Loader2,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppHeader } from '@/components/AppHeader';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import {
  useAllTickets,
  useSupportAnalytics,
  useUpdateTicket,
  useAddAdminReply,
  useTicketReplies,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
  type Ticket as TicketType,
} from '@/hooks/useTickets';
import {
  useAllFeedback,
  useUpdateFeedback,
  useFeedbackStats,
  type FeedbackStatus,
  type Feedback,
} from '@/hooks/useFeedback';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function SupportDashboardContent() {
  const { t, i18n } = useTranslation('support');
  const navigate = useNavigate();
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  // Selected items
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Queries
  const { data: analytics, isLoading: analyticsLoading } = useSupportAnalytics();
  const { data: tickets, isLoading: ticketsLoading } = useAllTickets({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });
  const { data: feedback, isLoading: feedbackLoading } = useAllFeedback();
  const { data: feedbackStats } = useFeedbackStats();
  const { data: replies } = useTicketReplies(selectedTicket?.id || '');

  // Mutations
  const updateTicket = useUpdateTicket();
  const addReply = useAddAdminReply();
  const updateFeedback = useUpdateFeedback();

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} ساعة`;
    return `${Math.round(minutes / 1440)} يوم`;
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'escalated':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'p0':
        return 'bg-red-500/10 text-red-600';
      case 'p1':
        return 'bg-orange-500/10 text-orange-600';
      case 'p2':
        return 'bg-yellow-500/10 text-yellow-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    await addReply.mutateAsync({
      ticketId: selectedTicket.id,
      message: replyText.trim(),
      isInternal: isInternalNote,
    });

    setReplyText('');
    setIsInternalNote(false);
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    await updateTicket.mutateAsync({
      ticketId,
      updates: {
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
        ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {}),
      },
    });
  };

  const handleUpdateFeedbackStatus = async (feedbackId: string, status: FeedbackStatus) => {
    await updateFeedback.mutateAsync({
      feedbackId,
      updates: { status },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={t('admin.dashboard_title')}
        showBack
        onBack={() => navigate('/admin')}
      />

      <main className="container max-w-6xl mx-auto p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
            <TabsTrigger value="tickets">{t('admin.tickets')}</TabsTrigger>
            <TabsTrigger value="hot-issues">{t('admin.hot_issues')}</TabsTrigger>
            <TabsTrigger value="suggestions">{t('admin.suggestions')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {analyticsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {t('admin.total_tickets_today')}
                        </span>
                      </div>
                      <p className="text-3xl font-bold mt-2">{analytics?.todayCount || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          {t('admin.avg_response_time')}
                        </span>
                      </div>
                      <p className="text-3xl font-bold mt-2">
                        {formatMinutes(analytics?.avgResponseMinutes || 0)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                          {t('admin.csat_score')}
                        </span>
                      </div>
                      <p className="text-3xl font-bold mt-2">{analytics?.csatScore || 'N/A'}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                          {t('admin.sla_breaches')}
                        </span>
                      </div>
                      <p className="text-3xl font-bold mt-2">{analytics?.slaBreaches || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* By Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التذاكر المفتوحة حسب الفئة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {Object.entries(analytics?.byCategory || {}).map(([cat, count]) => (
                        <div key={cat} className="text-center">
                          <p className="text-2xl font-bold">{count as number}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`ticket_categories.${cat}`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* By Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التذاكر المفتوحة حسب الأولوية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(analytics?.byPriority || {}).map(([priority, count]) => (
                        <div
                          key={priority}
                          className={cn(
                            'text-center p-4 rounded-lg',
                            getPriorityColor(priority as TicketPriority)
                          )}
                        >
                          <p className="text-2xl font-bold">{count as number}</p>
                          <p className="text-sm">{t(`priority.${priority}`)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="escalated">مصعّدة</SelectItem>
                  <SelectItem value="resolved">محلولة</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="p0">P0 - حرج</SelectItem>
                  <SelectItem value="p1">P1 - عالي</SelectItem>
                  <SelectItem value="p2">P2 - متوسط</SelectItem>
                  <SelectItem value="p3">P3 - منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets List */}
            {ticketsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {tickets?.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {ticket.ticket_number}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getStatusColor(ticket.status))}
                            >
                              {t(`status.${ticket.status}`)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getPriorityColor(ticket.priority))}
                            >
                              {t(`priority.${ticket.priority}`)}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>
                              {ticket.profiles?.display_name || ticket.profiles?.name || 'مجهول'}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                                locale,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hot Issues Tab */}
          <TabsContent value="hot-issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  أكثر المشاكل تكراراً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.byCategory || {})
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5)
                    .map(([cat, count], index) => (
                      <div key={cat} className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{t(`ticket_categories.${cat}`)}</p>
                          <p className="text-sm text-muted-foreground">
                            {count as number} تذكرة مفتوحة
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{feedbackStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الاقتراحات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{feedbackStats?.new || 0}</p>
                  <p className="text-sm text-muted-foreground">جديدة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{feedbackStats?.planned || 0}</p>
                  <p className="text-sm text-muted-foreground">مخططة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {feedbackStats?.wouldPayYes || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">مستعد للدفع</p>
                </CardContent>
              </Card>
            </div>

            {/* Feedback List */}
            {feedbackLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {feedback?.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedFeedback(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {t(`ticket_categories.${item.category}`)}
                            </Badge>
                            {item.would_pay === 'yes' && (
                              <Badge className="bg-green-500/10 text-green-600 text-xs">
                                مستعد للدفع
                              </Badge>
                            )}
                            {item.rice_score && (
                              <Badge variant="secondary" className="text-xs">
                                RICE: {item.rice_score.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{item.idea}</h4>
                          {item.reason && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.reason}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              {item.profiles?.display_name || item.profiles?.name || 'مجهول'}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            item.status === 'done'
                              ? 'bg-green-500/10 text-green-600'
                              : item.status === 'rejected'
                              ? 'bg-red-500/10 text-red-600'
                              : item.status === 'planned'
                              ? 'bg-blue-500/10 text-blue-600'
                              : ''
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedTicket?.ticket_number}</span>
              {selectedTicket && (
                <>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getStatusColor(selectedTicket.status))}
                  >
                    {t(`status.${selectedTicket.status}`)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getPriorityColor(selectedTicket.priority))}
                  >
                    {t(`priority.${selectedTicket.priority}`)}
                  </Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Ticket info */}
            <div className="mb-4 pb-4 border-b">
              <h3 className="font-medium">{selectedTicket?.subject}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTicket?.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>الجهاز: {selectedTicket?.device_os}</span>
                <span>الإصدار: {selectedTicket?.app_version}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  selectedTicket && handleUpdateStatus(selectedTicket.id, 'in_progress')
                }
              >
                قيد المعالجة
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  selectedTicket && handleUpdateStatus(selectedTicket.id, 'escalated')
                }
              >
                تصعيد
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600"
                onClick={() =>
                  selectedTicket && handleUpdateStatus(selectedTicket.id, 'resolved')
                }
              >
                حل
              </Button>
            </div>

            {/* Replies */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {replies?.map((reply) => (
                  <div
                    key={reply.id}
                    className={cn(
                      'p-3 rounded-lg',
                      reply.is_internal
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : reply.profiles?.is_admin
                        ? 'bg-primary/10 mr-4 rtl:mr-0 rtl:ml-4'
                        : 'bg-muted ml-4 rtl:ml-0 rtl:mr-4'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {reply.profiles?.display_name || reply.profiles?.name || 'مجهول'}
                      </span>
                      {reply.profiles?.is_admin && (
                        <Badge variant="secondary" className="text-xs">
                          فريق الدعم
                        </Badge>
                      )}
                      {reply.is_internal && (
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          ملاحظة داخلية
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{reply.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply input */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isInternalNote ? 'secondary' : 'ghost'}
                  onClick={() => setIsInternalNote(!isInternalNote)}
                >
                  {t('admin.internal_note')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote ? 'اكتب ملاحظة داخلية...' : 'اكتب ردك للعميل...'
                  }
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || addReply.isPending}
                >
                  {addReply.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Details Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الاقتراح</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">الفكرة</h4>
              <p className="text-sm">{selectedFeedback?.idea}</p>
            </div>

            {selectedFeedback?.reason && (
              <div>
                <h4 className="font-medium mb-2">السبب</h4>
                <p className="text-sm text-muted-foreground">{selectedFeedback.reason}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-muted-foreground">مستعد للدفع:</span>
                <Badge variant="outline" className="mr-2">
                  {selectedFeedback?.would_pay === 'yes'
                    ? 'نعم'
                    : selectedFeedback?.would_pay === 'no'
                    ? 'لا'
                    : 'ربما'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">الفئة:</span>
                <Badge variant="outline" className="mr-2">
                  {selectedFeedback && t(`ticket_categories.${selectedFeedback.category}`)}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() =>
                  selectedFeedback &&
                  handleUpdateFeedbackStatus(selectedFeedback.id, 'planned')
                }
              >
                {t('admin.mark_planned')}
              </Button>
              <Button
                variant="outline"
                className="text-green-600"
                onClick={() =>
                  selectedFeedback && handleUpdateFeedbackStatus(selectedFeedback.id, 'done')
                }
              >
                {t('admin.mark_done')}
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() =>
                  selectedFeedback &&
                  handleUpdateFeedbackStatus(selectedFeedback.id, 'rejected')
                }
              >
                {t('admin.mark_rejected')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SupportDashboard() {
  return (
    <AdminProtectedRoute>
      <SupportDashboardContent />
    </AdminProtectedRoute>
  );
}

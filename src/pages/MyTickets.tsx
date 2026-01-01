import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomNav } from '@/components/BottomNav';
import {
  useMyTickets,
  useTicketReplies,
  useAddTicketReply,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
} from '@/hooks/useTickets';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MyTickets() {
  const { t, i18n } = useTranslation('support');
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useMyTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const addReply = useAddTicketReply();

  const { data: replies, isLoading: repliesLoading } = useTicketReplies(
    selectedTicket?.id || ''
  );

  const locale = i18n.language === 'ar' ? ar : enUS;

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'escalated':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'waiting_customer':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'escalated':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'p0':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'p1':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'p2':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'p3':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    await addReply.mutateAsync({
      ticketId: selectedTicket.id,
      message: replyText.trim(),
    });

    setReplyText('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rtl:rotate-180">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="flex-1 text-lg font-semibold text-center mr-10">{t('my_tickets.title')}</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : !tickets?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">{t('my_tickets.empty')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('my_tickets.empty_desc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {ticket.ticket_number}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getStatusColor(ticket.status))}
                      >
                        {getStatusIcon(ticket.status)}
                        <span className="mr-1">{t(`status.${ticket.status}`)}</span>
                      </Badge>
                    </div>
                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getPriorityColor(ticket.priority))}
                      >
                        {t(`priority.${ticket.priority}`)}
                      </Badge>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(ticket.created_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedTicket?.ticket_number}</span>
              {selectedTicket && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', getStatusColor(selectedTicket.status))}
                >
                  {t(`status.${selectedTicket.status}`)}
                </Badge>
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
            </div>

            {/* Replies */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {repliesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !replies?.length ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    لا توجد ردود بعد
                  </p>
                ) : (
                  replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={cn(
                        'p-3 rounded-lg',
                        reply.profiles?.is_admin
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
                      </div>
                      <p className="text-sm">{reply.message}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDistanceToNow(new Date(reply.created_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Reply input */}
            {selectedTicket?.status !== 'closed' &&
              selectedTicket?.status !== 'resolved' && (
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t('my_tickets.reply_placeholder')}
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
              )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export type TicketCategory = 'payment' | 'credits' | 'groups' | 'recommendations' | 'account' | 'technical';
export type TicketPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'escalated' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  device_os?: string;
  app_version?: string;
  last_event_id?: string;
  screenshot_url?: string;
  assigned_to?: string;
  escalated_to?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  sla_breach?: boolean;
  csat_score?: number;
  csat_comment?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name?: string;
    name?: string;
  };
  assigned_profile?: {
    display_name?: string;
    name?: string;
  };
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  attachments: unknown[];
  created_at: string;
  profiles?: {
    display_name?: string;
    name?: string;
    is_admin?: boolean;
  };
}

export interface CreateTicketData {
  category: TicketCategory;
  subject: string;
  description: string;
  device_os?: string;
  app_version?: string;
  last_event_id?: string;
  screenshot_url?: string;
}

// Get device info
export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let os = 'Web';
  
  if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iPad|iPhone|iPod/.test(userAgent)) {
    os = 'iOS';
  } else if (/Win/.test(userAgent)) {
    os = 'Windows';
  } else if (/Mac/.test(userAgent)) {
    os = 'macOS';
  }
  
  return {
    device_os: os,
    app_version: '1.0.0', // Replace with actual app version
  };
}

// Auto-detect priority based on category and keywords
export function detectPriority(category: TicketCategory, description: string): TicketPriority {
  const lowerDesc = description.toLowerCase();
  
  // P0 keywords
  if (
    lowerDesc.includes('خصم') ||
    lowerDesc.includes('فشل دفع') ||
    lowerDesc.includes('payment failed') ||
    lowerDesc.includes('charged') ||
    lowerDesc.includes('money')
  ) {
    return 'p0';
  }
  
  // P1 for core features
  if (category === 'groups' || category === 'credits') {
    if (
      lowerDesc.includes('لا يعمل') ||
      lowerDesc.includes('not working') ||
      lowerDesc.includes('error') ||
      lowerDesc.includes('خطأ')
    ) {
      return 'p1';
    }
  }
  
  // P3 for recommendations
  if (category === 'recommendations') {
    return 'p3';
  }
  
  // Default to P2
  return 'p2';
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ticket[];
    },
  });
}

export function useTicketDetails(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketReplies(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-replies', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select(`
          *,
          profiles:user_id (
            display_name,
            name,
            is_admin
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketReply[];
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('support');

  return useMutation({
    mutationFn: async (ticketData: CreateTicketData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const deviceInfo = getDeviceInfo();
      const priority = detectPriority(ticketData.category, ticketData.description);

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: ticketData.category,
          priority,
          subject: ticketData.subject,
          description: ticketData.description,
          device_os: ticketData.device_os || deviceInfo.device_os,
          app_version: ticketData.app_version || deviceInfo.app_version,
          last_event_id: ticketData.last_event_id,
          screenshot_url: ticketData.screenshot_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast({
        title: t('create_ticket.success'),
      });
    },
    onError: () => {
      toast({
        title: t('create_ticket.error'),
        variant: 'destructive',
      });
    },
  });
}

export function useAddTicketReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_internal: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', ticketId] });
    },
  });
}

export function useSubmitCSAT() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('support');
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      score, 
      comment 
    }: { 
      ticketId: string; 
      score: number; 
      comment?: string;
    }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          csat_score: score,
          csat_comment: comment,
        })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast({
        title: t('nps.thanks'),
      });
    },
  });
}

// Admin hooks
export function useAllTickets(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
}) {
  return useQuery({
    queryKey: ['all-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id (
            display_name,
            name
          ),
          assigned_profile:assigned_to (
            display_name,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Ticket[];
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      updates 
    }: { 
      ticketId: string; 
      updates: Partial<Ticket>;
    }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });
}

export function useAddAdminReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message, 
      isInternal = false 
    }: { 
      ticketId: string; 
      message: string; 
      isInternal?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add reply
      const { error: replyError } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_internal: isInternal,
        });

      if (replyError) throw replyError;

      // Update first response time if not set
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('first_response_at')
        .eq('id', ticketId)
        .single();

      if (!ticket?.first_response_at && !isInternal) {
        await supabase
          .from('support_tickets')
          .update({ 
            first_response_at: new Date().toISOString(),
            status: 'in_progress' as TicketStatus,
          })
          .eq('id', ticketId);
      }
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
  });
}

export function useSupportAnalytics() {
  return useQuery({
    queryKey: ['support-analytics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's tickets
      const { data: todayTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', today);

      // Get open tickets
      const { data: openTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .in('status', ['open', 'in_progress', 'waiting_customer', 'escalated']);

      // Get resolved tickets for avg calculations
      const { data: resolvedTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .not('resolved_at', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate averages
      let avgResponseMinutes = 0;
      let avgResolutionMinutes = 0;
      let csatSum = 0;
      let csatCount = 0;

      resolvedTickets?.forEach(ticket => {
        if (ticket.first_response_at) {
          const response = (new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime()) / 60000;
          avgResponseMinutes += response;
        }
        if (ticket.resolved_at) {
          const resolution = (new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()) / 60000;
          avgResolutionMinutes += resolution;
        }
        if (ticket.csat_score !== null) {
          csatSum += ticket.csat_score;
          csatCount++;
        }
      });

      const ticketCount = resolvedTickets?.length || 1;

      return {
        todayCount: todayTickets?.length || 0,
        openCount: openTickets?.length || 0,
        avgResponseMinutes: Math.round(avgResponseMinutes / ticketCount),
        avgResolutionMinutes: Math.round(avgResolutionMinutes / ticketCount),
        csatScore: csatCount > 0 ? (csatSum / csatCount).toFixed(1) : 'N/A',
        slaBreaches: openTickets?.filter(t => t.sla_breach).length || 0,
        byCategory: {
          payment: openTickets?.filter(t => t.category === 'payment').length || 0,
          credits: openTickets?.filter(t => t.category === 'credits').length || 0,
          groups: openTickets?.filter(t => t.category === 'groups').length || 0,
          recommendations: openTickets?.filter(t => t.category === 'recommendations').length || 0,
          account: openTickets?.filter(t => t.category === 'account').length || 0,
          technical: openTickets?.filter(t => t.category === 'technical').length || 0,
        },
        byPriority: {
          p0: openTickets?.filter(t => t.priority === 'p0').length || 0,
          p1: openTickets?.filter(t => t.priority === 'p1').length || 0,
          p2: openTickets?.filter(t => t.priority === 'p2').length || 0,
          p3: openTickets?.filter(t => t.priority === 'p3').length || 0,
        },
      };
    },
  });
}

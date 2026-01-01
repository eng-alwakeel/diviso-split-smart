-- Create enums for support system
CREATE TYPE public.ticket_category AS ENUM ('payment', 'credits', 'groups', 'recommendations', 'account', 'technical');
CREATE TYPE public.ticket_priority AS ENUM ('p0', 'p1', 'p2', 'p3');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed');
CREATE TYPE public.feedback_payment_intent AS ENUM ('yes', 'no', 'maybe');
CREATE TYPE public.feedback_status AS ENUM ('new', 'reviewing', 'planned', 'in_progress', 'done', 'rejected');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_number text NOT NULL UNIQUE,
  category public.ticket_category NOT NULL,
  priority public.ticket_priority NOT NULL DEFAULT 'p2',
  status public.ticket_status NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  description text NOT NULL,
  device_os text,
  app_version text,
  last_event_id text,
  screenshot_url text,
  assigned_to uuid REFERENCES public.profiles(id),
  escalated_to uuid REFERENCES public.profiles(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  sla_breach boolean DEFAULT false,
  csat_score int CHECK (csat_score >= 0 AND csat_score <= 10),
  csat_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ticket_replies table
CREATE TABLE public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create ticket_sla_config table
CREATE TABLE public.ticket_sla_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority public.ticket_priority NOT NULL UNIQUE,
  first_response_minutes int NOT NULL,
  resolution_minutes int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default SLA configurations
INSERT INTO public.ticket_sla_config (priority, first_response_minutes, resolution_minutes) VALUES
  ('p0', 15, 240),      -- P0: 15 min response, 4 hours resolution
  ('p1', 60, 1440),     -- P1: 1 hour response, 24 hours resolution
  ('p2', 360, 4320),    -- P2: 6 hours response, 3 days resolution
  ('p3', 1440, 10080);  -- P3: 24 hours response, 7 days resolution

-- Create support_runbooks table
CREATE TABLE public.support_runbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.ticket_category NOT NULL,
  problem_type text NOT NULL,
  problem_type_ar text NOT NULL,
  symptoms text[] DEFAULT '{}',
  symptoms_ar text[] DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps_ar jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_actions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create customer_feedback table
CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea text NOT NULL,
  reason text,
  would_pay public.feedback_payment_intent DEFAULT 'maybe',
  category public.ticket_category NOT NULL,
  rice_reach int DEFAULT 0,
  rice_impact int DEFAULT 0,
  rice_confidence int DEFAULT 0,
  rice_effort int DEFAULT 0,
  rice_score decimal GENERATED ALWAYS AS ((rice_reach * rice_impact * rice_confidence::decimal) / NULLIF(rice_effort, 0)) STORED,
  status public.feedback_status DEFAULT 'new',
  votes int DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create support_analytics table (daily aggregates)
CREATE TABLE public.support_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_tickets int DEFAULT 0,
  tickets_opened int DEFAULT 0,
  tickets_closed int DEFAULT 0,
  avg_first_response_minutes decimal,
  avg_resolution_minutes decimal,
  csat_score decimal,
  sla_breach_count int DEFAULT 0,
  by_category jsonb DEFAULT '{}'::jsonb,
  by_priority jsonb DEFAULT '{}'::jsonb,
  deflection_rate decimal,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.support_tickets;
  v_number := 'TKT-' || LPAD(v_count::text, 6, '0');
  RETURN v_number;
END;
$$;

-- Create trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();

-- Create trigger to update timestamps
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_sla_config_updated_at
  BEFORE UPDATE ON public.ticket_sla_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_runbooks_updated_at
  BEFORE UPDATE ON public.support_runbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_feedback_updated_at
  BEFORE UPDATE ON public.customer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_analytics_updated_at
  BEFORE UPDATE ON public.support_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_sla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets (limited)"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for ticket_replies
CREATE POLICY "Users can view replies on their tickets"
  ON public.ticket_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    ) AND is_internal = false
  );

CREATE POLICY "Users can add replies to their tickets"
  ON public.ticket_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all replies"
  ON public.ticket_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can add replies"
  ON public.ticket_replies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for ticket_sla_config (admin only)
CREATE POLICY "Admins can view SLA config"
  ON public.ticket_sla_config FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage SLA config"
  ON public.ticket_sla_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for support_runbooks
CREATE POLICY "Anyone can view active runbooks"
  ON public.support_runbooks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage runbooks"
  ON public.support_runbooks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for customer_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.customer_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON public.customer_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.customer_feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage feedback"
  ON public.customer_feedback FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for support_analytics (admin only)
CREATE POLICY "Admins can view analytics"
  ON public.support_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage analytics"
  ON public.support_analytics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Insert default runbooks
INSERT INTO public.support_runbooks (category, problem_type, problem_type_ar, symptoms, symptoms_ar, steps, steps_ar, quick_actions) VALUES
  ('payment', 'charge_without_activation', 'خصم بدون تفعيل', 
   ARRAY['Payment deducted', 'Subscription not active', 'No confirmation'],
   ARRAY['تم الخصم من الحساب', 'الاشتراك غير مفعل', 'لم يصل تأكيد'],
   '[{"step": 1, "action": "Check webhook events for transaction ID"}, {"step": 2, "action": "Verify payment status in Moyasar"}, {"step": 3, "action": "If payment successful, manually activate subscription"}, {"step": 4, "action": "Send apology + bonus reward points"}]'::jsonb,
   '[{"step": 1, "action": "تحقق من أحداث webhook للمعاملة"}, {"step": 2, "action": "تحقق من حالة الدفع في مويسر"}, {"step": 3, "action": "إذا نجح الدفع، فعّل الاشتراك يدوياً"}, {"step": 4, "action": "أرسل اعتذار + نقاط مكافأة"}]'::jsonb,
   '[{"action": "activate_subscription", "label": "تفعيل الاشتراك"}, {"action": "grant_bonus_rp", "label": "منح نقاط مكافأة", "amount": 50}]'::jsonb),
  
  ('credits', 'credits_expired', 'انتهاء صلاحية النقاط',
   ARRAY['Credits disappeared', 'Balance reduced', 'No usage'],
   ARRAY['اختفت النقاط', 'نقص الرصيد', 'لم أستخدمها'],
   '[{"step": 1, "action": "Show credit transaction history"}, {"step": 2, "action": "Explain expiration policy"}, {"step": 3, "action": "If system error, grant replacement credits"}]'::jsonb,
   '[{"step": 1, "action": "اعرض سجل معاملات النقاط"}, {"step": 2, "action": "اشرح سياسة الانتهاء"}, {"step": 3, "action": "إذا خطأ نظامي، امنح نقاط بديلة"}]'::jsonb,
   '[{"action": "view_credit_history", "label": "عرض السجل"}, {"action": "grant_credits", "label": "منح نقاط", "max_amount": 10}]'::jsonb),
  
  ('groups', 'settlement_mismatch', 'اختلاف التسوية',
   ARRAY['Settlement amount wrong', 'Member balance incorrect', 'Missing expense'],
   ARRAY['مبلغ التسوية خاطئ', 'رصيد العضو غير صحيح', 'مصروف مفقود'],
   '[{"step": 1, "action": "Check group expense history"}, {"step": 2, "action": "Verify member permissions"}, {"step": 3, "action": "Trigger group resync"}, {"step": 4, "action": "Generate debug report"}]'::jsonb,
   '[{"step": 1, "action": "تحقق من سجل مصروفات المجموعة"}, {"step": 2, "action": "تحقق من صلاحيات العضو"}, {"step": 3, "action": "أعد مزامنة المجموعة"}, {"step": 4, "action": "أنشئ تقرير تشخيص"}]'::jsonb,
   '[{"action": "resync_group", "label": "إعادة المزامنة"}, {"action": "generate_debug_report", "label": "تقرير تشخيص"}]'::jsonb),
  
  ('recommendations', 'irrelevant_recommendations', 'توصيات غير مناسبة',
   ARRAY['Wrong category suggestions', 'Repeated recommendations', 'Wrong location'],
   ARRAY['اقتراحات فئة خاطئة', 'تكرار نفس التوصيات', 'موقع خاطئ'],
   '[{"step": 1, "action": "Check user preferences"}, {"step": 2, "action": "Review recommendation feedback history"}, {"step": 3, "action": "Reset recommendation signals if needed"}]'::jsonb,
   '[{"step": 1, "action": "تحقق من تفضيلات المستخدم"}, {"step": 2, "action": "راجع سجل ملاحظات التوصيات"}, {"step": 3, "action": "أعد ضبط إشارات التوصيات إذا لزم"}]'::jsonb,
   '[{"action": "reset_recommendations", "label": "إعادة ضبط التوصيات"}, {"action": "update_preferences", "label": "تحديث التفضيلات"}]'::jsonb);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX idx_customer_feedback_user_id ON public.customer_feedback(user_id);
CREATE INDEX idx_customer_feedback_status ON public.customer_feedback(status);
CREATE INDEX idx_support_analytics_date ON public.support_analytics(date DESC);
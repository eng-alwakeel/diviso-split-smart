import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  user_id: string;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  seller_legal_name: string;
  seller_vat_number: string | null;
  seller_address: string | null;
  payment_status: string;
  payment_provider: string | null;
  payment_txn_id: string | null;
  currency: string;
  total_excl_vat: number;
  total_vat: number;
  total_incl_vat: number;
  vat_rate: number;
  qr_base64: string | null;
  pdf_url: string | null;
  notes: string | null;
  issue_datetime: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: string;
  description: string;
  description_ar: string | null;
  quantity: number;
  unit_price_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  line_total_incl_vat: number;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  original_invoice_id: string;
  user_id: string;
  currency: string;
  total_excl_vat: number;
  total_vat: number;
  total_incl_vat: number;
  reason: string;
  reason_ar: string | null;
  qr_base64: string | null;
  pdf_url: string | null;
  issue_datetime: string;
  created_at: string;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_datetime', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch invoice items for each invoice
      const invoicesWithItems: Invoice[] = [];
      for (const invoice of (invoicesData || [])) {
        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);

        invoicesWithItems.push({
          ...invoice,
          items: items || []
        });
      }

      setInvoices(invoicesWithItems);

      // Fetch credit notes
      const { data: creditNotesData, error: creditNotesError } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_datetime', { ascending: false });

      if (creditNotesError) throw creditNotesError;
      setCreditNotes(creditNotesData || []);

    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفواتير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      return {
        ...invoice,
        items: items || []
      };
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      return null;
    }
  };

  const resendInvoiceEmail = async (invoiceId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoice_id: invoiceId }
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال الفاتورة للبريد الإلكتروني بنجاح'
      });
    } catch (err: any) {
      console.error('Error sending invoice email:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الفاتورة',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    creditNotes,
    loading,
    error,
    refresh: fetchInvoices,
    getInvoiceById,
    resendInvoiceEmail
  };
}

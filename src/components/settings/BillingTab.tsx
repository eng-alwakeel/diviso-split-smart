import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Receipt, 
  Download, 
  Mail, 
  Eye, 
  FileText, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceDetailsDialog } from './InvoiceDetailsDialog';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

export function BillingTab() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { isRTL } = useLanguage();
  const { invoices, creditNotes, loading, refresh, resendInvoiceEmail } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy', { 
      locale: i18n.language === 'ar' ? ar : enUS 
    });
  };

  const formatCurrency = (amount: number, currency: string = 'SAR') => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 me-1" />
            {i18n.language === 'ar' ? 'مدفوعة' : 'Paid'}
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <RefreshCw className="w-3 h-3 me-1" />
            {i18n.language === 'ar' ? 'مسترجعة' : 'Refunded'}
          </Badge>
        );
      case 'partially_refunded':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <AlertCircle className="w-3 h-3 me-1" />
            {i18n.language === 'ar' ? 'استرجاع جزئي' : 'Partially Refunded'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <AlertCircle className="w-3 h-3 me-1" />
            {i18n.language === 'ar' ? 'معلقة' : 'Pending'}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 me-1" />
            {i18n.language === 'ar' ? 'فشلت' : 'Failed'}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getItemTypeLabel = (invoice: Invoice) => {
    if (invoice.items && invoice.items.length > 0) {
      const itemType = invoice.items[0].item_type;
      switch (itemType) {
        case 'subscription_monthly':
          return i18n.language === 'ar' ? 'اشتراك شهري' : 'Monthly Subscription';
        case 'subscription_annual':
          return i18n.language === 'ar' ? 'اشتراك سنوي' : 'Annual Subscription';
        case 'credits_pack':
          return i18n.language === 'ar' ? 'باقة نقاط' : 'Credits Pack';
        default:
          return itemType;
      }
    }
    return i18n.language === 'ar' ? 'فاتورة' : 'Invoice';
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground">
                  {i18n.language === 'ar' ? 'الفواتير' : 'Invoices'}
                </CardTitle>
                <CardDescription>
                  {i18n.language === 'ar' 
                    ? 'عرض وتحميل جميع فواتيرك' 
                    : 'View and download all your invoices'}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 me-2" />
              {i18n.language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {i18n.language === 'ar' ? 'لا توجد فواتير' : 'No Invoices'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {i18n.language === 'ar' 
                ? 'ستظهر فواتيرك هنا بعد إتمام أي عملية شراء' 
                : 'Your invoices will appear here after any purchase'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className="bg-card/90 border border-border/50 shadow-card rounded-xl backdrop-blur-sm hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Invoice Info */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {invoice.invoice_number}
                        </span>
                        {getStatusBadge(invoice.payment_status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(invoice.issue_datetime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          {getItemTypeLabel(invoice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(invoice.total_incl_vat, invoice.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {i18n.language === 'ar' ? 'شامل الضريبة' : 'Including VAT'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInvoice(invoice)}
                        title={i18n.language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {invoice.pdf_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice)}
                          title={i18n.language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInvoiceEmail(invoice.id)}
                        title={i18n.language === 'ar' ? 'إرسال بالبريد' : 'Send by Email'}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Credit Notes Section */}
      {creditNotes.length > 0 && (
        <>
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-foreground">
                    {i18n.language === 'ar' ? 'إشعارات الدائن' : 'Credit Notes'}
                  </CardTitle>
                  <CardDescription>
                    {i18n.language === 'ar' 
                      ? 'الاسترجاعات والتصحيحات' 
                      : 'Refunds and adjustments'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {creditNotes.map((note) => (
              <Card 
                key={note.id} 
                className="bg-card/90 border border-orange-500/20 shadow-card rounded-xl backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-mono text-sm font-medium text-foreground">
                          {note.credit_note_number}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(note.issue_datetime)}
                          </span>
                          <span>
                            {i18n.language === 'ar' ? note.reason_ar || note.reason : note.reason}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="text-lg font-bold text-orange-600">
                        -{formatCurrency(note.total_incl_vat, note.currency)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

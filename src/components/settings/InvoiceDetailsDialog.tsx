import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Mail, 
  Building2, 
  User, 
  Calendar, 
  CreditCard,
  QrCode,
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Invoice, useInvoices } from '@/hooks/useInvoices';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsDialog({ invoice, open, onOpenChange }: InvoiceDetailsDialogProps) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const { resendInvoiceEmail } = useInvoices();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!invoice) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy - HH:mm', { 
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

  const getItemTypeLabel = (itemType: string) => {
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
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      // If pdf_url exists, open it directly
      if (invoice.pdf_url) {
        window.open(invoice.pdf_url, '_blank');
        return;
      }

      // Otherwise, generate PDF via edge function
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoice_id: invoice.id, return_html: true }
      });

      if (error) throw error;

      // Open the HTML in a new tab for printing as PDF
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data);
        newWindow.document.close();
        // Trigger print dialog for PDF
        setTimeout(() => {
          newWindow.print();
        }, 500);
      }

      toast({
        title: i18n.language === 'ar' ? 'تم التحميل' : 'Downloaded',
        description: i18n.language === 'ar' ? 'يمكنك طباعة الفاتورة كـ PDF' : 'You can print the invoice as PDF'
      });
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' ? 'فشل في تحميل الفاتورة' : 'Failed to download invoice',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    setIsSendingEmail(true);
    try {
      await resendInvoiceEmail(invoice.id);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {i18n.language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}
                </p>
                <p className="font-mono text-lg font-bold text-foreground">
                  {invoice.invoice_number}
                </p>
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="w-3 h-3 me-1" />
                {invoice.invoice_type === 'simplified_tax_invoice' 
                  ? (i18n.language === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice')
                  : (i18n.language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDate(invoice.issue_datetime)}
            </div>
          </div>

          {/* Seller & Buyer Info */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Seller */}
            <div className="bg-primary/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {i18n.language === 'ar' ? 'البائع' : 'Seller'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{invoice.seller_legal_name}</p>
                {invoice.seller_vat_number && (
                  <p className="text-muted-foreground">
                    {i18n.language === 'ar' ? 'الرقم الضريبي: ' : 'VAT: '}
                    {invoice.seller_vat_number}
                  </p>
                )}
                {invoice.seller_address && (
                  <p className="text-muted-foreground">{invoice.seller_address}</p>
                )}
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-accent/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-accent" />
                <span className="font-semibold text-foreground">
                  {i18n.language === 'ar' ? 'المشتري' : 'Buyer'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {invoice.buyer_name && (
                  <p className="font-medium text-foreground">{invoice.buyer_name}</p>
                )}
                {invoice.buyer_email && (
                  <p className="text-muted-foreground">{invoice.buyer_email}</p>
                )}
                {invoice.buyer_phone && (
                  <p className="text-muted-foreground">{invoice.buyer_phone}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              {i18n.language === 'ar' ? 'تفاصيل البنود' : 'Line Items'}
            </h3>
            <div className="bg-muted/30 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">
                      {i18n.language === 'ar' ? 'البند' : 'Item'}
                    </th>
                    <th className="text-center p-3 font-medium text-muted-foreground">
                      {i18n.language === 'ar' ? 'الكمية' : 'Qty'}
                    </th>
                    <th className="text-end p-3 font-medium text-muted-foreground">
                      {i18n.language === 'ar' ? 'السعر' : 'Price'}
                    </th>
                    <th className="text-end p-3 font-medium text-muted-foreground">
                      {i18n.language === 'ar' ? 'الضريبة' : 'VAT'}
                    </th>
                    <th className="text-end p-3 font-medium text-muted-foreground">
                      {i18n.language === 'ar' ? 'الإجمالي' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : ''}>
                      <td className="p-3 text-foreground">
                        <div>
                          <span className="font-medium">
                            {i18n.language === 'ar' 
                              ? item.description_ar || item.description 
                              : item.description}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {getItemTypeLabel(item.item_type)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-foreground">{item.quantity}</td>
                      <td className="p-3 text-end text-foreground">
                        {formatCurrency(item.unit_price_excl_vat, invoice.currency)}
                      </td>
                      <td className="p-3 text-end text-foreground">
                        {formatCurrency(item.vat_amount, invoice.currency)}
                        <span className="text-xs text-muted-foreground block">
                          ({item.vat_rate}%)
                        </span>
                      </td>
                      <td className="p-3 text-end font-medium text-foreground">
                        {formatCurrency(item.line_total_incl_vat, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {i18n.language === 'ar' ? 'المجموع قبل الضريبة' : 'Subtotal (excl. VAT)'}
                </span>
                <span className="text-foreground">
                  {formatCurrency(invoice.total_excl_vat, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {i18n.language === 'ar' ? `ضريبة القيمة المضافة (${invoice.vat_rate}%)` : `VAT (${invoice.vat_rate}%)`}
                </span>
                <span className="text-foreground">
                  {formatCurrency(invoice.total_vat, invoice.currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">
                  {i18n.language === 'ar' ? 'الإجمالي شامل الضريبة' : 'Total (incl. VAT)'}
                </span>
                <span className="text-primary">
                  {formatCurrency(invoice.total_incl_vat, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>
              {i18n.language === 'ar' ? 'مزود الدفع: ' : 'Payment Provider: '}
              <span className="text-foreground capitalize">{invoice.payment_provider}</span>
            </span>
            {invoice.payment_txn_id && (
              <>
                <span>|</span>
                <span>
                  {i18n.language === 'ar' ? 'مرجع العملية: ' : 'Transaction ID: '}
                  <span className="font-mono text-foreground">{invoice.payment_txn_id}</span>
                </span>
              </>
            )}
          </div>

          {/* QR Code */}
          {invoice.qr_base64 && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl inline-block">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <QrCode className="w-4 h-4" />
                  <span>{i18n.language === 'ar' ? 'رمز QR للفاتورة' : 'Invoice QR Code'}</span>
                </div>
                <img 
                  src={invoice.qr_base64} 
                  alt="Invoice QR Code" 
                  className="w-32 h-32 mx-auto"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 me-2" />
              )}
              {i18n.language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
            </Button>
            <Button 
              variant="default"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 me-2" />
              )}
              {i18n.language === 'ar' ? 'إرسال بالبريد' : 'Send by Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingBag, Star, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AmazonProduct {
  id: string;
  product_id: string;
  title: string;
  description?: string;
  price_range?: string;
  rating?: number;
  image_url?: string;
  affiliate_url: string;
  keywords: string[];
  category: string;
  commission_rate: number;
  conversion_rate: number;
  active: boolean;
}

const SAUDI_CATEGORIES = [
  { id: 'electronics', name: 'الإلكترونيات', keywords: ['جوال', 'لابتوب', 'تلفزيون'] },
  { id: 'fashion', name: 'الأزياء', keywords: ['ملابس', 'أحذية', 'اكسسوارات'] },
  { id: 'home', name: 'المنزل والمطبخ', keywords: ['أثاث', 'أدوات مطبخ', 'ديكور'] },
  { id: 'books', name: 'الكتب', keywords: ['كتب', 'مجلات', 'قرطاسية'] },
  { id: 'sports', name: 'الرياضة', keywords: ['رياضة', 'لياقة', 'معدات رياضية'] },
  { id: 'beauty', name: 'الجمال', keywords: ['مكياج', 'عناية', 'عطور'] },
  { id: 'food', name: 'الأطعمة', keywords: ['طعام', 'حلويات', 'مشروبات'] },
  { id: 'automotive', name: 'السيارات', keywords: ['سيارات', 'قطع غيار', 'اكسسوارات سيارات'] }
];

export const AmazonSaudiManager = () => {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { toast } = useToast();

  // تحميل المنتجات المحفوظة
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('affiliate_partner', 'amazon')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المنتجات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // مزامنة المنتجات من Amazon
  const syncProducts = async () => {
    setSyncing(true);
    try {
      const selectedCategoryData = SAUDI_CATEGORIES.find(cat => cat.id === selectedCategory);
      const searchKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      if (selectedCategoryData && searchKeywords.length === 0) {
        searchKeywords.push(...selectedCategoryData.keywords);
      }

      const requestBody = {
        categoryId: selectedCategory || 'general',
        keywords: searchKeywords.length > 0 ? searchKeywords : ['منتجات عامة'],
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        limit: 20
      };

      const { data, error } = await supabase.functions.invoke('amazon-affiliate-sync', {
        body: requestBody
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'تم بنجاح!',
          description: `تم العثور على ${data.productsFound} منتج وحفظ ${data.productsSaved} منتج جديد`
        });
        await loadProducts(); // إعادة تحميل القائمة
      } else {
        throw new Error(data.error || 'حدث خطأ غير معروف');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'خطأ في المزامنة',
        description: error.message || 'فشل في مزامنة المنتجات من Amazon',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            مدير منتجات Amazon السعودية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* إعدادات البحث */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {SAUDI_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="كلمات مفتاحية (مفصولة بفاصلة)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />

            <Input
              type="number"
              placeholder="أقل سعر (ريال)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <Input
              type="number"
              placeholder="أعلى سعر (ريال)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={syncProducts} 
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing && <Loader2 className="h-4 w-4 animate-spin" />}
              مزامنة المنتجات من Amazon.sa
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadProducts} 
              disabled={loading}
            >
              تحديث القائمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.image_url && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span>{product.rating}</span>
                    </div>
                  )}
                  {product.price_range && (
                    <Badge variant="outline" className="text-xs">
                      {product.price_range}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {product.keywords.slice(0, 3).map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>عمولة: {(product.commission_rate * 100).toFixed(1)}%</span>
                  <span>تحويل: {(product.conversion_rate * 100).toFixed(1)}%</span>
                </div>

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(product.affiliate_url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  عرض في Amazon
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد منتجات محفوظة بعد</p>
            <p className="text-sm">استخدم زر "مزامنة المنتجات" لإضافة منتجات من Amazon.sa</p>
          </div>
        )}
      </div>
    </div>
  );
};
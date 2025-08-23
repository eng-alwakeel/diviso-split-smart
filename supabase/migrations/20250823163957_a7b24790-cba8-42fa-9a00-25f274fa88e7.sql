-- إضافة منتجات تجريبية لتفعيل نظام الإعلانات
INSERT INTO affiliate_products (
  product_id, affiliate_partner, category, title, description, price_range, rating, 
  image_url, affiliate_url, keywords, conversion_rate, commission_rate, active
) VALUES 
('test_phone_001', 'amazon', 'electronics', 'iPhone 15 Pro Max 256GB تيتانيوم طبيعي', 'أحدث هاتف آيفون بتقنيات متطورة وكاميرا احترافية 48 ميجابكسل', 'مرتفع', 4.8, 'https://m.media-amazon.com/images/I/81dT7CUY6GL._AC_SY741_.jpg', 'https://amazon.sa/dp/B0CHX2F5QT?tag=expensetracker-21', ARRAY['هاتف', 'آيفون', 'إلكترونيات', 'تكنولوجيا'], 0.08, 0.03, true),

('test_laptop_001', 'amazon', 'electronics', 'MacBook Air M2 13 بوصة 256GB فضي', 'لابتوب MacBook Air بمعالج M2 الجديد للأداء الفائق والعمر الطويل للبطارية', 'مرتفع', 4.9, 'https://m.media-amazon.com/images/I/71vPV7xnqwL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B0B3C2R8MP?tag=expensetracker-21', ARRAY['لابتوب', 'ماك', 'كمبيوتر', 'دراسة'], 0.06, 0.03, true),

('test_kitchen_001', 'amazon', 'home', 'طقم أواني طبخ من الستانلس ستيل 12 قطعة', 'طقم أواني طبخ عالي الجودة مقاوم للصدأ ومناسب لجميع مصادر الحرارة', 'متوسط', 4.5, 'https://m.media-amazon.com/images/I/71WQaEZ8SQL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B08X6F2K9Y?tag=expensetracker-21', ARRAY['مطبخ', 'أواني', 'طبخ', 'منزل'], 0.12, 0.08, true),

('test_book_001', 'amazon', 'books', 'كتاب الذكاء العاطفي - دانييل جولمان', 'كتاب مترجم يشرح أهمية الذكاء العاطفي في النجاح الشخصي والمهني', 'منخفض', 4.7, 'https://m.media-amazon.com/images/I/91YvdGK+MvL._SY522_.jpg', 'https://amazon.sa/dp/B07X6J8M9K?tag=expensetracker-21', ARRAY['كتب', 'تطوير ذات', 'تعليم', 'ثقافة'], 0.15, 0.10, true),

('test_sports_001', 'amazon', 'sports', 'دمبل قابل للتعديل 24 كيلو للتمارين المنزلية', 'دمبل احترافي قابل للتعديل من 2.5 إلى 24 كيلو مع قاعدة تخزين', 'متوسط', 4.4, 'https://m.media-amazon.com/images/I/61Hu2Z3WHXL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B08ZN2K4L7?tag=expensetracker-21', ARRAY['رياضة', 'لياقة', 'تمارين', 'صحة'], 0.10, 0.06, true),

('test_beauty_001', 'amazon', 'beauty', 'كريم ترطيب الوجه بفيتامين C و حمض الهيالورونيك', 'كريم ترطيب مكثف للوجه يحتوي على فيتامين C ومضادات الأكسدة', 'منخفض', 4.3, 'https://m.media-amazon.com/images/I/61rQj9yOwyL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B09M4K6P2X?tag=expensetracker-21', ARRAY['جمال', 'عناية', 'بشرة', 'ترطيب'], 0.14, 0.09, true),

('test_fashion_001', 'amazon', 'fashion', 'ساعة ذكية مقاومة للماء مع مراقبة اللياقة', 'ساعة ذكية متقدمة لمراقبة الصحة واللياقة البدنية مع شاشة AMOLED', 'متوسط', 4.6, 'https://m.media-amazon.com/images/I/61Ks7wLzOUL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B0C4J5H8M9?tag=expensetracker-21', ARRAY['ساعة', 'تقنية', 'لياقة', 'إكسسوار'], 0.09, 0.05, true),

('test_auto_001', 'amazon', 'automotive', 'شاحن سيارة سريع بمنفذين USB-C و USB-A', 'شاحن سيارة متطور بتقنية الشحن السريع وحماية من الزيادة في التيار', 'منخفض', 4.2, 'https://m.media-amazon.com/images/I/61KcYvR4+QL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B08F4X9K2L?tag=expensetracker-21', ARRAY['سيارة', 'شاحن', 'إكسسوار', 'تقنية'], 0.13, 0.07, true),

('test_food_001', 'amazon', 'food', 'عسل طبيعي سدر جبلي أصلي 1 كيلو', 'عسل سدر جبلي طبيعي 100% من المناحل السعودية عالي الجودة', 'متوسط', 4.8, 'https://m.media-amazon.com/images/I/71dK2x8yF8L._AC_SL1500_.jpg', 'https://amazon.sa/dp/B07P9R6K3M?tag=expensetracker-21', ARRAY['عسل', 'طبيعي', 'غذاء', 'صحة'], 0.11, 0.08, true),

('test_office_001', 'amazon', 'office', 'كرسي مكتب مريح مع دعم قطني وذراعين قابلين للتعديل', 'كرسي مكتب إرجونومي مصمم للراحة أثناء العمل مع دعم كامل للظهر', 'مرتفع', 4.5, 'https://m.media-amazon.com/images/I/61nXeQW7PZL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B08G4R5M7N?tag=expensetracker-21', ARRAY['مكتب', 'كرسي', 'عمل', 'راحة'], 0.07, 0.04, true),

('test_toys_001', 'amazon', 'toys', 'لعبة مكعبات بناء تعليمية للأطفال 500 قطعة', 'مجموعة مكعبات بناء آمنة وتعليمية لتطوير مهارات الطفل الإبداعية', 'منخفض', 4.6, 'https://m.media-amazon.com/images/I/81PxY9sJnkL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B09L3K8H4M?tag=expensetracker-21', ARRAY['ألعاب', 'أطفال', 'تعليم', 'إبداع'], 0.16, 0.12, true),

('test_garden_001', 'amazon', 'garden', 'مجموعة أدوات البستنة الأساسية 12 قطعة', 'طقم كامل من أدوات البستنة عالية الجودة للعناية بالنباتات والحدائق', 'متوسط', 4.3, 'https://m.media-amazon.com/images/I/71ZsY4R6VyL._AC_SL1500_.jpg', 'https://amazon.sa/dp/B08W5H7K3P?tag=expensetracker-21', ARRAY['بستنة', 'زراعة', 'أدوات', 'حديقة'], 0.12, 0.09, true);
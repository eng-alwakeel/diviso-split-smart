-- Update Associate ID in all Amazon affiliate products
UPDATE affiliate_products 
SET 
  affiliate_url = REPLACE(affiliate_url, 'tag=expensetracker-21', 'tag=smartgadg050a-21'),
  updated_at = now()
WHERE 
  affiliate_partner = 'amazon' 
  AND affiliate_url LIKE '%tag=expensetracker-21%';
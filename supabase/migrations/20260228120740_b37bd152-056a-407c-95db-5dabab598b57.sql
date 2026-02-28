
-- Step 1: Remap expenses from duplicate category IDs to the original (oldest) one
WITH keeper AS (
  SELECT name_ar, 
         (array_agg(id ORDER BY created_at ASC))[1] as keep_id,
         array_remove(array_agg(id ORDER BY created_at ASC), (array_agg(id ORDER BY created_at ASC))[1]) as dup_ids
  FROM categories
  GROUP BY name_ar
  HAVING COUNT(*) > 1
)
UPDATE expenses e
SET category_id = k.keep_id
FROM keeper k
WHERE e.category_id = ANY(k.dup_ids);

-- Step 2: Remap budget_categories
WITH keeper AS (
  SELECT name_ar, 
         (array_agg(id ORDER BY created_at ASC))[1] as keep_id,
         array_remove(array_agg(id ORDER BY created_at ASC), (array_agg(id ORDER BY created_at ASC))[1]) as dup_ids
  FROM categories
  GROUP BY name_ar
  HAVING COUNT(*) > 1
)
UPDATE budget_categories bc
SET category_id = k.keep_id
FROM keeper k
WHERE bc.category_id = ANY(k.dup_ids);

-- Step 3: Remap budgets
WITH keeper AS (
  SELECT name_ar, 
         (array_agg(id ORDER BY created_at ASC))[1] as keep_id,
         array_remove(array_agg(id ORDER BY created_at ASC), (array_agg(id ORDER BY created_at ASC))[1]) as dup_ids
  FROM categories
  GROUP BY name_ar
  HAVING COUNT(*) > 1
)
UPDATE budgets b
SET category_id = k.keep_id
FROM keeper k
WHERE b.category_id = ANY(k.dup_ids);

-- Step 4: Delete duplicate categories (keep oldest per name_ar)
WITH keeper AS (
  SELECT name_ar, 
         (array_agg(id ORDER BY created_at ASC))[1] as keep_id
  FROM categories
  GROUP BY name_ar
  HAVING COUNT(*) > 1
)
DELETE FROM categories c
USING keeper k
WHERE c.name_ar = k.name_ar AND c.id != k.keep_id;

-- Step 5: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_categories_unique_name ON categories (name_ar);

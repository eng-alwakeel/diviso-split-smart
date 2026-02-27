
-- حذف السجلات المكررة: نبقي فقط الأقدم لكل (inviter_id, invitee_phone)
DELETE FROM referrals r1
USING referrals r2
WHERE r1.id > r2.id
  AND r1.inviter_id = r2.inviter_id
  AND r1.invitee_phone = r2.invitee_phone;

-- إضافة unique constraint لمنع التكرار مستقبلاً
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_inviter_invitee_unique 
ON referrals (inviter_id, invitee_phone);
